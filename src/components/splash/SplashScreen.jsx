import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, Briefcase, Users, Zap } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 4200)
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-orange-50 overflow-hidden">
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

      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Step 1: Logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: step >= 1 ? 1 : 0, 
            opacity: step >= 1 ? 1 : 0 
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <img 
            src="https://cdn.prod.website-files.com/67543ad139c45da0c6e49d32/67556f5fa0def75a36c32485_Logo%20Black.svg" 
            alt="SwipeHire" 
            className="w-48 h-48 md:w-64 md:h-64 mx-auto"
          />
        </motion.div>

        {/* Step 2: Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: step >= 2 ? 1 : 0,
            y: step >= 2 ? 0 : 20
          }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="swipe-gradient-text">SwipeHire</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Swipe right on jobs you love. Match with companies that want you. 
            Land interviews faster than ever.
          </p>
        </motion.div>

        {/* Step 3: Features & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: step >= 3 ? 1 : 0,
            y: step >= 3 ? 0 : 20
          }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-3 gap-6 mb-10 max-w-md mx-auto">
            {[
              { icon: Briefcase, label: 'Swipe Jobs' },
              { icon: Zap, label: 'Instant Match' },
              { icon: Users, label: 'Get Hired' },
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-lg flex items-center justify-center mb-3">
                  <feature.icon className="w-8 h-8 text-pink-500" />
                </div>
                <p className="text-sm font-semibold text-gray-700">{feature.label}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={onComplete}
            className="swipe-gradient text-white text-lg px-12 py-7 rounded-2xl shadow-2xl hover:shadow-pink-500/50 transition-all hover:scale-105 font-bold"
          >
            Continue
            <ChevronRight className="w-6 h-6 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}