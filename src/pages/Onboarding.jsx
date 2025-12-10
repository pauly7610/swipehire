import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2, ChevronRight, ChevronLeft, Upload, X, Plus, FileText, Loader2, Users } from 'lucide-react';
import JobTitleSelect from '@/components/shared/JobTitleSelect';
import LocationSelect from '@/components/shared/LocationSelect';
import IndustrySelect from '@/components/shared/IndustrySelect';

export default function Onboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);

  // Candidate fields
  const [candidateData, setCandidateData] = useState({
    headline: '',
    bio: '',
    skills: [],
    location: '',
    photo_url: '',
    resume_url: ''
  });
  const [newSkill, setNewSkill] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);

  // Recruiter fields
  const [recruiterData, setRecruiterData] = useState({
    recruiter_name: '',
    title: '',
    phone: '',
    photo_url: ''
  });

  // Company fields
  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
    industry: '',
    location: '',
    website: '',
    logo_url: '',
    size: '11-50'
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Check if role was pre-selected
        const selectedRole = localStorage.getItem('swipehire_selected_role');
        if (selectedRole) {
          setUserType(selectedRole);
          setStep(2);
          localStorage.removeItem('swipehire_selected_role');
        }
      } catch (e) {
        // Not authenticated - will be handled by Layout
        console.error('Auth check failed:', e);
      }
    };
    loadUser();
  }, []);

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'candidate') {
        setCandidateData({ ...candidateData, photo_url: file_url });
      } else if (type === 'recruiter') {
        setRecruiterData({ ...recruiterData, photo_url: file_url });
      } else {
        setCompanyData({ ...companyData, logo_url: file_url });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCandidateData({ ...candidateData, resume_url: file_url });
    } catch (error) {
      console.error('Resume upload failed:', error);
    }
    setUploadingResume(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !candidateData.skills.includes(newSkill.trim())) {
      setCandidateData({
        ...candidateData,
        skills: [...candidateData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setCandidateData({
      ...candidateData,
      skills: candidateData.skills.filter(s => s !== skillToRemove)
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      if (userType === 'candidate') {
        await base44.entities.Candidate.create({
          user_id: user.id,
          ...candidateData
        });
        navigate(createPageUrl('SwipeJobs'));
      } else {
        // Save recruiter info to user profile
        await base44.auth.updateMe({
          recruiter_name: recruiterData.recruiter_name,
          recruiter_title: recruiterData.title,
          recruiter_photo: recruiterData.photo_url
        });
        
        // Create company
        await base44.entities.Company.create({
          user_id: user.id,
          ...companyData
        });
        navigate(createPageUrl('EmployerDashboard'));
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
    setLoading(false);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome, {user?.full_name}!</h2>
            <p className="text-gray-600 mb-12">What brings you to SwipeHire?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
              <button
                onClick={() => { setUserType('candidate'); setStep(2); }}
                className="group p-8 rounded-3xl border-2 border-gray-200 hover:border-pink-500 transition-all hover:shadow-lg"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="w-10 h-10 text-pink-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Seeker</h3>
                <p className="text-gray-500">Find opportunities and connect with employers</p>
              </button>

              <button
                onClick={() => { setUserType('employer'); setStep(2); }}
                className="group p-8 rounded-3xl border-2 border-gray-200 hover:border-purple-500 transition-all hover:shadow-lg"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-10 h-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Recruiter</h3>
                <p className="text-gray-500">Find talent for your company</p>
              </button>
            </div>
          </motion.div>
        );

      case 2:
        if (userType === 'candidate') {
          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-lg mx-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Profile</h2>
              <p className="text-gray-600 mb-8">Let employers know who you are</p>

              <div className="space-y-6">
                {/* Photo Upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    {candidateData.photo_url ? (
                      <img
                        src={candidateData.photo_url}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-12 h-12 text-pink-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-10 h-10 swipe-gradient rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                      <Upload className="w-5 h-5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'candidate')} />
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700">Industry</Label>
                  <div className="mt-2">
                    <IndustrySelect
                      value={candidateData.industry}
                      onChange={(v) => setCandidateData({ ...candidateData, industry: v, headline: '' })}
                      placeholder="Select your industry"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700">Job Title / Role</Label>
                  <div className="mt-2">
                    <JobTitleSelect
                      value={candidateData.headline}
                      onChange={(v) => setCandidateData({ ...candidateData, headline: v })}
                      placeholder={candidateData.industry ? "Select your job title" : "Select industry first"}
                      industry={candidateData.industry}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700">Short Bio (max 250 characters)</Label>
                  <Textarea
                    placeholder="Tell employers about yourself..."
                    value={candidateData.bio}
                    onChange={(e) => setCandidateData({ ...candidateData, bio: e.target.value.slice(0, 250) })}
                    className="mt-2 rounded-xl resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-400 mt-1">{candidateData.bio.length}/250</p>
                </div>

                <div>
                  <Label className="text-gray-700">Location</Label>
                  <div className="mt-2">
                    <LocationSelect
                      value={candidateData.location}
                      onChange={(v) => setCandidateData({ ...candidateData, location: v })}
                      placeholder="Select your location"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700">Skills</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add a skill"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      className="h-12 rounded-xl"
                    />
                    <Button onClick={addSkill} className="swipe-gradient h-12 px-4 rounded-xl">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {candidateData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 rounded-full text-sm font-medium"
                      >
                        {skill}
                        <button onClick={() => removeSkill(skill)}>
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resume Upload */}
                <div>
                  <Label className="text-gray-700">Resume (PDF, DOC, DOCX)</Label>
                  <div className="mt-2">
                    {candidateData.resume_url ? (
                      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700">Resume uploaded</p>
                          <a 
                            href={candidateData.resume_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline"
                          >
                            View resume
                          </a>
                        </div>
                        <button 
                          onClick={() => setCandidateData({ ...candidateData, resume_url: '' })}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-400 transition-colors">
                        {uploadingResume ? (
                          <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-gray-400" />
                            <span className="text-gray-500">Click to upload your resume</span>
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
              </div>
            </motion.div>
          );
        } else if (userType === 'employer') {
          // Recruiter flow
          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-lg mx-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Recruiter Profile</h2>
              <p className="text-gray-600 mb-8">Tell candidates about yourself and your company</p>

              <div className="space-y-6">
                {/* Recruiter Photo Upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    {recruiterData.photo_url ? (
                      <img
                        src={recruiterData.photo_url}
                        alt="Recruiter"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-12 h-12 text-purple-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-10 h-10 swipe-gradient rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                      <Upload className="w-5 h-5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'recruiter')} />
                    </label>
                  </div>
                </div>

                {/* Recruiter Info Section */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-500" /> Your Information
                  </h3>
                  
                  <div>
                    <Label className="text-gray-700">Your Name</Label>
                    <Input
                      placeholder="Your full name"
                      value={recruiterData.recruiter_name}
                      onChange={(e) => setRecruiterData({ ...recruiterData, recruiter_name: e.target.value })}
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">Your Title</Label>
                    <Input
                      placeholder="e.g., Senior Recruiter, HR Manager"
                      value={recruiterData.title}
                      onChange={(e) => setRecruiterData({ ...recruiterData, title: e.target.value })}
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>
                </div>

                {/* Company Info Section */}
                <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-500" /> Company Information
                    </h3>
                    {companyData.logo_url && (
                      <img src={companyData.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-gray-700">Company Name</Label>
                      <Input
                        placeholder="Your company name"
                        value={companyData.name}
                        onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                        className="mt-2 h-12 rounded-xl"
                      />
                    </div>
                    <div className="pt-7">
                      <label className="flex items-center justify-center w-12 h-12 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 transition-colors">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'company')} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-700">Industry</Label>
                    <div className="mt-2">
                      <IndustrySelect
                        value={companyData.industry}
                        onChange={(v) => setCompanyData({ ...companyData, industry: v })}
                        placeholder="Select your industry"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-700">Company Website</Label>
                    <Input
                      placeholder="https://yourcompany.com"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Location</Label>
                      <div className="mt-2">
                        <LocationSelect
                          value={companyData.location}
                          onChange={(v) => setCompanyData({ ...companyData, location: v })}
                          placeholder="Select location"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700">Company Size</Label>
                      <select
                        value={companyData.size}
                        onChange={(e) => setCompanyData({ ...companyData, size: e.target.value })}
                        className="mt-2 w-full h-12 rounded-xl border border-gray-200 px-3"
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
              </div>
            </motion.div>
          );
        }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
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
      `}</style>

      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold swipe-gradient-text">SwipeHire</h1>
        {step > 1 && (
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            className="text-gray-600"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
        )}
      </header>

      {/* Progress */}
      <div className="px-6 mb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-2">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'swipe-gradient' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'swipe-gradient' : 'bg-gray-200'}`} />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-6 pb-32">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </main>

      {/* Footer */}
      {step === 2 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={handleComplete}
              disabled={loading || (userType === 'candidate' ? !candidateData.headline : (!recruiterData.recruiter_name || !companyData.name))}
              className="w-full swipe-gradient text-white h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-pink-500/25 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}