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

  it('renders "TEST YOUR KNOWLEDGE" tagline', () => {
    const { getByText } = render(
      <AnimatedSplash onComplete={jest.fn()} ready={false} />
    );
    expect(getByText('TEST YOUR KNOWLEDGE')).toBeTruthy();
  });

  it('initialises shared values for all animated elements', () => {
    render(<AnimatedSplash onComplete={jest.fn()} ready={false} />);

    // 10 shared values:
    // Glow: glowOpacity(0), glowScale(0.8)
    // Icon: iconScale(1)
    // Title: titleOpacity(0), titleTranslateY(30)
    // Tagline: taglineOpacity(0), taglineTranslateY(20)
    // Accent: accentScaleX(0), accentOpacity(0)
    // Container: containerOpacity(1), containerScale(1)
    expect(reanimated.useSharedValue).toHaveBeenCalledWith(0);    // multiple: glowOpacity, titleOpacity, taglineOpacity, accentScaleX, accentOpacity
    expect(reanimated.useSharedValue).toHaveBeenCalledWith(0.8);  // glowScale
    expect(reanimated.useSharedValue).toHaveBeenCalledWith(1);    // iconScale, containerOpacity, containerScale
    expect(reanimated.useSharedValue).toHaveBeenCalledWith(30);   // titleTranslateY
    expect(reanimated.useSharedValue).toHaveBeenCalledWith(20);   // taglineTranslateY
  });

  it('does not animate when nativeSplashHidden is false', () => {
    render(
      <AnimatedSplash onComplete={jest.fn()} ready={false} nativeSplashHidden={false} />
    );

    // No entrance animations should trigger
    expect(reanimated.withTiming).not.toHaveBeenCalled();
    expect(reanimated.withSpring).not.toHaveBeenCalled();
  });

  it('fontsReady alone does NOT trigger entrance animations (regression)', () => {
    render(
      <AnimatedSplash
        onComplete={jest.fn()}
        ready={false}
        fontsReady={true}
        nativeSplashHidden={false}
      />
    );

    // fontsReady is for font families only — animations require nativeSplashHidden
    expect(reanimated.withTiming).not.toHaveBeenCalled();
    expect(reanimated.withSpring).not.toHaveBeenCalled();
  });

  it('starts entrance animations when nativeSplashHidden is true', () => {
    render(
      <AnimatedSplash
        onComplete={jest.fn()}
        ready={false}
        fontsReady={true}
        nativeSplashHidden={true}
      />
    );

    // withTiming called for glow, title, tagline, accent animations
    expect(reanimated.withTiming).toHaveBeenCalled();
    // withSpring called for icon pulse
    expect(reanimated.withSpring).toHaveBeenCalled();
    // withDelay called for staggered title, tagline, accent
    expect(reanimated.withDelay).toHaveBeenCalled();
  });

  it('does not start exit when ready is false', () => {
    render(
      <AnimatedSplash onComplete={jest.fn()} ready={false} nativeSplashHidden={true} />
    );

    // Clear entrance animation calls to isolate exit check
    const timingCallsBeforeReady = reanimated.withTiming.mock.calls.length;

    // No exit-related fade-out should be pending beyond entrance calls
    act(() => {
      jest.runAllTimers();
    });

    // No additional withTiming calls for exit (opacity 0, scale 0.95)
    // The calls should stay the same as entrance only
    expect(reanimated.withTiming.mock.calls.length).toBe(timingCallsBeforeReady);
  });

  it('starts exit animation when ready becomes true', () => {
    const onComplete = jest.fn();
    const { rerender } = render(
      <AnimatedSplash
        onComplete={onComplete}
        ready={false}
        nativeSplashHidden={true}
      />
    );

    reanimated.withTiming.mockClear();

    rerender(
      <AnimatedSplash
        onComplete={onComplete}
        ready={true}
        nativeSplashHidden={true}
      />
    );

    // Flush the MIN_DISPLAY_MS delay
    act(() => {
      jest.runAllTimers();
    });

    // withTiming called for container opacity (0) and container scale (0.95)
    expect(reanimated.withTiming).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ duration: 400 }),
      expect.any(Function)
    );
    expect(reanimated.withTiming).toHaveBeenCalledWith(
      0.95,
      expect.objectContaining({ duration: 400 }),
    );
  });

  it('creates animated styles for all elements', () => {
    render(<AnimatedSplash onComplete={jest.fn()} ready={false} />);

    // 6 animated styles: container, glow, icon, title, tagline, accent
    expect(reanimated.useAnimatedStyle).toHaveBeenCalledTimes(6);
  });
});
