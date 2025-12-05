import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, User, Building2, Sparkles } from 'lucide-react';

export default function SplashScreen({ onComplete, onSelectRole }) {
  const [showContent, setShowContent] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

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
    }, 350);

    return () => clearInterval(swipeInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background: 'radial-gradient(circle at 30% 20%, #FF005C 0%, transparent 40%), radial-gradient(circle at 70% 80%, #FF7B00 0%, transparent 40%)'
        }}
      />

      {/* Swiping Logo Animation */}
      <div className="relative z-10 h-28 md:h-36 w-full flex items-center justify-center mb-4 overflow-hidden">
        {swipeCount < 4 ? (
          <motion.img
            key={swipeCount}
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692f38af6fdc92b66c9e69ba/d908b2b8e_logo.jpg"
            alt="SwipeHire"
            className="w-40 md:w-52 h-auto absolute"
            initial={{ x: swipeCount % 2 === 0 ? -400 : 400, opacity: 0, rotate: swipeCount % 2 === 0 ? -10 : 10 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            exit={{ x: swipeCount % 2 === 0 ? 400 : -400, opacity: 0 }}
            transition={{ 
              duration: 0.25,
              ease: "easeOut"
            }}
          />
        ) : (
          <motion.img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692f38af6fdc92b66c9e69ba/d908b2b8e_logo.jpg"
            alt="SwipeHire"
            className="w-40 md:w-52 h-auto"
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </div>

      {/* Content - appears after swipes */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-3 md:gap-4 text-center px-6 max-w-md md:max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ 
          opacity: showContent ? 1 : 0, 
          y: showContent ? 0 : 30 
        }}
        transition={{ duration: 0.6 }}
      >
        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Welcome to SwipeHire
        </h1>
        
        {/* Body Message */}
        <p className="text-gray-600 leading-relaxed text-sm md:text-base">
          The hiring world just got an upgrade. SwipeHire is where jobs meet social energy and matching talent with companies feels as easy as swiping through your favorite apps.
        </p>

        <p className="text-gray-700 font-semibold text-sm md:text-base">
          Show who you are. Discover who you need. Connect fast.
        </p>

        <p className="text-gray-600 leading-relaxed text-sm md:text-base">
          Candidates get real visibility. Employers get real talent. Everyone wins without the boring back and forth, black holes or endless forms.
        </p>

        <p className="text-xl md:text-2xl font-bold mt-2" style={{
          background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Swipe. Match. Hire.
        </p>

        <p className="text-base md:text-lg font-semibold" style={{
          background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Welcome to recruiting that finally makes sense.
        </p>

        {/* CTA Button */}
        <Button
          onClick={() => setShowRoleSelection(true)}
          className="mt-6 text-white text-lg px-10 py-6 rounded-2xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all hover:scale-105 font-semibold"
          style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
        >
          Get Started
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Role Selection Overlay */}
      {showRoleSelection && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SwipeHire!</h2>
              <p className="text-gray-600">How would you like to use SwipeHire?</p>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <button
                onClick={() => onSelectRole('candidate')}
                className="w-full group p-5 rounded-2xl border-2 border-gray-200 hover:border-pink-500 transition-all hover:shadow-lg text-left flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <User className="w-7 h-7 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">I'm a Candidate</h3>
                  <p className="text-sm text-gray-500">Find jobs, swipe on opportunities, get hired</p>
                </div>
              </button>

              <button
                onClick={() => onSelectRole('employer')}
                className="w-full group p-5 rounded-2xl border-2 border-gray-200 hover:border-orange-500 transition-all hover:shadow-lg text-left flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Building2 className="w-7 h-7 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">I'm a Recruiter</h3>
                  <p className="text-sm text-gray-500">Post jobs, discover talent, build your team</p>
                </div>
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              You can always switch roles later in settings
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}