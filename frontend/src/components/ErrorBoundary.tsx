"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[380px] w-full flex items-center justify-center p-6 bg-brand-cream/40 rounded-3xl border border-warmgrey/80 my-8">
          <div className="text-center max-w-md space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-brand-green">
                {this.props.fallbackTitle || "Something went wrong"}
              </h3>
              <p className="text-xs sm:text-sm text-charcoal/70 mt-1 leading-relaxed">
                {this.props.fallbackMessage ||
                  "A momentary glitch occurred while rendering this section. Your orders and data are completely secure."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReset}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Try Again
              </Button>
              <Link href="/">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Home className="w-3.5 h-3.5" />}
                >
                  Return Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
