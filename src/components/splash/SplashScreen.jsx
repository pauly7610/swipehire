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
        {/* Step 1: Logo with Swipe Animation */}
        <motion.div
          initial={{ x: -200, opacity: 0 }}
          animate={{ 
            x: step >= 1 ? 0 : -200, 
            opacity: step >= 1 ? 1 : 0 
          }}
          transition={{ 
            duration: 0.6, 
            ease: "easeOut",
            type: "spring",
            stiffness: 100
          }}
          className="mb-8"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692f38af6fdc92b66c9e69ba/04083b079_swipehire_no_bg.png" 
            alt="SwipeHire" 
            className="w-48 h-48 md:w-56 md:h-56 mx-auto object-contain"
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
          <p className="text-gray-600 text-xl md:text-2xl leading-relaxed mb-8 font-medium">
            Swipe right on jobs you love.<br/>
            Match with companies that want you.<br/>
            <span className="swipe-gradient-text font-bold">Land interviews faster than ever.</span>
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