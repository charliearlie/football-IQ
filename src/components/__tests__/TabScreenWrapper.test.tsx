import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TabScreenWrapper } from '../TabScreenWrapper';

describe('TabScreenWrapper', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <TabScreenWrapper>
        <Text>Hello World</Text>
      </TabScreenWrapper>
    );

    expect(getByText('Hello World')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <TabScreenWrapper>
        <Text>First Child</Text>
        <Text>Second Child</Text>
      </TabScreenWrapper>
    );

    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
  });

  it('wraps content in a MotiView (mocked as View)', () => {
    const { toJSON } = render(
      <TabScreenWrapper>
        <Text>Content</Text>
      </TabScreenWrapper>
    );

    // MotiView is mocked as a plain View, so the tree should render
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it('applies flex: 1 container style', () => {
    const { toJSON } = render(
      <TabScreenWrapper>
        <Text>Content</Text>
      </TabScreenWrapper>
    );

    const tree = toJSON();
    // The root wrapper (MotiView mocked as View) should have flex: 1
    const rootStyle = tree?.props?.style;
    const flatStyle = Array.isArray(rootStyle)
      ? Object.assign({}, ...rootStyle.flat())
      : rootStyle;
    expect(flatStyle).toMatchObject({ flex: 1 });
  });
});
