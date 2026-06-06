import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  correlationId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      correlationId: (error as any).correlationId 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, correlationId: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="max-w-md w-full p-8 border-destructive/50 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground mb-6">
                An unexpected error occurred while rendering this section.
              </p>
              
              {this.state.correlationId && (
                <div className="bg-muted p-3 rounded-md mb-6 w-full text-left">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Request Correlation ID
                  </p>
                  <code className="text-sm font-mono break-all text-foreground">
                    {this.state.correlationId}
                  </code>
                </div>
              )}

              <Button onClick={this.handleReset} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
