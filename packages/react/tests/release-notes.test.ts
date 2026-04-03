import { describe, expect, it } from 'vitest';
import { extractReleaseNotes, stripManagedWeeklyIconUpdateSection } from '../../../scripts/release.ts';

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

  it('removes the managed weekly icon update block before creating a release section', () => {
    expect(
      stripManagedWeeklyIconUpdateSection([
        '',
        '### Notes',
        '- Keep this note.',
        '',
        '<!-- weekly-icon-update:start -->',
        '### Changed',
        '- Sync upstream Material Symbols from `0.43.0` to `0.44.0`.',
        '<!-- weekly-icon-update:end -->',
        '',
      ]),
    ).toEqual([
      '### Notes',
      '- Keep this note.',
    ]);
  });
});
