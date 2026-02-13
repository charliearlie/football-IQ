import React from 'react';
import { render } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import { AnimatedSplash } from '../AnimatedSplash';

// Access the mocked reanimated
const reanimated = require('react-native-reanimated');

describe('AnimatedSplash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the icon image', () => {
    const { UNSAFE_getByType } = render(
      <AnimatedSplash onComplete={jest.fn()} ready={false} />
    );
    const { Image } = require('react-native');
    expect(UNSAFE_getByType(Image)).toBeTruthy();
  });

  it('renders "FOOTBALL IQ" text', () => {
    const { getByText } = render(
      <AnimatedSplash onComplete={jest.fn()} ready={false} />
    );
    expect(getByText('FOOTBALL IQ')).toBeTruthy();
  });

  it('initialises shared values for animations', () => {
    render(<AnimatedSplash onComplete={jest.fn()} ready={false} />);

    // 3 shared values: textOpacity, textTranslateY, containerOpacity
    expect(reanimated.useSharedValue).toHaveBeenCalledWith(0);  // textOpacity
    expect(reanimated.useSharedValue).toHaveBeenCalledWith(20); // textTranslateY
    expect(reanimated.useSharedValue).toHaveBeenCalledWith(1);  // containerOpacity
  });

  it('does not animate text when fontsReady is false', () => {
    render(<AnimatedSplash onComplete={jest.fn()} ready={false} fontsReady={false} />);

    // withTiming should NOT be called — text waits for fonts
    expect(reanimated.withTiming).not.toHaveBeenCalled();
  });

  it('starts text animation when fontsReady is true', () => {
    render(<AnimatedSplash onComplete={jest.fn()} ready={false} fontsReady={true} />);

    // withTiming called for text opacity + text translateY
    expect(reanimated.withTiming).toHaveBeenCalled();
  });

  it('does not fade out when ready is false', () => {
    render(<AnimatedSplash onComplete={jest.fn()} ready={false} />);

    // No withDelay should be called — fade-out only triggers when ready=true
    expect(reanimated.withDelay).not.toHaveBeenCalled();
  });

  it('starts fade-out when ready becomes true', () => {
    const onComplete = jest.fn();
    const { rerender } = render(
      <AnimatedSplash onComplete={onComplete} ready={false} />
    );

    reanimated.withTiming.mockClear();

    // Set ready=true — triggers the fade-out useEffect
    rerender(<AnimatedSplash onComplete={onComplete} ready={true} />);

    // Flush the minimum display time delay
    act(() => {
      jest.runAllTimers();
    });

    // withTiming should be called for the container fade-out
    expect(reanimated.withTiming).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ duration: 300 }),
      expect.any(Function)
    );
  });

  it('creates animated styles for text and container', () => {
    render(<AnimatedSplash onComplete={jest.fn()} ready={false} />);

    // useAnimatedStyle called 2 times: text, container
    expect(reanimated.useAnimatedStyle).toHaveBeenCalledTimes(2);
  });
});
