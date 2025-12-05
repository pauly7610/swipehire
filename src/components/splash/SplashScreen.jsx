import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1200),
      setTimeout(() => setStage(3), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const taglineWords = ['Swipe.', 'Match.', 'Hire.'];

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

      {/* Content */}
      <motion.div
        className="mt-8 flex flex-col items-center gap-4 text-center px-6 max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ 
          opacity: stage >= 3 ? 1 : 0, 
          y: stage >= 3 ? 0 : 30 
        }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome to SwipeHire
        </h2>
        
        <p className="text-gray-600 leading-relaxed">
          The hiring world just got an upgrade. SwipeHire is where jobs meet social energy and matching talent with companies feels as easy as swiping through your favorite apps.
        </p>
        
        <p className="text-gray-700 font-medium">
          Show who you are. Discover who you need. Connect fast.
        </p>
        
        <p className="text-gray-600 leading-relaxed">
          Candidates get real visibility. Employers get real talent. Everyone wins without the boring back and forth, black holes or endless forms.
        </p>

        <p className="text-lg font-semibold mt-2" style={{
          background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Welcome to recruiting that finally makes sense.
        </p>

        <Button
          onClick={onComplete}
          className="mt-6 text-white text-lg px-8 py-6 rounded-2xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
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