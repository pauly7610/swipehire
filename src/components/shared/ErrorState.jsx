import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Reusable Error State Component
 * User-visible error handling (no silent failures)
 */
export default function ErrorState({ 
  title = "Something went wrong",
  description = "We're having trouble loading this content. Please try again.",
  onRetry,
  error,
  className = ""
}) {
  return (
    <Card className={`border-0 shadow-sm dark:bg-slate-900 dark:border-slate-800 ${className}`}>
      <CardContent className="py-12 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {description}
          </p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <details className="text-left mb-4">
              <summary className="text-xs text-gray-400 cursor-pointer mb-2">
                Technical details
              </summary>
              <pre className="text-xs bg-gray-100 dark:bg-slate-800 p-3 rounded-lg overflow-auto max-h-32">
                {error.message || JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
          
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}