import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Zap, RotateCcw } from 'lucide-react';
import audioFeedback from '@/components/shared/AudioFeedback';

export default function SwipeControls({ onSwipe, onUndo, canUndo, isPremium, onInteraction }) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSwipe('right');
      } else if (e.key === 'ArrowUp' && isPremium) {
        e.preventDefault();
        onSwipe('super');
      } else if ((e.key === 'z' && (e.metaKey || e.ctrlKey)) && canUndo) {
        e.preventDefault();
        onUndo();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onSwipe, onUndo, canUndo, isPremium]);
  
  return (
    <div className="fixed bottom-24 md:bottom-8 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-center justify-center gap-4 pointer-events-auto">
        {/* Undo Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (canUndo) {
              audioFeedback.click();
              onUndo();
            }
          }}
          disabled={!canUndo}
          className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-gray-400 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>

        {/* Pass Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            audioFeedback.click();
            onSwipe('left');
          }}
          className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-gray-400 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:border-red-500 dark:hover:border-red-400 border-2 border-gray-200 dark:border-slate-700 transition-all"
        >
          <X className="w-8 h-8" />
        </motion.button>

        {/* Super Swipe Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (isPremium) {
              audioFeedback.click();
              onSwipe('super');
            }
          }}
          disabled={!isPremium}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
            isPremium 
              ? 'swipe-gradient text-white cursor-pointer' 
              : 'bg-gray-300 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
          }`}
        >
          <Zap className="w-7 h-7" />
        </motion.button>

        {/* Like Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            audioFeedback.click();
            onSwipe('right');
          }}
          className="w-16 h-16 rounded-full swipe-gradient shadow-lg shadow-pink-500/30 dark:shadow-pink-500/10 flex items-center justify-center text-white"
        >
          <Heart className="w-8 h-8" />
        </motion.button>

        {/* Placeholder for symmetry */}
        <div className="w-12 h-12" />
      </div>
    </div>
  );
}