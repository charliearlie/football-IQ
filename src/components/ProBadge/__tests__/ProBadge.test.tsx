import React from 'react';
import { render } from '@testing-library/react-native';
import { ProBadge } from '../ProBadge';

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const MockSvg = (props: Record<string, unknown>) =>
    React.createElement('Svg', props, props.children);
  const MockPath = (props: Record<string, unknown>) =>
    React.createElement('Path', props);
  const MockDefs = (props: Record<string, unknown>) =>
    React.createElement('Defs', props, props.children);
  const MockLinearGradient = (props: Record<string, unknown>) =>
    React.createElement('LinearGradient', props, props.children);
  const MockStop = (props: Record<string, unknown>) =>
    React.createElement('Stop', props);
  const MockText = (props: Record<string, unknown>) =>
    React.createElement('SvgText', props, props.children);

  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Path: MockPath,
    Defs: MockDefs,
    LinearGradient: MockLinearGradient,
    Stop: MockStop,
    Text: MockText,
  };
});

describe('ProBadge', () => {
  it('renders an SVG with default size of 24', () => {
    const { getByTestId } = render(<ProBadge testID="pro-badge" />);
    const svg = getByTestId('pro-badge');
    expect(svg).toBeTruthy();
    expect(svg.props.width).toBe(24);
    expect(svg.props.height).toBe(24);
  });

  it('renders with custom size prop', () => {
    const { getByTestId } = render(<ProBadge size={40} testID="pro-badge" />);
    const svg = getByTestId('pro-badge');
    expect(svg.props.width).toBe(40);
    expect(svg.props.height).toBe(40);
  });

  it('renders with small size (7px)', () => {
    const { getByTestId } = render(<ProBadge size={7} testID="pro-badge" />);
    const svg = getByTestId('pro-badge');
    expect(svg.props.width).toBe(7);
    expect(svg.props.height).toBe(7);
  });

  it('uses gradient fill when no color override is provided', () => {
    const { UNSAFE_queryAllByType } = render(<ProBadge testID="pro-badge" />);
    // When no color is provided, a LinearGradient should be in the tree
    const gradients = UNSAFE_queryAllByType('LinearGradient' as any);
    expect(gradients.length).toBeGreaterThan(0);
  });

  it('uses solid fill when color prop is provided', () => {
    const { UNSAFE_queryAllByType } = render(
      <ProBadge color="#0F172A" testID="pro-badge" />
    );
    // When color is provided, no LinearGradient should render
    const gradients = UNSAFE_queryAllByType('LinearGradient' as any);
    expect(gradients.length).toBe(0);
  });

  it('renders "P" text when size >= 24', () => {
    const { toJSON } = render(<ProBadge size={24} testID="pro-badge" />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('\"P\"');
  });

  it('renders "P" text at larger sizes', () => {
    const { toJSON } = render(<ProBadge size={40} testID="pro-badge" />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('\"P\"');
  });

  it('does not render "P" text when size < 24', () => {
    const { toJSON } = render(<ProBadge size={18} testID="pro-badge" />);
    const tree = JSON.stringify(toJSON());
    expect(tree).not.toContain('\"P\"');
  });

  it('does not render "P" text at tiny sizes', () => {
    const { toJSON } = render(<ProBadge size={7} testID="pro-badge" />);
    const tree = JSON.stringify(toJSON());
    expect(tree).not.toContain('\"P\"');
  });
});
