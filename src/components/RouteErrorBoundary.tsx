import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

/**
 * Isolates render failures to the authenticated route tree so one bad page
 * does not blank the entire SPA shell (login, providers, chrome).
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: undefined };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
          <p className="font-display text-lg font-semibold">Something went wrong</p>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {this.state.message ?? "An unexpected error occurred while rendering this page."}
          </p>
          <Button type="button" variant="outline" onClick={() => this.setState({ hasError: false, message: undefined })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
