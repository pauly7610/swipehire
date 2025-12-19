import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Target, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function JobCardInsightPanel({ isOpen, onToggle, job, matchScore, company }) {
  return (
    <>
      {/* Toggle Button - Always Visible */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-white/95 backdrop-blur-xl rounded-full shadow-lg flex items-center gap-2 border border-gray-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-4 h-4 text-pink-500" />
        <span className="text-xs font-bold text-gray-800">AI Insights</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </motion.div>
      </motion.button>

      {/* Expandable Panel - Swipe-Safe */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 z-20 bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-gray-200"
            style={{ maxHeight: '60vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '55vh' }}>
              {/* AI Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 tracking-wide">AI INTELLIGENCE</p>
                  <p className="text-sm font-semibold text-gray-800">Why this may be a fit</p>
                </div>
              </div>

              {/* Match Score */}
              {matchScore && (
                <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-green-700">MATCH SCORE</span>
                    <span className="text-2xl font-black text-green-600">{matchScore}%</span>
                  </div>
                  <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${matchScore}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Alignment Section */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <h4 className="text-sm font-bold text-gray-800">Strong Alignment</h4>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                    <span>Role matches your {job.experience_level} experience level</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                    <span>Company culture aligns with your preferences</span>
                  </li>
                  {job.skills_required && job.skills_required.length > 0 && (
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                      <span>You have {Math.floor(job.skills_required.length * 0.7)} of {job.skills_required.length} key skills</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Recruiter Insights */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-purple-500" />
                  <h4 className="text-sm font-bold text-gray-800">What Recruiters Look For</h4>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                    <span>Strong communication skills and cultural fit</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                    <span>Relevant experience in {job.job_type} roles</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                    <span>Passion for the industry and growth mindset</span>
                  </li>
                </ul>
              </div>

              {/* Day in the Life Preview */}
              {company && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 mb-2 tracking-wide">TYPICAL DAY</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Start with team standup, collaborate on projects, attend client meetings, and contribute to strategic initiatives. 
                    Hybrid work with {job.job_type === 'remote' ? 'full remote flexibility' : '2-3 days in office'}.
                  </p>
                </div>
              )}

              {/* Company Signals */}
              {company && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="bg-blue-50 text-blue-700 border-0 text-xs font-semibold">
                    {company.size} employees
                  </Badge>
                  <Badge className="bg-green-50 text-green-700 border-0 text-xs font-semibold">
                    Growth stage
                  </Badge>
                  <Badge className="bg-purple-50 text-purple-700 border-0 text-xs font-semibold">
                    Competitive comp
                  </Badge>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}