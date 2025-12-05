import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [showContent, setShowContent] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);

  useEffect(() => {
    // Logo swipes across 4 times, then content appears
    const swipeInterval = setInterval(() => {
      setSwipeCount(prev => {
        if (prev >= 4) {
          clearInterval(swipeInterval);
          setShowContent(true);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(swipeInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #FF005C 0%, transparent 50%), radial-gradient(circle at 80% 70%, #FF7B00 0%, transparent 40%)'
        }}
      />

      {/* Swiping Logo Animation */}
      <div className="relative z-10 h-32 w-full flex items-center justify-center mb-8 overflow-hidden">
        {swipeCount < 4 ? (
          <motion.img
            key={swipeCount}
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692f38af6fdc92b66c9e69ba/d908b2b8e_logo.jpg"
            alt="SwipeHire"
            className="w-48 h-auto absolute"
            initial={{ x: swipeCount % 2 === 0 ? -400 : 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: swipeCount % 2 === 0 ? 400 : -400, opacity: 0 }}
            transition={{ 
              duration: 0.3,
              ease: "easeOut"
            }}
          />
        ) : (
          <motion.img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692f38af6fdc92b66c9e69ba/d908b2b8e_logo.jpg"
            alt="SwipeHire"
            className="w-48 h-auto"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </div>

      {/* Content - appears after swipes */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-4 text-center px-6 max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ 
          opacity: showContent ? 1 : 0, 
          y: showContent ? 0 : 30 
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

        <p className="text-xl font-bold mt-2" style={{
          background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Swipe. Match. Hire.
        </p>
        
        <p className="text-lg font-semibold" style={{
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
    </div>
  );
}