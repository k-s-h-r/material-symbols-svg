# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.13] - 2025-09-07

### Changed
- Update to Material Symbols v0.35.0 (from v0.34.1)

## [0.1.12] - 2025-08-15

### Changed
- Update to Material Symbols v0.34.1 (from v0.33.0)

### Internal
- Set packages to unreleased state for proper version management

## [0.1.11] - 2025-07-20

### Added
- Add ESLint configuration with proper TypeScript support (.eslintrc.js)

### Changed
- Update all package lint scripts to run from root directory for shared dependencies
- Configure lint commands to use relative path approach (cd ../..)

### Fixed
- Fix ESLint configuration to handle TypeScript files properly
- Fix lint script execution issues across all packages

### Internal
- Update icon metadata with AI-generated categories (119 icons processed automatically)

## [0.1.10] - 2025-07-19

### Added
- Add dependency synchronization script (scripts/sync-dependencies.cjs)
- Add AI-powered icon categorization using OpenAI GPT-4o-mini
- Add automatic search term generation with category classification
- Add unreleased version management system for better release workflow
- Add comprehensive version tracking (package_version + material_symbols_version)
- Add upstream version monitoring with metadata/source/upstream-version.json
- Add support for Material Symbols v0.33.0 (3,657 icons)

### Changed
- Modify dependency sync to add @material-symbols/svg-* packages to 'dependencies' instead of 'devDependencies'
- Update all package build scripts to include dependency synchronization step
- Enhance update-history.json format with version tracking information
- Integrate search term generation to automatically run categorization
- Rename metadata/icon-index.json to metadata/icon-catalog.json for clarity
- Update bump-version.cjs to handle unreleased → released version transitions properly
- Use actual published package versions instead of root package.json version for tracking

### Fixed
- Fix JSON parsing for OpenAI API responses with markdown code blocks
- Fix package version detection in metadata tracking
- Fix unreleased version bump logic (0.1.10-unreleased → 0.1.10, not 0.1.11)

### Removed
- Remove unused metadata/source/current_versions.json
- Remove setPackagesUnreleased function per workflow optimization

## [0.1.9] - 2025-07-19

### Changed
- Update documentation URLs to custom domain
  - Replace Vercel deployment URLs (material-symbols-svg.vercel.app) with custom domain (material-symbols-svg.com)
  - Updated across all package.json files and README files

## [0.1.8] - 2025-07-10

### Fixed
- Fix metadata icon naming to match component naming convention
  - Icons starting with numbers now correctly use 'Icon' prefix in metadata
  - Example: '3d_rotation' → 'Icon3dRotation'
  - Ensures consistency between actual React/Vue component names and metadata

## [0.1.7] - 2025-07-06

### Changed
- Update all 7 packages to version 0.1.7
- Maintain version synchronization across React, Vue, and metadata packages
- Prepare for potential package publication

### Documentation
- Update sync:upstream command and remove unnecessary backup creation
- Update documentation to reflect current project state

### Internal
- Add automatic version management system

[Unreleased]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.13...HEAD
[0.1.13]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.12...v0.1.13
[0.1.12]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.11...v0.1.12
[0.1.11]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.10...v0.1.11
[0.1.10]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.9...v0.1.10
[0.1.9]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/k-s-h-r/material-symbols-svg/releases/tag/v0.1.7