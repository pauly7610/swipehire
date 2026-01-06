import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useClerkAuth } from '@/components/auth/ClerkAuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Loader2, Save, CheckCircle2, AlertCircle, Upload, Linkedin } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import PhotoUpload from '@/components/onboarding/PhotoUpload';
import ExperienceForm from '@/components/onboarding/ExperienceForm';
import EducationForm from '@/components/onboarding/EducationForm';
import SkillsPicker from '@/components/onboarding/SkillsPicker';
import ResumeUpload from '@/components/onboarding/ResumeUpload';
import ProfileReview from '@/components/onboarding/ProfileReview';
import EEOQuestionnaire from '@/components/onboarding/EEOQuestionnaire';
import LocationSelect from '@/components/shared/LocationSelect';
import IndustrySelect from '@/components/shared/IndustrySelect';
import JobTitleSelect from '@/components/shared/JobTitleSelect';
import analytics from '@/components/analytics/Analytics';

const CANDIDATE_STEPS = [
  { id: 1, title: 'Import', subtitle: 'Quick start' },
  { id: 2, title: 'Photo', subtitle: 'Upload photo' },
  { id: 3, title: 'Basic Info', subtitle: 'Core details' },
  { id: 4, title: 'Experience', subtitle: 'Work history' },
  { id: 5, title: 'Education', subtitle: 'Optional' },
  { id: 6, title: 'Skills', subtitle: 'Your expertise' },
  { id: 7, title: 'Resume', subtitle: 'Optional' },
  { id: 8, title: 'EEO', subtitle: 'Optional' },
  { id: 9, title: 'Review', subtitle: 'Publish' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user: clerkUser, clerkUser: fullClerkUser, getLinkedInData } = useClerkAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [savingError, setSavingError] = useState(null);
  const [hasLinkedIn, setHasLinkedIn] = useState(false);
  const [importMethod, setImportMethod] = useState(null); // 'linkedin', 'resume', or 'manual'

  // Candidate data
  const [candidateData, setCandidateData] = useState({
    photo_url: '',
    headline: '',
    bio: '',
    location: '',
    industry: '',
    experience: [],
    education: [],
    skills: [],
    resume_url: '',
    // EEO fields (all optional)
    gender: '',
    race: '',
    veteran_status: '',
    disability_status: ''
  });

  // Load user and check existing profiles
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      if (!clerkUser) return;

      try {
        if (!mounted) return;

        // Check if user has LinkedIn
        const linkedInData = getLinkedInData();
        if (linkedInData?.hasLinkedIn) {
          setHasLinkedIn(true);
        }

        // Check if candidate profile already exists
        const candidateCheck = await base44.entities.Candidate.filter({
          email: clerkUser.email
        }).catch(() => []);

        if (!mounted) return;

        const hasCandidate = candidateCheck.length > 0;

        // Redirect if already has complete profile
        if (hasCandidate) {
          navigate(createPageUrl('SwipeJobs'), { replace: true });
          return;
        }

        // Load draft from localStorage (immediate recovery)
        const localDraft = localStorage.getItem('onboarding_draft_v2');
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft);
            if (parsed.currentStep && parsed.currentStep >= 1) setCurrentStep(parsed.currentStep);
            if (parsed.candidateData) setCandidateData(parsed.candidateData);
            if (parsed.importMethod) setImportMethod(parsed.importMethod);
            if (parsed.draftId) setDraftId(parsed.draftId);
          } catch (err) {
            console.error('Failed to load local draft:', err);
          }
        }
      } catch (e) {
        console.error('[OnboardingWizard] Load user failed:', e);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [clerkUser, navigate, getLinkedInData]);

  // Auto-save draft with debounce - both localStorage AND sessionStorage for redundancy
  useEffect(() => {
    if (currentStep < 1) return;

    const timer = setTimeout(() => {
      setAutoSaving(true);
      setSavingError(null);

      const draft = {
        currentStep,
        candidateData,
        importMethod,
        draftId,
        timestamp: new Date().toISOString(),
      };

      try {
        // Save to localStorage
        localStorage.setItem('onboarding_draft_v2', JSON.stringify(draft));
        // Redundant save to sessionStorage
        sessionStorage.setItem('onboarding_draft_v2', JSON.stringify(draft));

        // Track save event
        analytics.track('Onboarding Draft Saved', {
          step: currentStep,
          hasData: true
        });

        setTimeout(() => setAutoSaving(false), 800);
      } catch (err) {
        console.error('[Onboarding] Failed to save draft:', err);
        setSavingError('Failed to save progress');
        setAutoSaving(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [candidateData, currentStep, draftId, importMethod]);

  const steps = CANDIDATE_STEPS;
  const totalSteps = steps.length;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!importMethod; // Must choose import method
      case 2:
        return true; // Photo optional
      case 3:
        return !!(candidateData.headline?.trim() && candidateData.bio?.trim() && candidateData.location?.trim());
      case 4:
        return Array.isArray(candidateData.experience) && candidateData.experience.length > 0;
      case 5:
        return true; // Education optional
      case 6:
        return Array.isArray(candidateData.skills) && candidateData.skills.length >= 3;
      case 7:
        return true; // Resume optional
      case 8:
        return true; // EEO optional
      case 9:
        return true; // Review
      default:
        return true;
    }
  };

  const handleNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!canProceed()) {
      console.warn('Cannot proceed - validation failed');
      return;
    }
    
    analytics.track('Onboarding Step Completed', {
      step: currentStep,
      stepName: steps[currentStep - 1]?.title
    });

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (loading) return;
    
    setLoading(true);
    setSavingError(null);

    console.log('[Onboarding] Starting profile creation...', { user: clerkUser?.email });

    try {
      // STRICT validation before submission
      const validationErrors = [];

      if (!candidateData.headline?.trim()) validationErrors.push('Job title is required');
      if (!candidateData.bio?.trim()) validationErrors.push('Professional summary is required');
      if (!candidateData.location?.trim()) validationErrors.push('Location is required');
      if (!candidateData.experience || candidateData.experience.length === 0) validationErrors.push('At least 1 work experience is required');
      if (!candidateData.skills || candidateData.skills.length < 3) validationErrors.push('At least 3 skills are required');

      if (validationErrors.length > 0) {
        console.error('[Onboarding] Validation failed:', validationErrors);
        throw new Error(validationErrors.join(', '));
      }

      const profileData = {
        email: clerkUser.email,
        user_id: clerkUser.id,
        clerk_id: clerkUser.clerk_id,
        photo_url: candidateData.photo_url || fullClerkUser?.imageUrl || '',
        headline: candidateData.headline.trim(),
        bio: candidateData.bio.trim(),
        location: candidateData.location.trim(),
        industry: candidateData.industry?.trim() || '',
        experience: candidateData.experience || [],
        education: candidateData.education || [],
        skills: (candidateData.skills || []).map(s => typeof s === 'string' ? s.trim() : s.skill?.trim()),
        resume_url: candidateData.resume_url || '',
        // EEO data (optional fields)
        eeo_gender: candidateData.gender || null,
        eeo_race: candidateData.race || null,
        eeo_veteran_status: candidateData.veteran_status || null,
        eeo_disability_status: candidateData.disability_status || null
      };

      console.log('[Onboarding] Creating candidate profile...', { fields: Object.keys(profileData) });

      const newCandidate = await base44.entities.Candidate.create(profileData);

      console.log('[Onboarding] Candidate created:', newCandidate.id);

      analytics.track('Onboarding Completed', {
        hasPhoto: !!candidateData.photo_url,
        experienceCount: candidateData.experience?.length || 0,
        skillsCount: candidateData.skills?.length || 0,
        hasResume: !!candidateData.resume_url
      });

      // Verify creation with extended retry and logging
      let profileFound = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const candidates = await base44.entities.Candidate.filter({ email: clerkUser.email });
        console.log(`[Onboarding] Verification attempt ${i + 1}/15:`, candidates.length, 'profiles found');
        if (candidates.length > 0) {
          profileFound = true;
          console.log('[Onboarding] Profile verified!');
          break;
        }
      }

      if (profileFound) {
        localStorage.removeItem('onboarding_draft_v2');
        sessionStorage.removeItem('onboarding_draft_v2');
        console.log('[Onboarding] Redirecting to SwipeJobs...');
        navigate(createPageUrl('SwipeJobs'), { replace: true });
      } else {
        throw new Error('Profile creation verification timeout - profile may still be processing');
      }
    } catch (error) {
      console.error('[Onboarding] Completion failed:', error);
      setSavingError(error.message || 'Failed to create profile. Please try again.');

      analytics.track('Onboarding Failed', {
        step: currentStep,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeParsed = (parsedData) => {
    if (!parsedData) return;

    // Show preview and let user confirm what to import
    const updates = {};
    
    // Only suggest updates for empty fields
    if (!candidateData.headline && parsedData.headline) {
      updates.headline = parsedData.headline;
    }
    if (!candidateData.bio && parsedData.summary) {
      updates.bio = parsedData.summary;
    }
    if (!candidateData.location && parsedData.location) {
      updates.location = parsedData.location;
    }
    if ((!candidateData.skills || candidateData.skills.length === 0) && parsedData.skills?.length > 0) {
      updates.skills = parsedData.skills.map(s => ({ skill: s, proficiency: 'intermediate' }));
    }
    if ((!candidateData.experience || candidateData.experience.length === 0) && parsedData.experience?.length > 0) {
      // Add unique IDs to parsed experience
      updates.experience = parsedData.experience.map(exp => ({
        ...exp,
        id: crypto.randomUUID ? crypto.randomUUID() : `exp_${Date.now()}_${Math.random()}`
      }));
    }
    if ((!candidateData.education || candidateData.education.length === 0) && parsedData.education?.length > 0) {
      updates.education = parsedData.education;
    }

    // Apply updates (non-destructive)
    if (Object.keys(updates).length > 0) {
      setCandidateData(prev => ({
        ...prev,
        ...updates
      }));

      analytics.track('Resume Auto-Fill Applied', {
        fieldsUpdated: Object.keys(updates)
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Let's Build Your Profile</h2>
            <p className="text-gray-600 mb-12 text-center text-lg">Choose how you'd like to get started</p>

            <div className="grid grid-cols-1 gap-6">
              {hasLinkedIn && (
                <button
                  onClick={() => {
                    setImportMethod('linkedin');
                    // TODO: Implement LinkedIn profile import
                    alert('LinkedIn import coming soon! For now, please upload your resume or fill manually.');
                  }}
                  type="button"
                  className={`group p-8 rounded-2xl border-2 transition-all text-left ${
                    importMethod === 'linkedin'
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Linkedin className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Import from LinkedIn</h3>
                      <p className="text-gray-600">
                        Automatically import your work history, education, and skills from your LinkedIn profile
                      </p>
                      <div className="mt-3 text-sm text-blue-600 font-medium">✓ Fastest option (1 minute)</div>
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={() => setImportMethod('resume')}
                type="button"
                className={`group p-8 rounded-2xl border-2 transition-all text-left ${
                  importMethod === 'resume'
                    ? 'border-pink-500 bg-pink-50 shadow-lg'
                    : 'border-gray-200 hover:border-pink-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Resume</h3>
                    <p className="text-gray-600">
                      Upload your existing resume and we'll extract your information automatically
                    </p>
                    <div className="mt-3 text-sm text-pink-600 font-medium">✓ Quick setup (2-3 minutes)</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setImportMethod('manual')}
                type="button"
                className={`group p-8 rounded-2xl border-2 transition-all text-left ${
                  importMethod === 'manual'
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-purple-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Fill Out Manually</h3>
                    <p className="text-gray-600">
                      Enter your information step-by-step. Best for customizing your profile from scratch
                    </p>
                    <div className="mt-3 text-sm text-purple-600 font-medium">✓ Full control (5-10 minutes)</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Photo</h2>
            <p className="text-gray-600 mb-8">Add a professional photo to help recruiters recognize you</p>
            <PhotoUpload
              value={candidateData.photo_url}
              onChange={(url) => setCandidateData({ ...candidateData, photo_url: url })}
            />
          </div>
        );

      case 3:
        return (
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
              <p className="text-gray-600 mb-8">Tell us about yourself</p>

              <div className="space-y-6">
                <div>
                  <Label>
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <IndustrySelect
                    value={candidateData.industry}
                    onChange={(v) => setCandidateData({ ...candidateData, industry: v })}
                    placeholder="Select your industry"
                  />
                </div>

                <div>
                  <Label>
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <JobTitleSelect
                    value={candidateData.headline}
                    onChange={(v) => setCandidateData({ ...candidateData, headline: v })}
                    placeholder={candidateData.industry ? 'Select your job title' : 'Select industry first'}
                    industry={candidateData.industry}
                  />
                </div>

                <div>
                  <Label>
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <LocationSelect
                    value={candidateData.location}
                    onChange={(v) => setCandidateData({ ...candidateData, location: v })}
                    placeholder="Where are you based?"
                  />
                </div>

                <div>
                  <Label>
                    Professional Summary <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={candidateData.bio}
                    onChange={(e) => setCandidateData({ ...candidateData, bio: e.target.value.slice(0, 500) })}
                    placeholder="Describe your background, strengths, and what you're looking for..."
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{candidateData.bio?.length || 0}/500</p>
                </div>
              </div>
            </div>
          );

      case 4:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
              <p className="text-gray-600 mb-8">Add your work history (at least 1 required)</p>
              <ExperienceForm
                experiences={candidateData.experience}
                onChange={(exp) => setCandidateData({ ...candidateData, experience: exp })}
              />
            </div>
          );

      case 5:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Education</h2>
              <p className="text-gray-600 mb-8">Add your educational background (optional but recommended)</p>
              <EducationForm
                education={candidateData.education}
                onChange={(edu) => setCandidateData({ ...candidateData, education: edu })}
              />
            </div>
          );

      case 6:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Skills</h2>
              <p className="text-gray-600 mb-8">Add at least 3 skills to improve your visibility</p>
              <SkillsPicker
                skills={candidateData.skills}
                onChange={(skills) => setCandidateData({ ...candidateData, skills })}
                showProficiency={false}
              />
            </div>
          );

      case 7:
        return (
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Resume</h2>
              <p className="text-gray-600 mb-8">We'll auto-fill missing information from your resume</p>
              <ResumeUpload
                value={candidateData.resume_url}
                onChange={(url) => setCandidateData({ ...candidateData, resume_url: url })}
                onParsed={handleResumeParsed}
              />
            </div>
          );

      case 8:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Equal Employment Opportunity</h2>
            <p className="text-gray-600 mb-8">
              Help us ensure equal opportunity for all candidates (All questions are optional)
            </p>
            <EEOQuestionnaire
              data={{
                gender: candidateData.gender,
                race: candidateData.race,
                veteran_status: candidateData.veteran_status,
                disability_status: candidateData.disability_status
              }}
              onChange={(eeoData) => setCandidateData({ ...candidateData, ...eeoData })}
            />
          </div>
        );

      case 9:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Profile</h2>
            <p className="text-gray-600 mb-8">Make sure everything looks good before publishing</p>
            <ProfileReview data={candidateData} userType="candidate" />
          </div>
        );

      default:
        return null;
    }
  };

  if (!clerkUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        input, textarea, select, button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        button:not(:disabled) {
          cursor: pointer;
          pointer-events: auto;
        }
        
        input:focus, textarea:focus, select:focus {
          outline: 2px solid #FF005C;
          outline-offset: 2px;
        }
      `}</style>

      {/* Progress Bar */}
      {currentStep > 1 && (
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} steps={steps} />
      )}

      {/* Auto-save indicator */}
      {autoSaving && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Save className="w-4 h-4" />
          <span className="text-sm font-medium">Saved</span>
        </div>
      )}

      {/* Error indicator */}
      {savingError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{savingError}</span>
        </div>
      )}

      {/* Content */}
      <main className="px-4 md:px-6 py-12 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Footer */}
      {currentStep > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="rounded-xl"
                type="button"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back
              </Button>

              <div className="text-center flex-1">
                <p className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps}
                </p>
              </div>

              {isLastStep ? (
                <Button
                  onClick={handleComplete}
                  disabled={loading || !canProceed()}
                  className="swipe-gradient text-white rounded-xl px-8 shadow-lg disabled:opacity-50 active:scale-95 transition-transform touch-manipulation"
                  type="button"
                  style={{ pointerEvents: loading ? 'none' : 'auto' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Publish Profile
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext(e)}
                  disabled={!canProceed()}
                  className="swipe-gradient text-white rounded-xl px-8 shadow-lg disabled:opacity-50 active:scale-95 transition-transform touch-manipulation"
                  type="button"
                  style={{ pointerEvents: 'auto' }}
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}