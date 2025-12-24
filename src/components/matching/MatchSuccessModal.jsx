import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageCircle, Briefcase, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';
import audioFeedback from '@/components/shared/AudioFeedback';

export default function MatchSuccessModal({ 
  isOpen, 
  onClose, 
  match, 
  candidate, 
  company, 
  job, 
  viewerType = 'candidate' 
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Play match sound
      audioFeedback.match();
      
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.8 },
            colors: ['#FF005C', '#FF7B00', '#FFD700']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.8 },
            colors: ['#FF005C', '#FF7B00', '#FFD700']
          });
        }
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const chatUrl = viewerType === 'employer' 
    ? createPageUrl('EmployerChat') + `?matchId=${match?.id}`
    : createPageUrl('Chat') + `?matchId=${match?.id}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors z-10"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Animated background gradient */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 animate-pulse" />
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative mb-6"
          >
            <div className="w-20 h-20 mx-auto rounded-full swipe-gradient flex items-center justify-center shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black mb-3"
            style={{
              background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            It's a Match!
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-gray-300 mb-6 text-lg"
          >
            {viewerType === 'candidate' 
              ? `${company?.name || 'This company'} is interested in you for the ${job?.title || 'position'}!`
              : `A candidate matched with your ${job?.title || 'position'}!`
            }
          </motion.p>

          {/* Match Details Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 rounded-2xl p-5 mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {job?.title || 'Position'}
              </span>
              {match?.match_score && (
                <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                  {match.match_score}% Match
                </span>
              )}
            </div>
            <div className="text-left space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span>{company?.name || 'Company'}</span>
              </div>
              {job?.location && (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-gray-400">📍</span>
                  <span>{job.location}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={() => navigate(chatUrl)}
              className="w-full swipe-gradient text-white h-12 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Message Now
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full h-12 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Continue Swiping
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}