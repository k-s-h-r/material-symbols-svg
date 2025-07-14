# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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