import React, { useEffect } from 'react';

/**
 * Global Error Logger
 * Catches unhandled errors and logs them for observability
 */
export default function ErrorLogger() {
  useEffect(() => {
    // Log unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('[UNHANDLED REJECTION]', {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
      });
    };

    // Log global errors
    const handleError = (event) => {
      console.error('[GLOBAL ERROR]', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}