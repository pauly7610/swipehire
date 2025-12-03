import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User, Building2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoleSelectionModal({ open, onSelect }) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl"
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
              onClick={() => onSelect('candidate')}
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
              onClick={() => onSelect('employer')}
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
      </DialogContent>
    </Dialog>
  );
}