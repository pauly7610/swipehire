import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProgressBar({ currentStep, totalSteps, steps }) {
  return (
    <div className="w-full py-6 px-4 bg-white border-b sticky top-0 z-40">
      <div className="max-w-4xl mx-auto">
        {/* Mobile Progress */}
        <div className="md:hidden mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full swipe-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 font-medium">
            {steps[currentStep - 1]?.title}
          </p>
        </div>

        {/* Desktop Progress */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            
            return (
              <React.Fragment key={stepNum}>
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      isCompleted
                        ? 'bg-gradient-to-r from-pink-500 to-orange-500 border-transparent'
                        : isCurrent
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          isCurrent ? 'text-pink-600' : 'text-gray-400'
                        }`}
                      >
                        {stepNum}
                      </span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p
                      className={`text-sm font-medium ${
                        isCurrent ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.subtitle && (
                      <p className="text-xs text-gray-400">{step.subtitle}</p>
                    )}
                  </div>
                </div>
                {stepNum < totalSteps && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-gradient-to-r from-pink-500 to-orange-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}