import React from 'react';
import { PostHogProvider } from 'posthog-react-native';

interface SafePostHogProviderProps {
  children: React.ReactNode;
  apiKey: string;
  options?: any;
  autocapture?: any;
}

class PostHogErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[SafePostHogProvider] PostHog failed to initialize:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function SafePostHogProvider({
  children,
  apiKey,
  options,
  autocapture,
}: SafePostHogProviderProps) {
  return (
    <PostHogErrorBoundary fallback={children}>
      <PostHogProvider
        apiKey={apiKey}
        options={options}
        autocapture={autocapture}
      >
        {children}
      </PostHogProvider>
    </PostHogErrorBoundary>
  );
}
