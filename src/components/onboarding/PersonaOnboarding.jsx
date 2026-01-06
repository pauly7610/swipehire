import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { colors, springs } from '@/lib/design-system';

/**
 * Persona Detection Onboarding
 * Beautiful, minimal questionnaire to customize the experience
 */
export default function PersonaOnboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});

  // Onboarding questions
  const questions = [
    {
      id: 'searchStatus',
      question: "What's your job search status?",
      options: [
        {
          value: 'active',
          label: 'Actively looking',
          description: 'Need a job soon, applying frequently',
          emoji: '🎯'
        },
        {
          value: 'passive',
          label: 'Casually exploring',
          description: 'Employed, open to perfect opportunities',
          emoji: '🔍'
        },
        {
          value: 'dream',
          label: 'Dream job hunting',
          description: 'Only interested in exceptional roles',
          emoji: '✨'
        }
      ]
    },
    {
      id: 'priorities',
      question: 'What matters most to you?',
      options: [
        {
          value: 'compensation',
          label: 'Salary & benefits',
          description: 'Maximizing compensation',
          emoji: '💰'
        },
        {
          value: 'balance',
          label: 'Work-life balance',
          description: 'Flexibility and personal time',
          emoji: '⚖️'
        },
        {
          value: 'growth',
          label: 'Learning & growth',
          description: 'Career development opportunities',
          emoji: '📈'
        },
        {
          value: 'mission',
          label: 'Company mission',
          description: 'Making an impact',
          emoji: '🚀'
        }
      ]
    },
    {
      id: 'applicationStyle',
      question: 'How do you like to apply?',
      options: [
        {
          value: 'auto',
          label: 'Quick apply',
          description: 'AI does everything, I keep swiping',
          emoji: '⚡'
        },
        {
          value: 'review',
          label: 'Review before submit',
          description: 'I approve each application',
          emoji: '👀'
        },
        {
          value: 'custom',
          label: 'Custom apply',
          description: 'I write my own materials',
          emoji: '✍️'
        }
      ]
    },
    {
      id: 'experienceLevel',
      question: 'Your experience level?',
      options: [
        {
          value: 'entry',
          label: 'Entry level',
          description: '0-2 years of experience',
          emoji: '🌱'
        },
        {
          value: 'mid',
          label: 'Mid-level',
          description: '3-7 years of experience',
          emoji: '🌿'
        },
        {
          value: 'senior',
          label: 'Senior',
          description: '8-15 years of experience',
          emoji: '🌳'
        },
        {
          value: 'executive',
          label: 'Executive',
          description: '15+ years of experience',
          emoji: '🏔️'
        }
      ]
    },
    {
      id: 'workLocation',
      question: 'Ideal work format?',
      options: [
        {
          value: 'remote',
          label: 'Remote only',
          description: 'Work from anywhere',
          emoji: '🏠'
        },
        {
          value: 'hybrid',
          label: 'Hybrid',
          description: 'Mix of office and remote',
          emoji: '🏢'
        },
        {
          value: 'office',
          label: 'In-office',
          description: 'Full-time in office',
          emoji: '🏙️'
        },
        {
          value: 'flexible',
          label: 'Flexible',
          description: 'Open to any format',
          emoji: '🌍'
        }
      ]
    }
  ];

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  // Handle option selection
  const handleSelect = (value) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Move to next step or complete
    if (isLastStep) {
      completeOnboarding(newAnswers);
    } else {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 300);
    }
  };

  // Complete onboarding and detect persona
  const completeOnboarding = (finalAnswers) => {
    const persona = detectPersona(finalAnswers);
    onComplete?.(persona, finalAnswers);
  };

  // Detect persona from answers
  const detectPersona = (answers) => {
    // Quick Finder: Active, Quick Apply, Entry/Mid level
    if (
      answers.searchStatus === 'active' &&
      answers.applicationStyle === 'auto'
    ) {
      return {
        type: 'quick-finder',
        name: 'Quick Finder',
        description: 'High-volume, fast applications',
        features: {
          autoApply: true,
          showUrgency: true,
          dailyGoals: true,
          quickFilters: true
        }
      };
    }

    // Dream Hunter: Passive/Dream, Review/Custom, Senior/Executive
    if (
      (answers.searchStatus === 'passive' || answers.searchStatus === 'dream') &&
      (answers.applicationStyle === 'review' || answers.applicationStyle === 'custom')
    ) {
      return {
        type: 'dream-hunter',
        name: 'Dream Hunter',
        description: 'Selective, quality-focused',
        features: {
          autoApply: false,
          detailedInsights: true,
          weeklyDigest: true,
          deepResearch: true
        }
      };
    }

    // Career Changer: Entry with specific priorities
    if (answers.experienceLevel === 'entry' && answers.priorities === 'growth') {
      return {
        type: 'career-changer',
        name: 'Career Changer',
        description: 'Growing skills, exploring paths',
        features: {
          skillHighlighting: true,
          learningResources: true,
          transferableSkills: true
        }
      };
    }

    // Default: Balanced Seeker
    return {
      type: 'balanced-seeker',
      name: 'Balanced Seeker',
      description: 'Balanced approach to job search',
      features: {
        autoApply: answers.applicationStyle === 'auto',
        moderateVolume: true,
        flexibleFilters: true
      }
    };
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex gap-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
            >
              <motion.div
                className="h-full"
                style={{ background: colors.primary.gradient }}
                initial={{ width: 0 }}
                animate={{
                  width: index <= currentStep ? '100%' : '0%'
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          Question {currentStep + 1} of {questions.length}
        </p>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={springs.smooth}
          className="w-full max-w-md"
        >
          {/* Question */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springs.bouncy}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-lg mb-4"
            >
              <Sparkles className="w-8 h-8" style={{ color: colors.primary.DEFAULT }} />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {currentQuestion.question}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose the option that best describes you
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, ...springs.smooth }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(option.value)}
                className="w-full p-6 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-all text-left group"
                style={{
                  boxShadow: answers[currentQuestion.id] === option.value
                    ? `0 0 0 3px ${colors.primary.light}`
                    : 'none'
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Emoji */}
                  <div className="text-3xl">{option.emoji}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                      {option.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => completeOnboarding(answers)}
        className="mt-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
      >
        Skip personalization
      </motion.button>
    </div>
  );
}
