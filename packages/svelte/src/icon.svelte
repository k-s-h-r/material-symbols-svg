<script lang="ts">
  import type { InternalIconProps } from './types';

  export let iconName: InternalIconProps['iconName'] = undefined;
  export let pathData: InternalIconProps['pathData'];
  export let size: InternalIconProps['size'] = 24;
  export let color: InternalIconProps['color'] = undefined;
  export let fill: string | undefined = undefined;

  let className: InternalIconProps['class'] = undefined;
  export { className as class };

  const hasA11yProp = (props: Record<string, unknown>): boolean => (
    'aria-label' in props ||
    'aria-labelledby' in props ||
    'role' in props ||
    'title' in props
  );

  $: combinedClassName = [
    'material-symbols',
    iconName ? `material-symbols_${iconName}` : '',
    className
  ].filter(Boolean).join(' ');

  $: pathFill = fill === undefined ? 'currentColor' : undefined;
</script>

<svg
  {...(!hasA11yProp($$restProps) ? { 'aria-hidden': 'true' } : undefined)}
  {...$$restProps}
  width={size}
  height={size}
  viewBox="0 -960 960 960"
  fill={fill ?? 'none'}
  xmlns="http://www.w3.org/2000/svg"
  class={combinedClassName}
  style:color={color}
>
  <path d={pathData} fill={pathFill} />
  <slot />
</svg>
