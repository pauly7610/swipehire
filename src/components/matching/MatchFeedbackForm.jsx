import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Star, MessageSquare, Loader2, CheckCircle2, 
  TrendingUp, TrendingDown, Minus, Brain
} from 'lucide-react';

export default function MatchFeedbackForm({ 
  open, 
  onOpenChange, 
  matchId,
  candidateId,
  jobId,
  aiScore,
  recruiterId,
  onSubmit 
}) {
  const [rating, setRating] = useState(0);
  const [accuracy, setAccuracy] = useState('');
  const [skillFeedback, setSkillFeedback] = useState('');
  const [cultureFeedback, setCultureFeedback] = useState('');
  const [experienceFeedback, setExperienceFeedback] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    
    setSubmitting(true);
    try {
      const feedback = await base44.entities.MatchFeedback.create({
        match_id: matchId,
        recruiter_id: recruiterId,
        candidate_id: candidateId,
        job_id: jobId,
        ai_score: aiScore,
        recruiter_rating: rating,
        accuracy_rating: accuracy || undefined,
        skill_match_feedback: skillFeedback || undefined,
        culture_fit_feedback: cultureFeedback || undefined,
        experience_feedback: experienceFeedback || undefined,
        comments: comments || undefined
      });
      
      onSubmit?.(feedback);
      onOpenChange(false);
      
      // Reset form
      setRating(0);
      setAccuracy('');
      setSkillFeedback('');
      setCultureFeedback('');
      setExperienceFeedback('');
      setComments('');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-pink-500" />
            Rate This Match
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* AI Score Display */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-500">AI Match Score</p>
            <p className="text-2xl font-bold text-gray-900">{aiScore}%</p>
          </div>

          {/* Star Rating */}
          <div>
            <Label className="text-sm font-medium">How would you rate this candidate match?</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star 
                    className={`w-8 h-8 ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Accuracy Rating */}
          <div>
            <Label className="text-sm font-medium">How accurate was the AI match?</Label>
            <RadioGroup value={accuracy} onValueChange={setAccuracy} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="accurate" id="accurate" />
                <label htmlFor="accurate" className="text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Accurate
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="somewhat_accurate" id="somewhat" />
                <label htmlFor="somewhat" className="text-sm flex items-center gap-1">
                  <Minus className="w-4 h-4 text-amber-500" /> Somewhat Accurate
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inaccurate" id="inaccurate" />
                <label htmlFor="inaccurate" className="text-sm flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-red-500" /> Inaccurate
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Category Feedback */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Category Feedback (optional)</Label>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Skills Match</p>
                <select 
                  value={skillFeedback} 
                  onChange={(e) => setSkillFeedback(e.target.value)}
                  className="w-full text-xs border rounded-md p-1.5"
                >
                  <option value="">Select...</option>
                  <option value="overestimated">Overestimated</option>
                  <option value="accurate">Accurate</option>
                  <option value="underestimated">Underestimated</option>
                </select>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Culture Fit</p>
                <select 
                  value={cultureFeedback} 
                  onChange={(e) => setCultureFeedback(e.target.value)}
                  className="w-full text-xs border rounded-md p-1.5"
                >
                  <option value="">Select...</option>
                  <option value="overestimated">Overestimated</option>
                  <option value="accurate">Accurate</option>
                  <option value="underestimated">Underestimated</option>
                </select>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Experience</p>
                <select 
                  value={experienceFeedback} 
                  onChange={(e) => setExperienceFeedback(e.target.value)}
                  className="w-full text-xs border rounded-md p-1.5"
                >
                  <option value="">Select...</option>
                  <option value="overestimated">Overestimated</option>
                  <option value="accurate">Accurate</option>
                  <option value="underestimated">Underestimated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div>
            <Label className="text-sm font-medium">Additional Comments (optional)</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What could improve this match recommendation?"
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={!rating || submitting}
            className="w-full swipe-gradient text-white"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
            ) : (
              <><MessageSquare className="w-4 h-4 mr-2" /> Submit Feedback</>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Your feedback helps improve our AI matching algorithm
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}