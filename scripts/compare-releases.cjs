#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

/**
 * Load update history
 */
async function loadUpdateHistory() {
  const historyPath = path.join(__dirname, '../metadata/update-history.json');
  
  try {
    const data = await readFile(historyPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load update history:', error.message);
    return { updates: [] };
  }
}

/**
 * Load icon index for current state
 */
async function loadIconIndex() {
  const iconCatalogPath = path.join(__dirname, '../metadata/icon-catalog.json');
  
  try {
    const data = await readFile(iconCatalogPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load icon index:', error.message);
    return {};
  }
}

/**
 * Get differences between two releases
 */
function getReleaseDiff(fromUpdate, toUpdate) {
  if (!fromUpdate || !toUpdate) {
    return {
      added: [],
      updated: [],
      removed: [],
      timespan: 'N/A'
    };
  }

  // Calculate timespan
  const fromDate = new Date(fromUpdate.timestamp);
  const toDate = new Date(toUpdate.timestamp);
  const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));

  return {
    added: toUpdate.added || [],
    updated: toUpdate.updated || [],
    removed: toUpdate.removed || [],
    timespan: daysDiff > 0 ? `${daysDiff} days` : 'Same day',
    fromDate: fromDate.toLocaleDateString(),
    toDate: toDate.toLocaleDateString()
  };
}

/**
 * Get cumulative changes since a specific date
 */
function getCumulativeChanges(history, sinceDate) {
  const cutoffDate = new Date(sinceDate);
  const relevantUpdates = history.updates.filter(update => 
    new Date(update.timestamp) >= cutoffDate
  );

  const cumulative = {
    added: new Set(),
    updated: new Set(),
    removed: new Set(),
    updateCount: relevantUpdates.length,
    firstUpdate: relevantUpdates[relevantUpdates.length - 1]?.timestamp,
    lastUpdate: relevantUpdates[0]?.timestamp
  };

  relevantUpdates.reverse().forEach(update => {
    (update.added || []).forEach(icon => cumulative.added.add(icon));
    (update.updated || []).forEach(icon => cumulative.updated.add(icon));
    (update.removed || []).forEach(icon => cumulative.removed.add(icon));
  });

  return {
    added: Array.from(cumulative.added),
    updated: Array.from(cumulative.updated),
    removed: Array.from(cumulative.removed),
    updateCount: cumulative.updateCount,
    firstUpdate: cumulative.firstUpdate,
    lastUpdate: cumulative.lastUpdate,
    timespan: cumulative.firstUpdate && cumulative.lastUpdate ? 
      `${Math.ceil((new Date(cumulative.lastUpdate) - new Date(cumulative.firstUpdate)) / (1000 * 60 * 60 * 24))} days` : 
      'N/A'
  };
}

/**
 * Display comparison results
 */
function displayComparison(diff, title) {
  console.log(`\n=== ${title} ===`);
  console.log(`Period: ${diff.fromDate || 'N/A'} → ${diff.toDate || new Date().toLocaleDateString()}`);
  console.log(`Timespan: ${diff.timespan}`);
  console.log(`Added: ${diff.added.length}`);
  console.log(`Updated: ${diff.updated.length}`);
  console.log(`Removed: ${diff.removed.length}`);

  if (diff.added.length > 0) {
    console.log(`\nAdded icons (${diff.added.length}):`);
    diff.added.slice(0, 20).forEach(icon => console.log(`  + ${icon}`));
    if (diff.added.length > 20) {
      console.log(`  ... and ${diff.added.length - 20} more`);
    }
  }

  if (diff.updated.length > 0) {
    console.log(`\nUpdated icons (${diff.updated.length}):`);
    diff.updated.slice(0, 20).forEach(icon => console.log(`  ~ ${icon}`));
    if (diff.updated.length > 20) {
      console.log(`  ... and ${diff.updated.length - 20} more`);
    }
  }

  if (diff.removed.length > 0) {
    console.log(`\nRemoved icons (${diff.removed.length}):`);
    diff.removed.slice(0, 20).forEach(icon => console.log(`  - ${icon}`));
    if (diff.removed.length > 20) {
      console.log(`  ... and ${diff.removed.length - 20} more`);
    }
  }
}

/**
 * Main comparison function
 */
async function compareReleases(args) {
  console.log('Loading release comparison data...');
  
  const history = await loadUpdateHistory();
  const iconIndex = await loadIconIndex();
  
  if (history.updates.length === 0) {
    console.log('No update history found. Run metadata sync first.');
    return;
  }

  console.log(`Found ${history.updates.length} updates in history`);
  console.log(`Current total icons: ${Object.keys(iconIndex).length}`);

  // Parse command line arguments
  const command = args[0];
  
  switch (command) {
    case 'latest': {
      // Show latest changes
      const latestUpdate = history.updates[0];
      if (latestUpdate) {
        const diff = {
          added: latestUpdate.added || [],
          updated: latestUpdate.updated || [],
          removed: latestUpdate.removed || [],
          timespan: 'Latest update',
          toDate: new Date(latestUpdate.timestamp).toLocaleDateString()
        };
        displayComparison(diff, 'Latest Changes');
      } else {
        console.log('No recent updates found.');
      }
      break;
    }
    case 'since': {
      // Show changes since specific date
      const sinceDate = args[1];
      if (!sinceDate) {
        console.log('Usage: node compare-releases.cjs since YYYY-MM-DD');
        return;
      }
      
      const cumulativeDiff = getCumulativeChanges(history, sinceDate);
      const diff = {
        added: cumulativeDiff.added,
        updated: cumulativeDiff.updated,
        removed: cumulativeDiff.removed,
        timespan: cumulativeDiff.timespan,
        fromDate: sinceDate,
        toDate: new Date().toLocaleDateString()
      };
      displayComparison(diff, `Changes Since ${sinceDate}`);
      break;
    }
    case 'between': {
      // Show changes between two updates (by index)
      const fromIndex = parseInt(args[1]);
      const toIndex = parseInt(args[2]);
      
      if (isNaN(fromIndex) || isNaN(toIndex)) {
        console.log('Usage: node compare-releases.cjs between <from_index> <to_index>');
        console.log('Available updates (0 = latest):');
        history.updates.slice(0, 10).forEach((update, i) => {
          console.log(`  ${i}: ${new Date(update.timestamp).toLocaleDateString()}`);
        });
        return;
      }

      const fromUpdate = history.updates[fromIndex];
      const toUpdate = history.updates[toIndex];
      
      if (!fromUpdate || !toUpdate) {
        console.log(`Invalid indices. Available range: 0-${history.updates.length - 1}`);
        return;
      }

      const betweenDiff = getReleaseDiff(toUpdate, fromUpdate);
      displayComparison(betweenDiff, `Changes Between Releases`);
      break;
    }
    case 'summary':
    default: {
      // Show summary of recent activity
      console.log('\n=== Release Summary ===');
      
      if (history.updates.length > 0) {
        const latestUpdate = history.updates[0];
        const oldestUpdate = history.updates[history.updates.length - 1];
        
        console.log(`Latest update: ${new Date(latestUpdate.timestamp).toLocaleDateString()}`);
        console.log(`Oldest recorded: ${new Date(oldestUpdate.timestamp).toLocaleDateString()}`);
        
        // Show recent updates
        console.log('\nRecent Updates:');
        history.updates.slice(0, 5).forEach((update, i) => {
          const date = new Date(update.timestamp).toLocaleDateString();
          const added = (update.added || []).length;
          const updated = (update.updated || []).length;
          const removed = (update.removed || []).length;
          const total = added + updated + removed;
          
          console.log(`  ${i + 1}. ${date}: ${total} changes (${added}+, ${updated}~, ${removed}-)`);
        });

        // Show cumulative stats for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentDiff = getCumulativeChanges(history, thirtyDaysAgo.toISOString());
        console.log('\nLast 30 Days Summary:');
        console.log(`  Updates: ${recentDiff.updateCount}`);
        console.log(`  Added: ${recentDiff.added.length} icons`);
        console.log(`  Updated: ${recentDiff.updated.length} icons`);
        console.log(`  Removed: ${recentDiff.removed.length} icons`);
      }
      
      console.log('\nUsage:');
      console.log('  node compare-releases.cjs summary        - Show summary (default)');
      console.log('  node compare-releases.cjs latest         - Show latest changes');
      console.log('  node compare-releases.cjs since DATE     - Show changes since date (YYYY-MM-DD)');
      console.log('  node compare-releases.cjs between X Y    - Show changes between two updates');
      break;
    }
  }
}

// Run if script is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  compareReleases(args).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { compareReleases, loadUpdateHistory, getCumulativeChanges };