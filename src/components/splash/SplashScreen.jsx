import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, Briefcase, Users, Zap } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [showContent, setShowContent] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);

  useEffect(() => {
    // Show content immediately after logo swipes
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Logo swipes animation
    if (swipeCount < 3) {
      const timer = setTimeout(() => {
        setSwipeCount(prev => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [swipeCount]);

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

      {/* Logo Animation */}
      <div className="relative z-10 mb-8">
        {swipeCount < 3 ? (
          <motion.div
            key={swipeCount}
            className="w-24 h-24 md:w-32 md:h-32 rounded-3xl swipe-gradient flex items-center justify-center shadow-2xl"
            initial={{ x: swipeCount % 2 === 0 ? -200 : 200, opacity: 0, rotate: swipeCount % 2 === 0 ? -15 : 15 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <span className="text-white font-bold text-4xl md:text-5xl">SH</span>
          </motion.div>
        ) : (
          <motion.div
            className="w-24 h-24 md:w-32 md:h-32 rounded-3xl swipe-gradient flex items-center justify-center shadow-2xl"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="text-white font-bold text-4xl md:text-5xl">SH</span>
          </motion.div>
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