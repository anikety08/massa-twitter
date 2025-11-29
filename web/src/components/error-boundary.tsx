"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#020617]">
          <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/20 to-slate-900/80 p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-slate-300 mb-6">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="w-full"
              >
                Reload Page
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                }}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6">
                <summary className="text-sm text-slate-400 cursor-pointer mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="text-xs text-slate-500 bg-slate-900/50 p-4 rounded overflow-auto max-h-48">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

