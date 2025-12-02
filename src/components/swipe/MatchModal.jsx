import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageCircle, Briefcase, Sparkles, Calendar, PartyPopper, Star, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';

export default function MatchModal({ isOpen, onClose, match, candidate, company, job, viewerType = 'candidate' }) {
  const navigate = useNavigate();
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FF005C', '#FF7B00', '#FFD700']
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fireworks Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Confetti */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                initial={{ 
                  y: -20, 
                  x: Math.random() * 400 - 200,
                  rotate: 0,
                  opacity: 1,
                  scale: 0
                }}
                animate={{ 
                  y: 600,
                  rotate: Math.random() * 720,
                  opacity: [1, 1, 0],
                  scale: [0, 1, 1]
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 0.8,
                  repeat: Infinity
                }}
                className={`absolute ${
                  i % 3 === 0 ? 'w-3 h-3 rounded-full' : i % 3 === 1 ? 'w-2 h-4 rounded-sm' : 'w-4 h-2 rounded-sm'
                } ${
                  ['bg-pink-500', 'bg-orange-500', 'bg-yellow-400', 'bg-purple-500', 'bg-green-400', 'bg-blue-400'][i % 6]
                }`}
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
            
            {/* Sparkle bursts */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`burst-${i}`}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ 
                  scale: [0, 1.5, 0],
                  opacity: [1, 0.8, 0]
                }}
                transition={{ 
                  duration: 1.5,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="absolute w-8 h-8 rounded-full"
                style={{ 
                  left: `${15 + (i % 4) * 25}%`, 
                  top: `${20 + Math.floor(i / 4) * 40}%`,
                  background: 'radial-gradient(circle, rgba(255,0,92,0.6) 0%, transparent 70%)'
                }}
              />
            ))}

            {/* Shooting stars */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                initial={{ x: -50, y: 100 + i * 60, opacity: 0 }}
                animate={{ 
                  x: [null, 500],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 1,
                  delay: 0.5 + i * 0.4,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="absolute w-12 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent"
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="relative"
          >
            <Sparkles className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold swipe-gradient-text mb-2"
          >
            It's a Match!
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8"
          >
            {candidate 
              ? `You matched with ${company?.name || 'the company'} for ${job?.title || 'this position'}!`
              : `${candidate?.headline || 'This candidate'} is interested in your ${job?.title} position!`
            }
          </motion.p>

          {/* Profile Pictures */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center items-center gap-4 mb-8"
          >
            <div className="w-24 h-24 rounded-full swipe-gradient p-1">
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {candidate?.photo_url ? (
                  <img src={candidate.photo_url} alt="Candidate" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {candidate?.headline?.charAt(0) || 'C'}
                  </span>
                )}
              </div>
            </div>

            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-12 h-12 rounded-full swipe-gradient flex items-center justify-center"
            >
              <span className="text-white text-2xl">💕</span>
            </motion.div>

            <div className="w-24 h-24 rounded-full swipe-gradient p-1">
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="Company" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {company?.name?.charAt(0) || 'C'}
                  </span>
                )}
              </div>
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
              onClick={() => navigate(createPageUrl('Chat') + `?matchId=${match?.id}`)}
              className="w-full swipe-gradient text-white h-12 rounded-xl text-lg font-semibold"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start a Conversation
            </Button>
            {viewerType === 'candidate' && (
              <Button
                onClick={() => navigate(createPageUrl('Chat') + `?matchId=${match?.id}&scheduleInterview=true`)}
                variant="outline"
                className="w-full h-12 rounded-xl border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Interview
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full h-12 rounded-xl text-gray-600"
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Keep Swiping
            </Button>
          </motion.div>

          {/* Floating hearts animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`heart-${i}`}
                initial={{ y: 400, x: 50 + i * 60, opacity: 0, scale: 0 }}
                animate={{ 
                  y: -100, 
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.5]
                }}
                transition={{ 
                  duration: 4,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              >
                <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}