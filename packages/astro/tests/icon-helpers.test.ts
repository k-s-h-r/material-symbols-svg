import { describe, expect, it } from 'vitest';
import { hasA11yProps, mergeStyle, shouldHideIcon } from '../src/icon-helpers';

describe('astro icon helpers', () => {
  it('detects accessibility props generically', () => {
    expect(hasA11yProps({ 'aria-labelledby': 'icon-title' })).toBe(true);
    expect(hasA11yProps({ role: 'img' })).toBe(true);
    expect(hasA11yProps({ title: 'Home icon' })).toBe(true);
    expect(hasA11yProps({ class: 'icon' })).toBe(false);
  });

  it('hides only decorative icons without slots', () => {
    expect(shouldHideIcon({}, false)).toBe(true);
    expect(shouldHideIcon({ 'aria-label': 'Home' }, false)).toBe(false);
    expect(shouldHideIcon({}, true)).toBe(false);
  });

  it('merges color with string and object styles', () => {
    expect(mergeStyle('#123456', undefined)).toBe('color: #123456;');
    expect(mergeStyle('#123456', 'display: block')).toBe('display: block; color: #123456;');
    expect(mergeStyle('#123456', { display: 'block' })).toEqual({
      display: 'block',
      color: '#123456',
    });
  });
});
