import { describe, expect, it } from 'vitest';
import { hasA11yProp, mergeStyle, shouldHideIcon } from '../src/icon-helpers';

describe('vue icon helpers', () => {
  it('detects accessibility props generically', () => {
    expect(hasA11yProp({ 'aria-labelledby': 'icon-title' })).toBe(true);
    expect(hasA11yProp({ role: 'img' })).toBe(true);
    expect(hasA11yProp({ title: 'Home icon' })).toBe(false);
    expect(hasA11yProp({ class: 'icon' })).toBe(false);
  });

  it('hides only decorative icons without slots', () => {
    expect(shouldHideIcon({}, false)).toBe(true);
    expect(shouldHideIcon({ 'aria-label': 'Home' }, false)).toBe(false);
    expect(shouldHideIcon({}, true)).toBe(false);
  });

  it('merges color into incoming style values', () => {
    expect(mergeStyle('#123456', undefined)).toEqual({ color: '#123456' });
    expect(mergeStyle('#123456', 'display: block')).toEqual(['display: block', { color: '#123456' }]);
    expect(mergeStyle('#123456', { display: 'block' })).toEqual([{ display: 'block' }, { color: '#123456' }]);
  });
});
