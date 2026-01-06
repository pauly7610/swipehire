import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { colors, radius, shadows, zIndex } from '@/lib/design-system';

/**
 * Bottom Sheet Component
 * Native mobile-style bottom sheet with drag-to-dismiss
 */
export default function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = [0.5, 0.9], // Fraction of screen height
  initialSnap = 0, // Index of snapPoints
  showHandle = true,
  showClose = true,
  title,
  footer,
  className = ''
}) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef(null);

  // Convert snap points to pixel values
  const getSnapHeight = (snapIndex) => {
    return window.innerHeight * snapPoints[snapIndex];
  };

  // Handle drag end - snap to nearest point or close
  const handleDragEnd = (event, info) => {
    setIsDragging(false);

    const velocity = info.velocity.y;
    const offset = info.offset.y;
    const currentHeight = getSnapHeight(currentSnap);

    // Fast swipe down = close
    if (velocity > 500) {
      onClose?.();
      return;
    }

    // Dragged down significantly = close
    if (offset > currentHeight * 0.4) {
      onClose?.();
      return;
    }

    // Find nearest snap point
    const draggedHeight = currentHeight - offset;
    let nearestSnap = 0;
    let minDiff = Infinity;

    snapPoints.forEach((snap, index) => {
      const snapHeight = getSnapHeight(index);
      const diff = Math.abs(snapHeight - draggedHeight);
      if (diff < minDiff) {
        minDiff = diff;
        nearestSnap = index;
      }
    });

    setCurrentSnap(nearestSnap);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: zIndex.modalBackdrop }}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{
              y: `${(1 - snapPoints[currentSnap]) * 100}%`,
            }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: isDragging ? 300 : 400,
              damping: isDragging ? 30 : 35,
              mass: 0.8
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className={`fixed inset-x-0 bottom-0 bg-white dark:bg-gray-900 flex flex-col ${className}`}
            style={{
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              boxShadow: shadows['2xl'],
              zIndex: zIndex.modal,
              maxHeight: `${snapPoints[snapPoints.length - 1] * 100}vh`,
              touchAction: 'none'
            }}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div
                  className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"
                />
              </div>
            )}

            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                {title && (
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-6">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Bottom Sheet Content Wrapper
 * Provides consistent padding for content
 */
export function BottomSheetContent({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Bottom Sheet Section
 * For organizing content with headers
 */
export function BottomSheetSection({ title, children, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
