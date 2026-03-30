import React, { forwardRef, useImperativeHandle } from 'react';
import { vi } from 'vitest';

vi.mock('react-native-svg', () => {
  const Svg = forwardRef<Record<string, unknown>, Record<string, unknown>>((props, ref) => {
    useImperativeHandle(ref, () => ({
      kind: 'svg',
      props,
    }));

    return React.createElement('svg', props, props.children);
  });

  Svg.displayName = 'Svg';

  const Path = (props: Record<string, unknown>) => React.createElement('path', props);

  return {
    Svg,
    Path,
  };
});
