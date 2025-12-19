import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Briefcase, MapPin, Building2, Zap, Loader2, Upload, FileText, Video, X, CheckCircle2, StopCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluateApplication } from '@/components/evaluation/AutoEvaluator';

export default function QuickApplyModal({ open, onOpenChange, job, company, candidate, user, onApply }) {
  const [step, setStep] = useState(1); // 1: cover letter, 2: resume, 3: video
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState(candidate?.resume_url || '');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const streamRef = useRef(null);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setResumeUrl(file_url);
    } catch (error) {
      alert('Resume upload failed');
    }
    setUploadingResume(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      alert('Camera access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmit = async () => {
    setApplying(true);
    try {
      let videoPitchUrl = null;
      if (recordedBlob) {
        setUploadingVideo(true);
        const file = new File([recordedBlob], 'elevator-pitch.webm', { type: 'video/webm' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        videoPitchUrl = file_url;
        setUploadingVideo(false);
      }

      // Create application
      const application = await base44.entities.Application.create({
        candidate_id: candidate.id,
        job_id: job.id,
        company_id: company.id,
        cover_letter: coverLetter,
        resume_url: resumeUrl,
        video_pitch_url: videoPitchUrl,
        applied_via: 'direct',
        status: 'applied'
      });

      // Auto-trigger AI evaluation and ranking
      try {
        await evaluateApplication(application.id);
      } catch (evalError) {
        console.error('AI evaluation failed:', evalError);
      }

      // Create swipe
      await base44.entities.Swipe.create({
        swiper_id: user.id,
        swiper_type: 'candidate',
        target_id: job.id,
        target_type: 'job',
        direction: 'right',
        job_id: job.id
      });

      // Check for mutual match
      const employerSwipes = await base44.entities.Swipe.filter({
        swiper_type: 'employer',
        target_id: candidate.id,
        direction: 'right'
      });

      if (employerSwipes.length > 0) {
        await base44.entities.Match.create({
          candidate_id: candidate.id,
          company_id: company.id,
          job_id: job.id,
          candidate_user_id: user.id,
          company_user_id: company.user_id,
          status: 'matched'
        });
      }

      // Notify employer
      await base44.entities.Notification.create({
        user_id: company.user_id,
        type: 'job_match',
        title: '🎯 New Application',
        message: `${user.full_name} applied for ${job.title}`,
        job_id: job.id,
        navigate_to: 'ATS'
      });

      setApplied(true);
      if (onApply) onApply();
    } catch (error) {
      alert('Application failed. Please try again.');
    }
    setApplying(false);
  };

  const resetAndClose = () => {
    setStep(1);
    setCoverLetter('');
    setResumeUrl(candidate?.resume_url || '');
    setVideoUrl('');
    setRecordedBlob(null);
    setApplied(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-500" />
            Apply to {job?.title}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {applied ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
              <p className="text-gray-500 mb-6">
                Your application to {job?.title} at {company?.name} has been sent successfully.
              </p>
              <Button onClick={resetAndClose} className="swipe-gradient text-white px-8">
                Close
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Progress Steps */}
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      step >= s ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-gradient-to-r from-pink-500 to-orange-500' : 'bg-gray-200'}`} />}
                  </React.Fragment>
                ))}
              </div>

              {/* Job Summary */}
              <div className="p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  {company?.logo_url ? (
                    <img src={company.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-pink-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{job?.title}</h3>
                    <p className="text-sm text-gray-600">{company?.name}</p>
                    {job?.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {step === 1 && (
                  <div>
                    <Label>Cover Letter (Optional)</Label>
                    <p className="text-sm text-gray-500 mb-3">Why are you a great fit for this role?</p>
                    <Textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Share your interest and what makes you a great candidate for this position..."
                      rows={8}
                      className="resize-none"
                    />
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <Label>Upload Resume (Optional)</Label>
                    <p className="text-sm text-gray-500 mb-3">Stand out with your latest resume</p>
                    
                    {resumeUrl ? (
                      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700">Resume attached</p>
                          <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                            View resume
                          </a>
                        </div>
                        <button
                          onClick={() => setResumeUrl('')}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-400 transition-colors bg-gray-50">
                        {uploadingResume ? (
                          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400" />
                            <div className="text-center">
                              <p className="text-gray-700 font-medium">Click to upload</p>
                              <p className="text-sm text-gray-500">PDF, DOC, DOCX (Max 10MB)</p>
                            </div>
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
                )}

                {step === 3 && (
                  <div>
                    <Label>Video Elevator Pitch (Optional)</Label>
                    <p className="text-sm text-gray-500 mb-3">Record a 30-60 second intro - make it count!</p>
                    
                    {videoUrl && !recording ? (
                      <div className="space-y-3">
                        <video
                          src={videoUrl}
                          controls
                          className="w-full rounded-xl bg-black"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            setVideoUrl('');
                            setRecordedBlob(null);
                          }}
                          className="w-full"
                        >
                          <X className="w-4 h-4 mr-2" /> Re-record
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
                          <video
                            ref={videoPreviewRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          {recording && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium">
                              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              Recording
                            </div>
                          )}
                          {!recording && !videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-white">
                                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm opacity-75">Camera preview will appear here</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {!recording ? (
                          <Button
                            onClick={startRecording}
                            className="w-full swipe-gradient text-white"
                          >
                            <Video className="w-4 h-4 mr-2" /> Start Recording
                          </Button>
                        ) : (
                          <Button
                            onClick={stopRecording}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                          >
                            <StopCircle className="w-4 h-4 mr-2" /> Stop & Save
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t">
                {step > 1 ? (
                  <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={applying}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={resetAndClose}
                    disabled={applying}
                  >
                    Cancel
                  </Button>
                )}
                
                {step < 3 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    className="flex-1 swipe-gradient text-white"
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={applying || uploadingVideo}
                    className="flex-1 swipe-gradient text-white"
                  >
                    {applying || uploadingVideo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}