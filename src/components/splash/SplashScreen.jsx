import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1200),
      setTimeout(() => setStage(3), 2000),
      setTimeout(() => setStage(4), 3000),
      setTimeout(() => onComplete?.(), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const taglineWords = ['Swipe.', 'Match.', 'Interview.', 'Grow.'];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 1 ? 0.1 : 0 }}
        transition={{ duration: 1 }}
        style={{
          background: 'radial-gradient(circle at 50% 50%, #FF005C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #FF7B00 0%, transparent 40%)'
        }}
      />

      {/* Logo animation */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: stage >= 1 ? 1 : 0, 
          rotate: stage >= 1 ? 0 : -180 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 15,
          duration: 0.8 
        }}
      >
        <motion.img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692f38af6fdc92b66c9e69ba/d908b2b8e_logo.jpg"
          alt="SwipeHire"
          className="w-64 h-auto mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
      </motion.div>

      {/* Tagline animation */}
      <div className="flex gap-2 mt-4 h-8">
        {taglineWords.map((word, index) => (
          <motion.span
            key={word}
            className="text-xl font-semibold italic"
            style={{
              background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: stage >= 2 ? 1 : 0, 
              y: stage >= 2 ? 0 : 20 
            }}
            transition={{ 
              delay: index * 0.15,
              duration: 0.4,
              ease: "easeOut"
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>

      {/* Feature highlights */}
      <motion.div
        className="mt-12 flex flex-col items-center gap-3 text-center px-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ 
          opacity: stage >= 3 ? 1 : 0, 
          y: stage >= 3 ? 0 : 30 
        }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-gray-600 max-w-md">
          The modern way to hire and get hired. Swipe through opportunities, 
          match with perfect fits, and land your dream job or candidate.
        </p>
        
        <div className="flex gap-6 mt-4">
          {[
            { icon: '👆', label: 'Swipe Jobs' },
            { icon: '🤝', label: 'Smart Matching' },
            { icon: '🎥', label: 'Video Intros' },
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: stage >= 3 ? 1 : 0, 
                scale: stage >= 3 ? 1 : 0.8 
              }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <span className="text-2xl">{feature.icon}</span>
              <span className="text-xs text-gray-500">{feature.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="absolute bottom-12 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 4 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #FF005C, #FF7B00)' }}
            initial={{ width: '0%' }}
            animate={{ width: stage >= 4 ? '100%' : '0%' }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </motion.div>
        <span className="text-sm text-gray-400">Loading your experience...</span>
      </motion.div>

      {/* Floating particles */}
      {stage >= 1 && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 2 === 0 ? '#FF005C' : '#FF7B00',
                left: `${20 + i * 12}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0],
                y: [0, -50, -100],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}