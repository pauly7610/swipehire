import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MinimalJobCard from './MinimalJobCard';
import { Loader2 } from 'lucide-react';

/**
 * SwipeStack - Manages stack of swipeable cards
 * Infinite scroll feeling with prefetching
 */
export default function SwipeStack({
  jobs = [],
  onSwipe,
  onCardTap,
  onNeedMore,
  isLoading = false
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState([]);

  // Initialize cards from jobs
  useEffect(() => {
    if (jobs.length > 0) {
      setCards(jobs);
    }
  }, [jobs]);

  // Prefetch more cards when running low
  useEffect(() => {
    const remainingCards = cards.length - currentIndex;
    if (remainingCards <= 5 && !isLoading) {
      onNeedMore?.();
    }
  }, [currentIndex, cards.length, isLoading, onNeedMore]);

  // Handle swipe action
  const handleSwipe = (job, direction) => {
    onSwipe?.(job, direction);

    // Move to next card after short delay
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 100);
  };

  // Handle card tap
  const handleCardTap = (job) => {
    onCardTap?.(job);
  };

  // Get visible cards (current + next 2 for stacking effect)
  const visibleCards = cards.slice(currentIndex, currentIndex + 3);
  const hasCards = visibleCards.length > 0;

  // Calculate if we're out of cards
  const isOutOfCards = currentIndex >= cards.length && !isLoading;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Card Stack */}
      <div className="relative w-full h-full">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((job, index) => {
            const cardIndex = currentIndex + index;
            const isTop = index === 0;

            return (
              <motion.div
                key={job.id || cardIndex}
                className="absolute inset-0"
                initial={{
                  scale: 1 - index * 0.05,
                  y: index * 10,
                  opacity: 1 - index * 0.3,
                  zIndex: 100 - index,
                }}
                animate={{
                  scale: 1 - index * 0.05,
                  y: index * 10,
                  opacity: 1 - index * 0.3,
                  zIndex: 100 - index,
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.2 },
                }}
                style={{
                  pointerEvents: isTop ? 'auto' : 'none',
                }}
              >
                <MinimalJobCard
                  job={job}
                  onSwipe={handleSwipe}
                  onTap={handleCardTap}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Out of cards message */}
        {isOutOfCards && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              You've seen all jobs!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Check back later for new opportunities or adjust your preferences
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-shadow"
            >
              Refresh Jobs
            </button>
          </motion.div>
        )}

        {/* Loading indicator */}
        {isLoading && !hasCards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-gray-600 dark:text-gray-400">
                Finding perfect matches...
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Card counter */}
      {hasCards && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentIndex + 1} / {cards.length}
            {isLoading && ' · Loading more...'}
          </p>
        </div>
      )}
    </div>
  );
}
