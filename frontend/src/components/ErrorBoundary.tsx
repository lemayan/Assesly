import React from 'react';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="container py-10">
          <div className="text-red-600 mb-2">Something went wrong while loading this page.</div>
          {this.state.message && (
            <div className="text-sm text-gray-600 dark:text-gray-300">{this.state.message}</div>
          )}
          <div className="mt-4">
            <a href="/" className="px-3 py-2 rounded bg-blue-600 text-white">Back to Dashboard</a>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary;
