import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Loader2, User, Users, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import PhotoUpload from '@/components/onboarding/PhotoUpload';
import ExperienceForm from '@/components/onboarding/ExperienceForm';
import EducationForm from '@/components/onboarding/EducationForm';
import SkillsPicker from '@/components/onboarding/SkillsPicker';
import ResumeUpload from '@/components/onboarding/ResumeUpload';
import ProfileReview from '@/components/onboarding/ProfileReview';
import LocationSelect from '@/components/shared/LocationSelect';
import IndustrySelect from '@/components/shared/IndustrySelect';
import JobTitleSelect from '@/components/shared/JobTitleSelect';
import analytics from '@/components/analytics/Analytics';

const CANDIDATE_STEPS = [
  { id: 1, title: 'Choose Role', subtitle: 'Select your path' },
  { id: 2, title: 'Photo', subtitle: 'Upload photo' },
  { id: 3, title: 'Basic Info', subtitle: 'Core details' },
  { id: 4, title: 'Experience', subtitle: 'Work history' },
  { id: 5, title: 'Education', subtitle: 'Optional' },
  { id: 6, title: 'Skills', subtitle: 'Your expertise' },
  { id: 7, title: 'Resume', subtitle: 'Optional' },
  { id: 8, title: 'Review', subtitle: 'Publish' },
];

const RECRUITER_STEPS = [
  { id: 1, title: 'Choose Role', subtitle: 'Select your path' },
  { id: 2, title: 'Your Info', subtitle: 'Personal details' },
  { id: 3, title: 'Company', subtitle: 'Company info' },
  { id: 4, title: 'Review', subtitle: 'Publish' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [savingError, setSavingError] = useState(null);

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
  });

  // Recruiter data
  const [recruiterData, setRecruiterData] = useState({
    photo_url: '',
    recruiter_name: '',
    title: '',
    phone: '',
  });

  // Company data
  const [companyData, setCompanyData] = useState({
    logo_url: '',
    name: '',
    industry: '',
    location: '',
    website: '',
    size: '11-50',
  });

  // Load user and check existing profiles
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!mounted) return;

        setUser(currentUser);

        const [candidateCheck, companyCheck] = await Promise.all([
          base44.entities.Candidate.filter({ user_id: currentUser.id }),
          base44.entities.Company.filter({ user_id: currentUser.id }),
        ]);

        if (!mounted) return;

        const hasCandidate = candidateCheck.length > 0;
        const hasCompany = companyCheck.length > 0;
        const selectedRole = localStorage.getItem('swipehire_selected_role');

        // Redirect if already has complete profile
        if (hasCandidate || hasCompany) {
          const viewMode = hasCompany ? 'employer' : 'candidate';
          localStorage.setItem('swipehire_view_mode', viewMode);
          navigate(createPageUrl(viewMode === 'employer' ? 'EmployerDashboard' : 'SwipeJobs'), { replace: true });
          return;
        }

        // Load draft from localStorage (immediate recovery)
        const localDraft = localStorage.getItem('onboarding_draft_v2');
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft);
            if (parsed.userType) setUserType(parsed.userType);
            if (parsed.currentStep && parsed.currentStep > 1) setCurrentStep(parsed.currentStep);
            if (parsed.candidateData) setCandidateData(parsed.candidateData);
            if (parsed.recruiterData) setRecruiterData(parsed.recruiterData);
            if (parsed.companyData) setCompanyData(parsed.companyData);
            if (parsed.draftId) setDraftId(parsed.draftId);
          } catch (err) {
            console.error('Failed to load local draft:', err);
          }
        }

        // Handle role selection from previous page
        if (selectedRole && !hasCandidate && !hasCompany) {
          setUserType(selectedRole);
          setCurrentStep(2);
          localStorage.removeItem('swipehire_selected_role');
        }
      } catch (e) {
        console.error('Auth check failed:', e);
        if (mounted) {
          navigate(createPageUrl('Welcome'), { replace: true });
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Auto-save draft with debounce - both localStorage AND sessionStorage for redundancy
  useEffect(() => {
    if (!userType || currentStep <= 1) return;

    const timer = setTimeout(() => {
      setAutoSaving(true);
      setSavingError(null);

      const draft = {
        userType,
        currentStep,
        candidateData: userType === 'candidate' ? candidateData : null,
        recruiterData: userType === 'employer' ? recruiterData : null,
        companyData: userType === 'employer' ? companyData : null,
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
          userType,
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
  }, [candidateData, recruiterData, companyData, userType, currentStep, draftId]);

  const steps = userType === 'candidate' ? CANDIDATE_STEPS : RECRUITER_STEPS;
  const totalSteps = steps.length;

  const canProceed = () => {
    if (userType === 'candidate') {
      switch (currentStep) {
        case 1:
          return !!userType;
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
          return true; // Review
        default:
          return true;
      }
    } else {
      switch (currentStep) {
        case 1:
          return !!userType;
        case 2:
          return !!(recruiterData.recruiter_name?.trim() && recruiterData.title?.trim());
        case 3:
          return !!(companyData.name?.trim() && companyData.industry?.trim());
        case 4:
          return true;
        default:
          return true;
      }
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
      userType,
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

    console.log('[Onboarding] Starting profile creation...', { userType, user: user?.email });

    try {
      if (userType === 'candidate') {
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
          user_id: user.id,
          photo_url: candidateData.photo_url || '',
          headline: candidateData.headline.trim(),
          bio: candidateData.bio.trim(),
          location: candidateData.location.trim(),
          industry: candidateData.industry?.trim() || '',
          experience: candidateData.experience || [],
          education: candidateData.education || [],
          skills: (candidateData.skills || []).map(s => typeof s === 'string' ? s.trim() : s.skill?.trim()),
          resume_url: candidateData.resume_url || '',
        };

        console.log('[Onboarding] Creating candidate profile...', { fields: Object.keys(profileData) });

        const newCandidate = await base44.entities.Candidate.create(profileData);
        
        console.log('[Onboarding] Candidate created:', newCandidate.id);

        analytics.track('Onboarding Completed', {
          userType: 'candidate',
          hasPhoto: !!candidateData.photo_url,
          experienceCount: candidateData.experience?.length || 0,
          skillsCount: candidateData.skills?.length || 0,
          hasResume: !!candidateData.resume_url
        });

        // Verify creation with extended retry and logging
        let profileFound = false;
        for (let i = 0; i < 15; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const candidates = await base44.entities.Candidate.filter({ user_id: user.id });
          console.log(`[Onboarding] Verification attempt ${i + 1}/15:`, candidates.length, 'profiles found');
          if (candidates.length > 0) {
            profileFound = true;
            console.log('[Onboarding] Profile verified!');
            break;
          }
        }

        if (profileFound) {
          localStorage.setItem('swipehire_view_mode', 'candidate');
          localStorage.removeItem('onboarding_draft_v2');
          sessionStorage.removeItem('onboarding_draft_v2');
          console.log('[Onboarding] Redirecting to SwipeJobs...');
          navigate(createPageUrl('SwipeJobs'), { replace: true });
        } else {
          throw new Error('Profile creation verification timeout - profile may still be processing');
        }
      } else {
        // STRICT validation for recruiter
        const validationErrors = [];
        
        if (!recruiterData.recruiter_name?.trim()) validationErrors.push('Your name is required');
        if (!recruiterData.title?.trim()) validationErrors.push('Your title is required');
        if (!companyData.name?.trim()) validationErrors.push('Company name is required');
        if (!companyData.industry?.trim()) validationErrors.push('Company industry is required');
        
        if (validationErrors.length > 0) {
          console.error('[Onboarding] Validation failed:', validationErrors);
          throw new Error(validationErrors.join(', '));
        }

        console.log('[Onboarding] Updating recruiter info...');

        // Save recruiter info
        await base44.auth.updateMe({
          recruiter_name: recruiterData.recruiter_name.trim(),
          recruiter_title: recruiterData.title.trim(),
          recruiter_photo: recruiterData.photo_url || '',
        });

        console.log('[Onboarding] Creating company...');

        // Create company
        const newCompany = await base44.entities.Company.create({
          user_id: user.id,
          name: companyData.name.trim(),
          industry: companyData.industry.trim(),
          location: companyData.location?.trim() || '',
          website: companyData.website?.trim() || '',
          size: companyData.size || '11-50',
          logo_url: companyData.logo_url || '',
        });

        console.log('[Onboarding] Company created:', newCompany.id);

        analytics.track('Onboarding Completed', {
          userType: 'employer',
          hasLogo: !!companyData.logo_url
        });

        // Verify creation with extended retry and logging
        let companyFound = false;
        for (let i = 0; i < 15; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const companies = await base44.entities.Company.filter({ user_id: user.id });
          console.log(`[Onboarding] Verification attempt ${i + 1}/15:`, companies.length, 'companies found');
          if (companies.length > 0) {
            companyFound = true;
            console.log('[Onboarding] Company verified!');
            break;
          }
        }

        if (companyFound) {
          localStorage.setItem('swipehire_view_mode', 'employer');
          localStorage.removeItem('onboarding_draft_v2');
          sessionStorage.removeItem('onboarding_draft_v2');
          console.log('[Onboarding] Redirecting to EmployerDashboard...');
          navigate(createPageUrl('EmployerDashboard'), { replace: true });
        } else {
          throw new Error('Company creation verification timeout - company may still be processing');
        }
      }
    } catch (error) {
      console.error('[Onboarding] Completion failed:', error);
      setSavingError(error.message || 'Failed to create profile. Please try again.');
      
      analytics.track('Onboarding Failed', {
        userType,
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
    if (userType === 'candidate') {
      switch (currentStep) {
        case 1:
          return (
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Welcome to SwipeHire!
              </h2>
              <p className="text-gray-600 mb-12 text-lg">Choose your path</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => {
                    setUserType('candidate');
                    handleNext();
                  }}
                  type="button"
                  className="group p-8 rounded-3xl border-2 border-gray-200 hover:border-pink-500 transition-all hover:shadow-xl bg-white"
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <User className="w-10 h-10 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Seeker</h3>
                  <p className="text-gray-500">Find your dream job</p>
                </button>

                <button
                  onClick={() => {
                    setUserType('employer');
                    handleNext();
                  }}
                  type="button"
                  className="group p-8 rounded-3xl border-2 border-gray-200 hover:border-purple-500 transition-all hover:shadow-xl bg-white"
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-10 h-10 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Recruiter</h3>
                  <p className="text-gray-500">Find top talent</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Profile</h2>
              <p className="text-gray-600 mb-8">Make sure everything looks good before publishing</p>
              <ProfileReview data={candidateData} userType="candidate" />
            </div>
          );

        default:
          return null;
      }
    } else if (userType === 'employer') {
      switch (currentStep) {
        case 1:
          return (
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Welcome to SwipeHire!
              </h2>
              <p className="text-gray-600 mb-12 text-lg">Choose your path</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => {
                    setUserType('candidate');
                    handleNext();
                  }}
                  type="button"
                  className="group p-8 rounded-3xl border-2 border-gray-200 hover:border-pink-500 transition-all hover:shadow-xl bg-white"
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <User className="w-10 h-10 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Seeker</h3>
                  <p className="text-gray-500">Find your dream job</p>
                </button>

                <button
                  onClick={() => {
                    setUserType('employer');
                    handleNext();
                  }}
                  type="button"
                  className="group p-8 rounded-3xl border-2 border-gray-200 hover:border-purple-500 transition-all hover:shadow-xl bg-white"
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-10 h-10 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Recruiter</h3>
                  <p className="text-gray-500">Find top talent</p>
                </button>
              </div>
            </div>
          );

        case 2:
          return (
            <div className="max-w-lg mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Information</h2>
              <p className="text-gray-600 mb-8">Let candidates know who you are</p>

              <div className="space-y-6">
                <PhotoUpload
                  value={recruiterData.photo_url}
                  onChange={(url) => setRecruiterData({ ...recruiterData, photo_url: url })}
                />

                <div>
                  <Label>
                    Your Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={recruiterData.recruiter_name}
                    onChange={(e) => setRecruiterData({ ...recruiterData, recruiter_name: e.target.value })}
                    placeholder="John Doe"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>
                    Your Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={recruiterData.title}
                    onChange={(e) => setRecruiterData({ ...recruiterData, title: e.target.value })}
                    placeholder="Senior Recruiter, HR Manager..."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Phone (optional)</Label>
                  <Input
                    value={recruiterData.phone}
                    onChange={(e) => setRecruiterData({ ...recruiterData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          );

        case 3:
          return (
            <div className="max-w-lg mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
              <p className="text-gray-600 mb-8">Tell candidates about your company</p>

              <div className="space-y-6">
                <PhotoUpload
                  value={companyData.logo_url}
                  onChange={(url) => setCompanyData({ ...companyData, logo_url: url })}
                />

                <div>
                  <Label>
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    placeholder="Acme Inc."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <IndustrySelect
                    value={companyData.industry}
                    onChange={(v) => setCompanyData({ ...companyData, industry: v })}
                    placeholder="Select industry"
                  />
                </div>

                <div>
                  <Label>Location</Label>
                  <LocationSelect
                    value={companyData.location}
                    onChange={(v) => setCompanyData({ ...companyData, location: v })}
                    placeholder="Company headquarters"
                  />
                </div>

                <div>
                  <Label>Website</Label>
                  <Input
                    value={companyData.website}
                    onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                    placeholder="https://yourcompany.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Company Size</Label>
                  <select
                    value={companyData.size}
                    onChange={(e) => setCompanyData({ ...companyData, size: e.target.value })}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 mt-2"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>
            </div>
          );

        case 4:
          return (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Profile</h2>
              <p className="text-gray-600 mb-8">Everything looks good? Let's get started!</p>
              <ProfileReview 
                data={{
                  recruiter_photo_url: recruiterData.photo_url,
                  recruiter_name: recruiterData.recruiter_name,
                  recruiter_title: recruiterData.title,
                  company_logo_url: companyData.logo_url,
                  company_name: companyData.name,
                  company_industry: companyData.industry,
                  company_location: companyData.location,
                  company_size: companyData.size
                }} 
                userType="employer" 
              />
            </div>
          );

        default:
          return null;
      }
    }

    return null;
  };

  if (!user) {
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