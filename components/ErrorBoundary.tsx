"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught:", error, info);
    }
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="grid place-items-center h-full p-6 text-center text-sm text-ink/60">
            Da hat was geknackt.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
