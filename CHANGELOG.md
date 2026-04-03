# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-04-03

<!-- weekly-icon-update:start -->
### Changed
- Sync upstream Material Symbols from `0.43.0` to `0.44.0`.

### Added
- Icons: `blinds_2`, `blinds_2_closed`, `garage_door_open`, `light_group_2`, `lightstrip`, `shades`, `shades_closed`, `soundbar`, `speaker_2`, `subwoofer`, `switch_off`, `vacuum_2`, `vacuum_2_on`

### Changed
- Updated icons: `garage_door`, `switch`

### Removed
- Icons: `fitbit_raquetball`

<!-- weekly-icon-update:end -->

## [0.3.4] - 2026-04-03

### Added
- Add `Home` / `HomeFill` named aliases to deep icon import modules across React, Vue, Svelte, Astro, and React Native so `icons/*` can expose the default W400 variants alongside explicit weight exports

### Changed
- Update framework package READMEs and test fixtures to document and verify the named deep-import alias pattern

## [0.3.3] - 2026-04-01

### Changed
- Update framework package READMEs with measured import guidance, including deep-import recommendations for React, Vue, Svelte, and Astro
- Clarify Astro-specific import performance guidance with separate observations for Astro 5 and Astro 6

### Fixed
- Emit Astro runtime helper output alongside `icon.astro` so Astro package consumers can resolve `./icon-helpers` correctly

## [0.3.2] - 2026-04-01

### Changed
- Simplify generated icon exports across React, Vue, Astro, and Svelte by relying on the factory return type instead of repeating per-export type annotations
- Normalize Astro and React Native declaration output to keep `MaterialSymbolsComponent` as the published component type alias

### Fixed
- Return Svelte 5-native components from `@material-symbols-svg/svelte` so icons work with standard `<Home />` usage without legacy class-component wrappers

## [0.3.1] - 2026-03-31

### Added
- Add `@material-symbols-svg/astro`, `@material-symbols-svg/svelte`, and `@material-symbols-svg/react-native` packages
- Add PR CI for `pnpm test` and `pnpm lint`

### Changed
- Align icon exports, accessibility defaults, and style handling across the web framework packages
- Upgrade Vitest and expand component-level render coverage across framework packages

### Fixed
- Stabilize React and React Native tests so they pass in CI without depending on generated files from a prior build
- Align Astro publish metadata and package author metadata with the other published packages

## [0.3.0] - 2026-03-27

## [0.2.0] - 2026-03-23

## [0.1.22] - 2026-02-15

## [0.1.19] - 2025-12-13

### Fixed
- Filter missing upstream icons before metadata generation to prevent build errors

## [0.1.18] - 2025-12-13

### Changed
- Update icon metadata

## [0.1.17] - 2025-12-13

### Fixed
- Improve tree-shaking for weight-specific imports by adding `/*#__PURE__*/` annotations to generated icon exports (#8)

### Changed
- Clarify that bundle size optimization is bundler-dependent and document tree-shaking limitations (#8)
- Add Next.js `experimental.optimizePackageImports` configuration guidance to reduce dev-time memory usage (#8)

## [0.1.16] - 2025-12-13

### Fixed
- Include metadata build in main build script to ensure icon-index.json is generated before package builds
- Update icon metadata after full build to include newly detected icons

## [0.1.15] - 2025-12-13

### Changed
- Update to Material Symbols v0.40.2 (from v0.35.0)

## [0.1.14] - 2025-09-07

### Fixed
- Fix Material Symbols v0.35.0 implementation

### Documentation
- Update README.md

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

[Unreleased]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.3.4...v0.4.0
[0.3.4]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.2.1...v0.3.0
[0.2.0]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.23...v0.2.0
[0.1.22]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.19...v0.1.22
[0.1.19]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.18...v0.1.19
[0.1.18]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.17...v0.1.18
[0.1.17]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.16...v0.1.17
[0.1.16]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.15...v0.1.16
[0.1.15]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.14...v0.1.15
[0.1.14]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.13...v0.1.14
[0.1.13]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.12...v0.1.13
[0.1.12]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.11...v0.1.12
[0.1.11]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.10...v0.1.11
[0.1.10]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.9...v0.1.10
[0.1.9]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/k-s-h-r/material-symbols-svg/releases/tag/v0.1.7
