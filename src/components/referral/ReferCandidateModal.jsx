import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { Upload, Users, Loader2, Gift, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReferCandidateModal({ open, onOpenChange, job, company, user, userType }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [referralData, setReferralData] = useState({
    candidate_name: '',
    candidate_email: '',
    message: '',
    resume_url: ''
  });
  const [uploadingResume, setUploadingResume] = useState(false);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReferralData({ ...referralData, resume_url: file_url });
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploadingResume(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create referral
      const referral = await base44.entities.Referral.create({
        referrer_id: user.id,
        referrer_type: userType,
        candidate_name: referralData.candidate_name,
        candidate_email: referralData.candidate_email,
        job_id: job.id,
        company_id: company.id,
        message: referralData.message,
        resume_url: referralData.resume_url,
        reward_amount: company.referral_bonus || 0
      });

      // Notify company/recruiter
      await base44.entities.Notification.create({
        user_id: company.user_id,
        type: 'system',
        title: '👥 New Candidate Referral',
        message: `${user.full_name} referred ${referralData.candidate_name} for ${job.title}`,
        job_id: job.id,
        navigate_to: 'Referrals'
      });

      // Send email to referred candidate
      await base44.integrations.Core.SendEmail({
        to: referralData.candidate_email,
        subject: `You've been referred for ${job.title} at ${company.name}`,
        body: `Hi ${referralData.candidate_name},\n\n${user.full_name} thinks you'd be a great fit for the ${job.title} position at ${company.name}.\n\n${referralData.message ? `Their message: "${referralData.message}"\n\n` : ''}Check out the opportunity on SwipeHire!`
      });

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setReferralData({ candidate_name: '', candidate_email: '', message: '', resume_url: '' });
      }, 2000);
    } catch (error) {
      console.error('Referral failed:', error);
      alert('Failed to submit referral. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-500" />
            Refer a Candidate
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Referral Sent!</h3>
            <p className="text-gray-600 text-sm">We'll notify you when the candidate is reviewed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Job Info */}
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl p-4 border border-pink-100">
              <div className="flex items-start gap-3">
                {company.logo_url && (
                  <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                  <p className="text-sm text-gray-600">{company.name}</p>
                  {company.referral_bonus > 0 && (
                    <Badge className="bg-green-100 text-green-700 mt-2">
                      <Gift className="w-3 h-3 mr-1" />
                      ${company.referral_bonus} referral bonus
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Details */}
            <div>
              <Label>Candidate Name *</Label>
              <Input
                required
                value={referralData.candidate_name}
                onChange={(e) => setReferralData({ ...referralData, candidate_name: e.target.value })}
                placeholder="John Doe"
                className="mt-1 h-11"
              />
            </div>

            <div>
              <Label>Candidate Email *</Label>
              <Input
                required
                type="email"
                value={referralData.candidate_email}
                onChange={(e) => setReferralData({ ...referralData, candidate_email: e.target.value })}
                placeholder="john@example.com"
                className="mt-1 h-11"
              />
            </div>

            <div>
              <Label>Why are you referring this candidate?</Label>
              <Textarea
                value={referralData.message}
                onChange={(e) => setReferralData({ ...referralData, message: e.target.value })}
                placeholder="They have great experience in..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Resume Upload */}
            <div>
              <Label>Candidate's Resume (optional)</Label>
              <div className="mt-2">
                {referralData.resume_url ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700 flex-1">Resume uploaded</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReferralData({ ...referralData, resume_url: '' })}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-400 transition-colors">
                    {uploadingResume ? (
                      <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload resume</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleResumeUpload}
                      disabled={uploadingResume}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 swipe-gradient text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Referral'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}