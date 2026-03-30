import { describe, expect, it } from 'vitest';
import { hasA11yProp, shouldHideIcon } from '../src/icon-helpers';

describe('svelte icon helpers', () => {
  it('detects accessibility props generically', () => {
    expect(hasA11yProp({ 'aria-labelledby': 'icon-title' })).toBe(true);
    expect(hasA11yProp({ role: 'img' })).toBe(true);
    expect(hasA11yProp({ title: 'Home icon' })).toBe(true);
    expect(hasA11yProp({ class: 'icon' })).toBe(false);
  });

  it('hides only decorative icons without slots', () => {
    expect(shouldHideIcon({}, false)).toBe(true);
    expect(shouldHideIcon({ 'aria-label': 'Home' }, false)).toBe(false);
    expect(shouldHideIcon({}, true)).toBe(false);
  });
});
