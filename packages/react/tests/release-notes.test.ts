import { describe, expect, it } from 'vitest';
import { extractReleaseNotes, finalizeChangelogContent } from '../../../scripts/release.ts';

describe('extractReleaseNotes', () => {
  it('returns the version section body instead of the fallback title', () => {
    const changelog = `# Changelog

## [Unreleased]

## [0.4.0] - 2026-04-03

### Changed
- Sync upstream Material Symbols from \`0.43.0\` to \`0.44.0\`.

### Added
- Icons: \`alpha_icon\`

[Unreleased]: https://example.com/compare/v0.4.0...HEAD
[0.4.0]: https://example.com/compare/v0.3.4...v0.4.0
`;

    expect(extractReleaseNotes(changelog, '0.4.0')).toBe(`### Changed
- Sync upstream Material Symbols from \`0.43.0\` to \`0.44.0\`.

### Added
- Icons: \`alpha_icon\``);
  });

  it('preserves the managed weekly icon update block when finalizing a release section', () => {
    const changelog = `# Changelog

## [Unreleased]

### Notes
- Keep this note.

<!-- weekly-icon-update:start -->
### Changed
- Sync upstream Material Symbols from \`0.44.0\` to \`0.44.1\`.

### Added
- Icons: \`bolt_boost\`
<!-- weekly-icon-update:end -->

## [0.4.0] - 2026-04-03

[Unreleased]: https://example.com/compare/v0.4.0...HEAD
[0.4.0]: https://example.com/compare/v0.3.4...v0.4.0
`;

    const { content, notes } = finalizeChangelogContent({
      changelogContent: changelog,
      newVersion: '0.5.0',
      previousVersion: '0.4.0',
      releaseDate: '2026-04-12',
    });

    expect(content).toContain(`## [0.5.0] - 2026-04-12

### Notes
- Keep this note.

<!-- weekly-icon-update:start -->
### Changed
- Sync upstream Material Symbols from \`0.44.0\` to \`0.44.1\`.

### Added
- Icons: \`bolt_boost\`
<!-- weekly-icon-update:end -->`);
    expect(notes).toContain('<!-- weekly-icon-update:start -->');
    expect(notes).toContain('- Icons: `bolt_boost`');
  });
});
