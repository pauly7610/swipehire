import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

/**
 * Reusable Empty State Component
 * Ensures no blank screens across the platform
 */
export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  actionVariant = "default",
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
          {Icon && (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900/30 dark:to-orange-900/30 flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8 text-pink-500 dark:text-pink-400" />
            </div>
          )}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {description}
            </p>
          )}
          {actionLabel && onAction && (
            <Button 
              onClick={onAction}
              variant={actionVariant}
              className={actionVariant === 'default' ? 'swipe-gradient text-white' : ''}
            >
              {actionLabel}
            </Button>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}