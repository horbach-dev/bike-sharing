import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";
import { ErrorScreen } from "@/app/ui/error-screen";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application rendering error", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) return <ErrorScreen />;
    return this.props.children;
  }
}
