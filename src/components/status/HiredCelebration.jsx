import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PartyPopper, Trophy, Sparkles, Star, Rocket } from 'lucide-react';

export default function HiredCelebration({ isOpen, onClose, candidateName, jobTitle, companyName }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowContent(true), 300);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Fireworks effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large firework bursts */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`firework-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 2, 2.5],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 1.5,
                delay: i * 0.4,
                repeat: Infinity,
                repeatDelay: 2.5
              }}
              className="absolute rounded-full"
              style={{ 
                left: `${10 + (i % 3) * 35}%`, 
                top: `${15 + Math.floor(i / 3) * 50}%`,
                width: '100px',
                height: '100px',
                background: `radial-gradient(circle, ${
                  ['rgba(255,0,92,0.8)', 'rgba(255,123,0,0.8)', 'rgba(147,51,234,0.8)', 
                   'rgba(34,197,94,0.8)', 'rgba(59,130,246,0.8)', 'rgba(234,179,8,0.8)'][i]
                } 0%, transparent 60%)`
              }}
            />
          ))}

          {/* Confetti rain */}
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              initial={{ 
                y: -20, 
                x: 0,
                rotate: 0,
                opacity: 1,
              }}
              animate={{ 
                y: window.innerHeight + 50,
                x: Math.sin(i) * 100,
                rotate: Math.random() * 1080,
              }}
              transition={{ 
                duration: 4 + Math.random() * 3,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "linear"
              }}
              className={`absolute ${
                i % 4 === 0 ? 'w-3 h-3 rounded-full' : 
                i % 4 === 1 ? 'w-2 h-5 rounded-sm' : 
                i % 4 === 2 ? 'w-4 h-2 rounded-sm' :
                'w-3 h-3'
              } ${
                ['bg-pink-500', 'bg-orange-500', 'bg-yellow-400', 'bg-purple-500', 
                 'bg-green-400', 'bg-blue-400', 'bg-red-500', 'bg-indigo-500'][i % 8]
              }`}
              style={{ 
                left: `${Math.random() * 100}%`,
                clipPath: i % 4 === 3 ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined
              }}
            />
          ))}

          {/* Sparkle stars */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              initial={{ scale: 0, rotate: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                rotate: 180
              }}
              transition={{ 
                duration: 1,
                delay: Math.random() * 3,
                repeat: Infinity,
                repeatDelay: Math.random() * 2
              }}
              className="absolute"
              style={{ 
                left: `${Math.random() * 100}%`, 
                top: `${Math.random() * 100}%` 
              }}
            >
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.2 }}
          className="bg-white rounded-3xl p-8 max-w-lg w-full text-center relative overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-3xl p-1" style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 50%, #9333EA 100%)' }}>
            <div className="w-full h-full bg-white rounded-3xl" />
          </div>

          <div className="relative">
            {/* Trophy animation */}
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', bounce: 0.5 }}
              className="mb-4"
            >
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotateY: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity }
                }}
                className="inline-block"
              >
                <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}>
                  <Trophy className="w-12 h-12 text-white" />
                </div>
              </motion.div>
            </motion.div>

            {/* Celebration icons */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center gap-4 mb-4"
            >
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}>
                <PartyPopper className="w-8 h-8 text-pink-500" />
              </motion.div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}>
                <Sparkles className="w-8 h-8 text-yellow-500" />
              </motion.div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.4 }}>
                <Rocket className="w-8 h-8 text-purple-500" />
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-4xl font-bold mb-2"
              style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              🎉 Congratulations! 🎉
            </motion.h2>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-2xl font-semibold text-gray-800 mb-1">
                {candidateName || 'Candidate'} is Hired!
              </p>
              <p className="text-gray-600 mb-6">
                as <span className="font-semibold text-pink-600">{jobTitle || 'the position'}</span>
                {companyName && <> at <span className="font-semibold">{companyName}</span></>}
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6"
            >
              <p className="text-green-700 font-medium">
                🚀 A new team member joins the journey!
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <Button
                onClick={onClose}
                className="w-full h-12 rounded-xl text-lg font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
              >
                Celebrate & Continue
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}