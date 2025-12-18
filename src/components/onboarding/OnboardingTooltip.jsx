import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const ONBOARDING_STEPS = {
  SwipeJobs: [
    {
      id: 'swipe-intro',
      target: null,
      title: '👋 Welcome to Job Swipe!',
      description: 'Swipe right on jobs you love, left to pass. Let\'s find your perfect match!',
      position: 'center'
    },
    {
      id: 'swipe-card',
      title: '🎯 Swipe to Decide',
      description: 'Drag right to apply, left to pass. Or use the buttons below.',
      position: 'bottom'
    },
    {
      id: 'match-score',
      title: '✨ Match Score',
      description: 'We calculate how well you match with each job based on your profile.',
      position: 'top'
    }
  ],
  SwipeCandidates: [
    {
      id: 'swipe-candidates-intro',
      target: null,
      title: '🎯 Find Your Perfect Candidate',
      description: 'Swipe through qualified candidates for your open positions!',
      position: 'center'
    }
  ],
  ATS: [
    {
      id: 'ats-pipeline',
      title: '📊 Your Hiring Pipeline',
      description: 'Drag and drop candidates between stages. They\'ll be notified of status changes.',
      position: 'top'
    },
    {
      id: 'ats-bulk',
      title: '✅ Bulk Actions',
      description: 'Check boxes to select multiple candidates for mass messaging or stage moves.',
      position: 'top'
    }
  ]
};

export default function OnboardingTooltip({ pageName }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const key = `onboarding_${pageName}_completed`;
    const completed = localStorage.getItem(key);
    
    if (!completed && ONBOARDING_STEPS[pageName]) {
      // Show after a short delay
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, [pageName]);

  const steps = ONBOARDING_STEPS[pageName] || [];
  const step = steps[currentStep];

  if (!isVisible || !step) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`onboarding_${pageName}_completed`, 'true');
    setIsVisible(false);
    
    if (window.analytics) {
      window.analytics.track('Onboarding Completed', { page: pageName });
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`onboarding_${pageName}_completed`, 'true');
    setIsVisible(false);
    
    if (window.analytics) {
      window.analytics.track('Onboarding Skipped', { page: pageName, step: currentStep });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleSkip}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 max-w-sm mx-auto left-1/2 -translate-x-1/2"
            style={{
              top: step.position === 'center' ? '50%' : step.position === 'top' ? '20%' : '70%',
              transform: step.position === 'center' ? 'translate(-50%, -50%)' : 'translateX(-50%)'
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 relative">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-gray-900 mb-2 pr-8">{step.title}</h3>
              <p className="text-gray-600 mb-6">{step.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === currentStep ? 'bg-pink-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button variant="outline" size="sm" onClick={handlePrev}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-pink-500 to-orange-500 text-white"
                    size="sm"
                  >
                    {currentStep < steps.length - 1 ? (
                      <>
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      'Got it!'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}