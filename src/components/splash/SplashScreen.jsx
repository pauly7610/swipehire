import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, Briefcase, Users, Zap } from 'lucide-react';

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
    }, 350);

    return () => clearInterval(swipeInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      
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
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692f38af6fdc92b66c9e69ba/2157521a9_ChatGPTImageDec5202507_24_55AM.png"
            alt="SwipeHire"
            className="w-40 md:w-52 h-auto object-contain absolute"
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
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692f38af6fdc92b66c9e69ba/2157521a9_ChatGPTImageDec5202507_24_55AM.png"
            alt="SwipeHire"
            className="w-40 md:w-52 h-auto object-contain"
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </div>

      {/* Content - appears after swipes */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-3 text-center px-6 max-w-md md:max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ 
          opacity: showContent ? 1 : 0, 
          y: showContent ? 0 : 30 
        }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2">
          Swipe Into Your
          <br />
          <span className="swipe-gradient-text">Next Opportunity</span>
        </h1>

        <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-2">
          SwipeHire is where jobs meet social energy. Matching talent with companies feels as easy as swiping through your favorite apps.
        </p>

        <p className="text-xl md:text-2xl font-bold swipe-gradient-text">
          Swipe. Match. Hire.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-sm">
          {[
            { icon: Briefcase, label: 'Find Jobs' },
            { icon: Users, label: 'Connect' },
            { icon: Zap, label: 'Get Hired' },
          ].map((feature, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center mb-2">
                <feature.icon className="w-6 h-6 text-pink-500" />
              </div>
              <p className="text-xs font-medium text-gray-700">{feature.label}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={onComplete}
          className="mt-6 text-white text-lg px-10 py-6 rounded-2xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all hover:scale-105 font-semibold swipe-gradient"
        >
          Get Started
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}