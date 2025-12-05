import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Zap, CheckCircle2, User, FileText, Video, Briefcase, 
  MapPin, Star, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuickApplyModal({ 
  open, 
  onOpenChange, 
  job, 
  company, 
  candidate, 
  user,
  onApply 
}) {
  const [step, setStep] = useState(1);
  const [coverLetter, setCoverLetter] = useState('');
  const [includeVideo, setIncludeVideo] = useState(!!candidate?.video_intro_url);
  const [includePortfolio, setIncludePortfolio] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const profileCompleteness = calculateCompleteness(candidate);
  const missingFields = getMissingFields(candidate);

  const handleApply = async () => {
    setApplying(true);
    await onApply({
      coverLetter,
      includeVideo,
      includePortfolio
    });
    setApplying(false);
    setApplied(true);
  };

  const resetAndClose = () => {
    setStep(1);
    setCoverLetter('');
    setApplied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-500" />
            Quick Apply
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {applied ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Application Sent!</h3>
              <p className="text-gray-500 mb-4">
                You've applied to {job?.title} at {company?.name}
              </p>
              <Button onClick={resetAndClose} className="swipe-gradient text-white">
                Continue Swiping
              </Button>
            </motion.div>
          ) : step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Job Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl swipe-gradient flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">{job?.title}</h4>
                  <p className="text-sm text-gray-500">{company?.name}</p>
                </div>
              </div>

              {/* Profile Preview */}
              <div className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Your Profile</h4>
                  <Badge className={profileCompleteness >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {profileCompleteness}% complete
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  {candidate?.photo_url ? (
                    <img src={candidate.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-pink-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-sm text-gray-500">{candidate?.headline || 'Add a headline'}</p>
                  </div>
                </div>

                {/* What will be shared */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-gray-500 font-medium">Included in application:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Profile & Skills
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Experience
                    </div>
                    {candidate?.resume_url && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Resume
                      </div>
                    )}
                    {candidate?.video_intro_url && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Video Intro
                      </div>
                    )}
                  </div>
                </div>

                {missingFields.length > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Missing: {missingFields.join(', ')}. Complete your profile to improve match chances.</span>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {candidate?.video_intro_url && (
                  <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <Checkbox checked={includeVideo} onCheckedChange={setIncludeVideo} />
                    <Video className="w-5 h-5 text-pink-500" />
                    <span className="text-sm">Include video introduction</span>
                  </label>
                )}
                {candidate?.portfolio_projects?.length > 0 && (
                  <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <Checkbox checked={includePortfolio} onCheckedChange={setIncludePortfolio} />
                    <Star className="w-5 h-5 text-amber-500" />
                    <span className="text-sm">Include portfolio ({candidate.portfolio_projects.length} projects)</span>
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setStep(2)} className="flex-1 swipe-gradient text-white">
                  Continue
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  Add a note (optional)
                </label>
                <Textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell them why you're excited about this role..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">A personal note can increase your chances by 40%</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleApply} 
                  disabled={applying}
                  className="flex-1 swipe-gradient text-white"
                >
                  {applying ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {applying ? 'Applying...' : 'Submit Application'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function calculateCompleteness(candidate) {
  if (!candidate) return 0;
  
  const fields = [
    !!candidate.headline,
    !!candidate.bio,
    !!candidate.photo_url,
    !!candidate.location,
    candidate.skills?.length > 0,
    candidate.experience?.length > 0,
    !!candidate.resume_url,
    !!candidate.video_intro_url
  ];
  
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function getMissingFields(candidate) {
  if (!candidate) return ['Profile'];
  
  const missing = [];
  if (!candidate.headline) missing.push('headline');
  if (!candidate.bio) missing.push('bio');
  if (!candidate.skills?.length) missing.push('skills');
  if (!candidate.resume_url) missing.push('resume');
  
  return missing;
}