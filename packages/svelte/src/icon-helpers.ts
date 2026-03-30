export function hasA11yProp(props: Record<string, unknown>): boolean {
  for (const prop in props) {
    if (prop.startsWith('aria-') || prop === 'role' || prop === 'title') {
      return true;
    }
  }

  return false;
}

export function shouldHideIcon(props: Record<string, unknown>, hasDefaultSlot: boolean): boolean {
  return !hasDefaultSlot && !hasA11yProp(props);
}
