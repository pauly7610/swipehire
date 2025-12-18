import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DealBreakerModal({ open, onOpenChange, dealBreakers, onProceed, onCancel, targetName }) {
  if (!dealBreakers || dealBreakers.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Deal Breaker Warning
          </DialogTitle>
          <DialogDescription>
            This {targetName} doesn't meet some of your requirements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-gray-700 mb-3">
              The following requirements aren't met:
            </p>
            <div className="space-y-2">
              {dealBreakers.map((violation, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <X className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{violation.text}</p>
                    {violation.reason && (
                      <p className="text-xs text-gray-600 mt-1">{violation.reason}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">You can still proceed</p>
                <p className="text-xs text-blue-700 mt-1">
                  Deal breakers are preferences, not strict requirements. You can choose to continue if you think this might still be a good fit.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Go Back
          </Button>
          <Button
            onClick={onProceed}
            className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white"
          >
            Proceed Anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}