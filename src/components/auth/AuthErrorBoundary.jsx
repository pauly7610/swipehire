import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

/**
 * Auth Error Boundary - catches auth-specific errors
 * Prevents cascading failures from logging users out
 */
export default class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AuthErrorBoundary] Caught error:', error, errorInfo);
    
    // Log to analytics if available
    if (window.analytics) {
      window.analytics.track('Auth Error Caught', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }

    // Track error count
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        window.location.href = createPageUrl('SwipeJobs');
      } else {
        window.location.href = createPageUrl('Welcome');
      }
    } catch {
      window.location.href = createPageUrl('Welcome');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-6">
                {this.state.errorCount > 2 
                  ? "We're having trouble loading this page. Please try refreshing or contact support if the issue persists."
                  : "Don't worry - your data is safe. Try refreshing the page."
                }
              </p>
              
              {this.state.error && (
                <details className="text-left mb-6 p-3 bg-gray-100 rounded-lg">
                  <summary className="text-sm text-gray-700 cursor-pointer font-medium">
                    Error Details
                  </summary>
                  <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}