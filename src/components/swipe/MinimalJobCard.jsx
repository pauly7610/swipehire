import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';
import { Heart, X, Sparkles, MapPin, DollarSign, Clock } from 'lucide-react';
import { colors, radius, shadows, springs } from '@/lib/design-system';

/**
 * Minimal Job Card - Sorce-inspired design
 * Beautiful, clean, swipeable card with smooth gestures
 */
export default function MinimalJobCard({ job, onSwipe, onTap }) {
  const [exitDirection, setExitDirection] = useState(null);

  // Motion values for drag
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform values based on drag position
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  // Like/Pass overlay opacity
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  // Handle drag end
  const handleDragEnd = (event, info) => {
    const threshold = 150;
    const velocity = info.velocity.x;

    // Swipe right (like/apply)
    if (info.offset.x > threshold || velocity > 500) {
      setExitDirection('right');
      onSwipe?.(job, 'like');
      triggerHaptic('success');
    }
    // Swipe left (pass)
    else if (info.offset.x < -threshold || velocity < -500) {
      setExitDirection('left');
      onSwipe?.(job, 'pass');
      triggerHaptic('medium');
    }
    // Swipe up (super like)
    else if (info.offset.y < -threshold || velocity < -500) {
      setExitDirection('up');
      onSwipe?.(job, 'superlike');
      triggerHaptic('success');
    }
  };

  // Trigger haptic feedback (if supported)
  const triggerHaptic = (type) => {
    if (window.navigator?.vibrate) {
      const patterns = {
        light: 10,
        medium: 20,
        success: [10, 50, 10],
      };
      window.navigator.vibrate(patterns[type] || 20);
    }
  };

  // Format salary
  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const format = (num) => `$${(num / 1000).toFixed(0)}k`;
    if (min && max) return `${format(min)}-${format(max)}`;
    return format(min || max);
  };

  // Card variants for exit animations
  const cardVariants = {
    center: { x: 0, y: 0, rotate: 0, opacity: 1 },
    exit: {
      x: exitDirection === 'right' ? 500 : exitDirection === 'left' ? -500 : 0,
      y: exitDirection === 'up' ? -500 : 0,
      rotate: exitDirection === 'right' ? 25 : exitDirection === 'left' ? -25 : 0,
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
      initial="center"
      animate={exitDirection ? 'exit' : 'center'}
      variants={cardVariants}
      style={{ x, y, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      onClick={() => onTap?.(job)}
    >
      {/* Main Card */}
      <div
        className="relative w-[90vw] max-w-[420px] h-[calc(100vh-280px)] max-h-[600px] rounded-[24px] overflow-hidden"
        style={{
          boxShadow: shadows.xl,
          background: colors.bg.DEFAULT,
        }}
      >
        {/* Company Image/Brand */}
        <div className="relative w-full h-[60%] overflow-hidden bg-gradient-to-br from-pink-100 to-orange-100">
          {job.company?.logo ? (
            <img
              src={job.company.logo}
              alt={job.company.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div
                className="text-8xl font-bold"
                style={{ color: colors.primary.DEFAULT }}
              >
                {job.company?.name?.charAt(0) || 'J'}
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Match Score Badge */}
          <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-lg">
            <Sparkles className="w-4 h-4" style={{ color: colors.success.DEFAULT }} />
            <span className="font-semibold text-lg">{job.matchScore || 95}%</span>
          </div>

          {/* Quick Apply Badge */}
          {job.quickApply && (
            <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-primary/95 backdrop-blur-md shadow-lg">
              <span className="text-white text-sm font-medium">⚡ Quick Apply</span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-gray-900">
          {/* Job Title */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
            {job.title}
          </h3>

          {/* Company Name */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {job.company?.name}
          </p>

          {/* Meta Information */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Location */}
            {job.location && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {job.remote ? 'Remote' : job.location}
                </span>
              </div>
            )}

            {/* Salary */}
            {(job.salaryMin || job.salaryMax) && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </span>
              </div>
            )}

            {/* Posted Time */}
            {job.postedAt && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getTimeAgo(job.postedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Call to Action Hint */}
          <div className="flex items-center justify-center py-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Swipe right to apply · Left to pass
            </p>
          </div>
        </div>

        {/* Like Overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            opacity: likeOpacity,
            background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(78, 205, 196, 0.5))',
          }}
        >
          <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-white shadow-2xl transform rotate-12">
            <Heart className="w-10 h-10 fill-current" style={{ color: colors.success.DEFAULT }} />
            <span className="text-3xl font-bold" style={{ color: colors.success.DEFAULT }}>
              APPLY
            </span>
          </div>
        </motion.div>

        {/* Pass Overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            opacity: passOpacity,
            background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 107, 107, 0.5))',
          }}
        >
          <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-white shadow-2xl transform -rotate-12">
            <X className="w-10 h-10" style={{ color: colors.primary.DEFAULT }} />
            <span className="text-3xl font-bold" style={{ color: colors.primary.DEFAULT }}>
              PASS
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Helper function to get time ago
function getTimeAgo(date) {
  const now = new Date();
  const posted = new Date(date);
  const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
}
