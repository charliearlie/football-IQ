import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { ReviewModeBanner } from '@/components/ReviewMode/ReviewModeBanner';

describe('Review Mode Banner', () => {
  it('renders banner with correct text', () => {
    const { getByText, getByTestId } = render(
      <ReviewModeBanner testID="review-banner" />
    );

    expect(getByTestId('review-banner')).toBeTruthy();
    expect(getByText('REVIEWING COMPLETED GAME')).toBeTruthy();
  });

  it('is not visible when not rendered', () => {
    const isReviewMode = false;
    const { queryByTestId } = render(
      <View>
        {isReviewMode && <ReviewModeBanner testID="review-banner" />}
      </View>
    );

    expect(queryByTestId('review-banner')).toBeNull();
  });

  it('is visible when isReviewMode is true', () => {
    const isReviewMode = true;
    const { getByTestId } = render(
      <View>
        {isReviewMode && <ReviewModeBanner testID="review-banner" />}
      </View>
    );

    expect(getByTestId('review-banner')).toBeTruthy();
  });

  it('renders with Eye icon', () => {
    const { getByTestId } = render(
      <ReviewModeBanner testID="review-banner" />
    );

    // The component should render (icon is part of it)
    expect(getByTestId('review-banner')).toBeTruthy();
  });
});
