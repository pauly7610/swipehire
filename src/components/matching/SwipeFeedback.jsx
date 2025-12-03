import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ThumbsUp, ThumbsDown, DollarSign, MapPin, Users, 
  Briefcase, Code, Building2, Sparkles, X
} from 'lucide-react';
import { motion } from 'framer-motion';

const FEEDBACK_REASONS = [
  { id: 'skills_match', label: 'Skills Match', icon: Code, color: 'bg-blue-100 text-blue-700' },
  { id: 'salary', label: 'Salary', icon: DollarSign, color: 'bg-green-100 text-green-700' },
  { id: 'location', label: 'Location', icon: MapPin, color: 'bg-purple-100 text-purple-700' },
  { id: 'culture', label: 'Culture Fit', icon: Users, color: 'bg-pink-100 text-pink-700' },
  { id: 'experience', label: 'Experience Level', icon: Briefcase, color: 'bg-orange-100 text-orange-700' },
  { id: 'company', label: 'Company', icon: Building2, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'job_type', label: 'Job Type', icon: Sparkles, color: 'bg-amber-100 text-amber-700' },
  { id: 'other', label: 'Other', icon: Sparkles, color: 'bg-gray-100 text-gray-700' },
];

export default function SwipeFeedback({ 
  open, 
  onOpenChange, 
  direction, 
  targetName, 
  onSubmit,
  onSkip 
}) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [comment, setComment] = useState('');

  const isPositive = direction === 'right' || direction === 'super';

  const handleSubmit = () => {
    onSubmit({
      reason: selectedReason,
      is_positive: isPositive,
      comment: comment.trim() || null
    });
    setSelectedReason(null);
    setComment('');
  };

  const handleSkip = () => {
    onSkip();
    setSelectedReason(null);
    setComment('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPositive ? (
              <ThumbsUp className="w-5 h-5 text-green-500" />
            ) : (
              <ThumbsDown className="w-5 h-5 text-red-500" />
            )}
            {isPositive ? 'What made this a good match?' : 'What didn\'t work for you?'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Help us show you better {isPositive ? 'matches' : 'recommendations'} by telling us why you 
            {isPositive ? ' liked ' : ' passed on '} 
            <span className="font-medium text-gray-900">{targetName}</span>
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {FEEDBACK_REASONS.map((reason) => {
              const Icon = reason.icon;
              const isSelected = selectedReason === reason.id;
              return (
                <motion.button
                  key={reason.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${reason.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{reason.label}</span>
                </motion.button>
              );
            })}
          </div>

          <Textarea
            placeholder="Add more details (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mb-4"
            rows={2}
          />

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedReason}
              className="flex-1"
              style={{ background: selectedReason ? 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' : undefined }}
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}