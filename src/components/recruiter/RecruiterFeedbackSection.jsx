import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, MessageSquare, ThumbsUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import RecruiterRating from './RecruiterRating';

export default function RecruiterFeedbackSection({ recruiterId, companyId, canLeaveFeedback = false }) {
  const [feedback, setFeedback] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [newFeedback, setNewFeedback] = useState({
    rating: 0,
    communication_rating: 0,
    responsiveness_rating: 0,
    professionalism_rating: 0,
    feedback_text: '',
    would_recommend: true
  });

  useEffect(() => {
    loadFeedback();
  }, [recruiterId]);

  const loadFeedback = async () => {
    try {
      const [allFeedback, allUsers] = await Promise.all([
        base44.entities.RecruiterFeedback.filter({ recruiter_id: recruiterId }),
        base44.entities.User.list()
      ]);
      
      setFeedback(allFeedback);
      
      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);

      if (allFeedback.length > 0) {
        const avg = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    }
    setLoading(false);
  };

  const handleSubmitFeedback = async () => {
    if (newFeedback.rating === 0) return;
    setSubmitting(true);
    
    try {
      const user = await base44.auth.me();
      await base44.entities.RecruiterFeedback.create({
        ...newFeedback,
        recruiter_id: recruiterId,
        candidate_id: user.id,
        company_id: companyId
      });
      
      setShowFeedbackForm(false);
      setNewFeedback({
        rating: 0,
        communication_rating: 0,
        responsiveness_rating: 0,
        professionalism_rating: 0,
        feedback_text: '',
        would_recommend: true
      });
      loadFeedback();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
    setSubmitting(false);
  };

  const StarRatingInput = ({ value, onChange, label }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= value 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    );
  }

  const recommendRate = feedback.length > 0 
    ? Math.round((feedback.filter(f => f.would_recommend).length / feedback.length) * 100)
    : 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-pink-500" />
          Reviews & Feedback
        </CardTitle>
        {canLeaveFeedback && (
          <Button 
            onClick={() => setShowFeedbackForm(true)}
            className="bg-gradient-to-r from-pink-500 to-orange-500 text-white"
            size="sm"
          >
            Leave Feedback
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
            <RecruiterRating rating={averageRating} size="sm" showNumber={false} />
            <p className="text-xs text-gray-500 mt-1">Average Rating</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{feedback.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total Reviews</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{recommendRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Would Recommend</p>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No reviews yet</p>
            </div>
          ) : (
            feedback.slice(0, 5).map((f) => {
              const reviewer = users[f.candidate_id];
              return (
                <div key={f.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{reviewer?.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500">{format(new Date(f.created_date), 'MMM d, yyyy')}</p>
                    </div>
                    <RecruiterRating rating={f.rating} size="sm" />
                  </div>
                  {f.feedback_text && (
                    <p className="text-sm text-gray-600 mt-2">{f.feedback_text}</p>
                  )}
                  {f.would_recommend && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <ThumbsUp className="w-3 h-3" /> Would recommend
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* Feedback Form Dialog */}
      <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <StarRatingInput
              label="Overall Rating"
              value={newFeedback.rating}
              onChange={(v) => setNewFeedback({ ...newFeedback, rating: v })}
            />
            <StarRatingInput
              label="Communication"
              value={newFeedback.communication_rating}
              onChange={(v) => setNewFeedback({ ...newFeedback, communication_rating: v })}
            />
            <StarRatingInput
              label="Responsiveness"
              value={newFeedback.responsiveness_rating}
              onChange={(v) => setNewFeedback({ ...newFeedback, responsiveness_rating: v })}
            />
            <StarRatingInput
              label="Professionalism"
              value={newFeedback.professionalism_rating}
              onChange={(v) => setNewFeedback({ ...newFeedback, professionalism_rating: v })}
            />
            
            <Textarea
              placeholder="Share your experience..."
              value={newFeedback.feedback_text}
              onChange={(e) => setNewFeedback({ ...newFeedback, feedback_text: e.target.value })}
              rows={3}
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newFeedback.would_recommend}
                onChange={(e) => setNewFeedback({ ...newFeedback, would_recommend: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">I would recommend this recruiter</span>
            </label>

            <Button 
              onClick={handleSubmitFeedback} 
              disabled={submitting || newFeedback.rating === 0}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}