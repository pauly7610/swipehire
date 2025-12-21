import React from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import audioFeedback from '@/components/shared/AudioFeedback';

/**
 * Persistent mobile swipe action buttons
 * Fixed to bottom of screen, always visible
 */
export default function MobileSwipeActions({ onSwipe, isPremium, disabled }) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
      className="fixed bottom-20 md:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none"
    >
      <div className="max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200 dark:border-slate-700 rounded-full shadow-2xl p-3 pointer-events-auto">
        <div className="flex items-center justify-between gap-3">
          {/* Pass Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              audioFeedback.click();
              onSwipe('left');
            }}
            disabled={disabled}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all min-h-[60px]",
              "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30",
              "border-2 border-red-200 dark:border-red-900/50",
              "active:scale-95 active:bg-red-100 dark:active:bg-red-900/40",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
              <X className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Pass</span>
          </motion.button>

          {/* Super Like Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isPremium) {
                audioFeedback.click();
                onSwipe('super');
              }
            }}
            disabled={!isPremium || disabled}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 py-3 px-4 rounded-2xl transition-all min-h-[60px]",
              isPremium
                ? "swipe-gradient shadow-lg shadow-pink-500/30 dark:shadow-pink-500/10"
                : "bg-gray-200 dark:bg-slate-700",
              "active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
              isPremium ? "bg-white/20" : "bg-gray-300 dark:bg-slate-600"
            )}>
              <Zap className={cn(
                "w-5 h-5",
                isPremium ? "text-white" : "text-gray-400 dark:text-gray-500"
              )} />
            </div>
            <span className={cn(
              "text-xs font-bold uppercase tracking-wide",
              isPremium ? "text-white" : "text-gray-400 dark:text-gray-500"
            )}>
              Super
            </span>
          </motion.button>

          {/* Like Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              audioFeedback.click();
              onSwipe('right');
            }}
            disabled={disabled}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all min-h-[60px]",
              "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
              "border-2 border-green-200 dark:border-green-900/50",
              "active:scale-95 active:bg-green-100 dark:active:bg-green-900/40",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 text-green-500 dark:text-green-400 fill-green-500 dark:fill-green-400" />
            </div>
            <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Like</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}