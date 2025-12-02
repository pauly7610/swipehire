import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageCircle, Briefcase, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MatchModal({ isOpen, onClose, match, candidate, company, job }) {
  const navigate = useNavigate();

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
          {/* Confetti Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -20, 
                  x: Math.random() * 400 - 200,
                  rotate: 0,
                  opacity: 1 
                }}
                animate={{ 
                  y: 500,
                  rotate: Math.random() * 360,
                  opacity: 0
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  repeat: Infinity
                }}
                className={`absolute w-3 h-3 rounded-full ${
                  ['bg-pink-500', 'bg-orange-500', 'bg-yellow-400', 'bg-purple-500'][i % 4]
                }`}
                style={{ left: `${Math.random() * 100}%` }}
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
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full h-12 rounded-xl text-gray-600"
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Keep Swiping
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}