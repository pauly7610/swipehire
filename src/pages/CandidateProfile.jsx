import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  User, MapPin, Briefcase, GraduationCap, Upload, Plus, X, Edit2, 
  Video, FileText, Star, Zap, Crown, ChevronRight, AlertTriangle,
  Eye, Heart, Users, Link as LinkIcon, Globe, Github, Linkedin, Play, CheckCircle2, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DealBreakersEditor from '@/components/profile/DealBreakersEditor';
import PortfolioSection from '@/components/profile/PortfolioSection';
import JobSuggestions from '@/components/matching/JobSuggestions';
import ResumeParser from '@/components/profile/ResumeParser';
import VideoIntroRecorder from '@/components/candidate/VideoIntroRecorder';
import VideoTranscript from '@/components/candidate/VideoTranscript';
import CredentialsSection from '@/components/profile/CredentialsSection';
import RecommendedConnections from '@/components/networking/RecommendedConnections';
import JobTitleSelect from '@/components/shared/JobTitleSelect';
import IndustrySelect from '@/components/shared/IndustrySelect';
import AIProfileAssistant from '@/components/profile/AIProfileAssistant';
import ResumeViewer from '@/components/profile/ResumeViewer';
import ResumeBuilder from '@/components/profile/ResumeBuilder';
import AICareerCoach from '@/components/candidate/AICareerCoach';
import CalendarIntegration from '@/components/calendar/CalendarIntegration';
import ImageCropper from '@/components/shared/ImageCropper';

export default function CandidateProfile() {
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [newExperience, setNewExperience] = useState({ title: '', company: '', start_date: '', end_date: '', description: '', logo_url: '' });
  const [editingExperienceIndex, setEditingExperienceIndex] = useState(null);
  const [uploadingExpLogo, setUploadingExpLogo] = useState(false);
  const [showExpLogoCropper, setShowExpLogoCropper] = useState(false);
  const [selectedExpLogoFile, setSelectedExpLogoFile] = useState(null);
  const [videoStats, setVideoStats] = useState({ views: 0, likes: 0, posts: 0 });
  const [followers, setFollowers] = useState(0);
  const [userVideos, setUserVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [videoTranscript, setVideoTranscript] = useState(null);
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [showResume, setShowResume] = useState(false);
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  // Update suggested skills when job title changes
  useEffect(() => {
    if (editing && editData.headline) {
      const skills = getSkillsForTitle(editData.headline);
      setSuggestedSkills(skills);
    }
  }, [editing, editData.headline]);

  const loadProfile = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = '/api/auth/login?next=' + encodeURIComponent(window.location.pathname);
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      let [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      
      // Create candidate profile if it doesn't exist
      if (!candidateData) {
        candidateData = await base44.entities.Candidate.create({
          user_id: currentUser.id,
          skills: [],
          experience: [],
          culture_preferences: [],
          deal_breakers: []
        });
      }
      
      setCandidate(candidateData);
      setEditData(candidateData);

      // Load video stats
      const videos = await base44.entities.VideoPost.filter({ author_id: currentUser.id });
      setUserVideos(videos);
      const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
      const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);
      setVideoStats({ views: totalViews, likes: totalLikes, posts: videos.length });

      // Load followers count
      const followersList = await base44.entities.Follow.filter({ followed_id: currentUser.id });
      setFollowers(followersList.length);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setEditData({ ...editData, photo_url: file_url });
  };

  const handleSave = async () => {
    if (candidate?.id) {
      await base44.entities.Candidate.update(candidate.id, editData);
    }
    setCandidate(editData);
    setEditing(false);
  };

  const addSkill = (skill = newSkill) => {
    const skillToAdd = skill.trim();
    if (skillToAdd && !editData.skills?.includes(skillToAdd)) {
      setEditData({
        ...editData,
        skills: [...(editData.skills || []), skillToAdd]
      });
      setNewSkill('');
    }
  };

  const getSkillsForTitle = (title) => {
    const titleLower = title.toLowerCase();
    const skillMap = {
      'software': ['JavaScript', 'Python', 'React', 'Node.js', 'Git', 'SQL', 'TypeScript', 'AWS', 'Docker', 'REST APIs'],
      'developer': ['JavaScript', 'Python', 'React', 'Node.js', 'Git', 'SQL', 'TypeScript', 'AWS', 'Docker', 'REST APIs'],
      'frontend': ['React', 'JavaScript', 'CSS', 'HTML', 'TypeScript', 'Vue.js', 'Tailwind CSS', 'Responsive Design', 'Git'],
      'backend': ['Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'REST APIs', 'GraphQL', 'Docker', 'AWS', 'Microservices'],
      'data': ['Python', 'SQL', 'Pandas', 'NumPy', 'Machine Learning', 'TensorFlow', 'Data Visualization', 'Statistics', 'Excel'],
      'analyst': ['Excel', 'SQL', 'Tableau', 'Power BI', 'Python', 'Data Analysis', 'Statistics', 'Business Intelligence'],
      'designer': ['Figma', 'Adobe XD', 'Sketch', 'UI/UX', 'Photoshop', 'Illustrator', 'Prototyping', 'User Research', 'Wireframing'],
      'marketing': ['SEO', 'Google Analytics', 'Content Marketing', 'Social Media', 'Google Ads', 'Email Marketing', 'Copywriting', 'Facebook Ads'],
      'manager': ['Leadership', 'Project Management', 'Agile', 'Scrum', 'Team Building', 'Strategic Planning', 'Communication', 'Jira'],
      'sales': ['Salesforce', 'Cold Calling', 'Negotiation', 'CRM', 'Lead Generation', 'B2B Sales', 'Account Management', 'Closing'],
      'hr': ['Recruiting', 'Employee Relations', 'Performance Management', 'HRIS', 'Talent Acquisition', 'Onboarding', 'Compensation'],
      'accountant': ['QuickBooks', 'Excel', 'Financial Reporting', 'Tax Preparation', 'Bookkeeping', 'GAAP', 'Auditing', 'Accounts Payable'],
      'engineer': ['AutoCAD', 'SolidWorks', 'MATLAB', 'Project Management', 'Technical Writing', 'Problem Solving', 'CAD'],
    };

    for (const [key, skills] of Object.entries(skillMap)) {
      if (titleLower.includes(key)) {
        return skills.filter(s => !editData.skills?.includes(s));
      }
    }
    return [];
  };

  const removeSkill = (skill) => {
    setEditData({
      ...editData,
      skills: editData.skills?.filter(s => s !== skill)
    });
  };

  const addExperience = async () => {
    let updatedExperience;
    if (editingExperienceIndex !== null) {
      // Update existing experience
      updatedExperience = [...(editData.experience || [])];
      updatedExperience[editingExperienceIndex] = newExperience;
    } else {
      // Add new experience
      updatedExperience = [...(editData.experience || []), newExperience];
    }
    
    const updatedData = { ...editData, experience: updatedExperience };
    
    setEditData(updatedData);
    
    if (candidate?.id) {
      await base44.entities.Candidate.update(candidate.id, { experience: updatedExperience });
      setCandidate(updatedData);
    }
    
    setNewExperience({ title: '', company: '', start_date: '', end_date: '', description: '', logo_url: '' });
    setEditingExperienceIndex(null);
    setShowExperienceModal(false);
  };

  const handleExpLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedExpLogoFile(file);
    setShowExpLogoCropper(true);
  };

  const handleExpLogoCropComplete = async (croppedFile) => {
    setUploadingExpLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
      setNewExperience({ ...newExperience, logo_url: file_url });
    } catch (err) {
      console.error('Logo upload failed:', err);
    }
    setUploadingExpLogo(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full swipe-gradient animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
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

      {/* Header Banner */}
      <div className="swipe-gradient h-32 relative">
        {/* Edit/Save Button - Top Right */}
        <div className="absolute top-4 right-4">
          <Button
            variant={editing ? "default" : "outline"}
            onClick={() => editing ? handleSave() : setEditing(true)}
            className={editing ? "bg-white text-pink-600 shadow-lg" : "bg-white border-white text-gray-900 shadow-lg"}
          >
            {editing ? (
              <>Save Changes</>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" /> 
                Edit Profile
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-16">
        {/* Profile Card */}
        <Card className="shadow-xl border-0 mb-6 overflow-visible">
          <CardContent className="pt-0">
            {/* Profile Photo */}
            <div className="flex justify-between items-start">
              <div className="relative -mt-12">
                {editing ? (
                  <label className="cursor-pointer">
                    {editData.photo_url ? (
                      <img
                        src={editData.photo_url}
                        alt="Profile"
                        className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-2xl bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-8 h-8 swipe-gradient rounded-full flex items-center justify-center">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                ) : (
                  candidate?.photo_url ? (
                    <img
                      src={candidate.photo_url}
                      alt="Profile"
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-12 h-12 text-pink-400" />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-6 mt-4 mb-2">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{videoStats.posts}</p>
                <p className="text-xs text-gray-500">Videos</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{followers}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{videoStats.views}</p>
                <p className="text-xs text-gray-500">Views</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{videoStats.likes}</p>
                <p className="text-xs text-gray-500">Likes</p>
              </div>
            </div>

            {/* Info */}
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
              {editing ? (
                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-sm text-gray-600">Industry</Label>
                    <div className="flex gap-2 mt-1">
                      <IndustrySelect
                        value={editData.industry || ''}
                        onChange={(v) => {
                          if (v === 'other') {
                            setEditData({ ...editData, industry: '', headline: '' });
                          } else {
                            setEditData({ ...editData, industry: v, headline: '' });
                          }
                        }}
                        placeholder="Select or type custom"
                      />
                    </div>
                    <Input
                      value={editData.industry || ''}
                      onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                      placeholder="Or type your own industry"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Job Title</Label>
                    <JobTitleSelect
                      value={editData.headline || ''}
                      onChange={(v) => setEditData({ ...editData, headline: v })}
                      placeholder="Select or type your job title"
                      industry={editData.industry}
                      allowCustom
                    />
                    <Input
                      value={editData.headline || ''}
                      onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                      placeholder="Or type your own job title"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Current Company</Label>
                    <Input
                      value={editData.current_company || ''}
                      onChange={(e) => setEditData({ ...editData, current_company: e.target.value })}
                      placeholder="Where do you currently work?"
                      className="mt-2"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  {candidate?.headline || 'Add your job title'}
                  {candidate?.current_company && <span className="text-gray-500"> @ {candidate.current_company}</span>}
                </p>
              )}

              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <MapPin className="w-4 h-4" />
                {editing ? (
                  <Input
                    value={editData.location || ''}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    placeholder="Your location"
                    className="h-8"
                  />
                ) : (
                  <span>{candidate?.location || 'Add location'}</span>
                )}
              </div>

              {/* View Resume Button */}
              {candidate?.resume_url && !editing && (
                <Button
                  variant="outline"
                  onClick={() => setShowResume(true)}
                  className="mt-3 w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Resume
                </Button>
              )}

              {/* Social Links */}
              {editing ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    <Input
                      value={editData.linkedin_url || ''}
                      onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })}
                      placeholder="LinkedIn URL"
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-gray-800" />
                    <Input
                      value={editData.github_url || ''}
                      onChange={(e) => setEditData({ ...editData, github_url: e.target.value })}
                      placeholder="GitHub URL"
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-600" />
                    <Input
                      value={editData.website_url || ''}
                      onChange={(e) => setEditData({ ...editData, website_url: e.target.value })}
                      placeholder="Personal Website"
                      className="h-8"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 mt-3">
                  {candidate?.linkedin_url && (
                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" 
                       className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                    </a>
                  )}
                  {candidate?.github_url && (
                    <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                       className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <Github className="w-4 h-4 text-gray-800" />
                    </a>
                  )}
                  {candidate?.website_url && (
                    <a href={candidate.website_url} target="_blank" rel="noopener noreferrer"
                       className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors">
                      <Globe className="w-4 h-4 text-green-600" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="w-full bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="about" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              About
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Videos
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Experience
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Credentials
            </TabsTrigger>
            <TabsTrigger value="resume" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Resume Builder
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Career Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Me</CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea
                    value={editData.bio || ''}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value.slice(0, 250) })}
                    placeholder="Tell employers about yourself..."
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-600">{candidate?.bio || 'Add a bio to tell employers about yourself.'}</p>
                )}
              </CardContent>
            </Card>

            {/* AI Assistant */}
            {editing && (
              <AIProfileAssistant
                candidate={editData}
                resumeUrl={candidate?.resume_url}
                onUpdate={(updates) => setEditData({ ...editData, ...updates })}
              />
            )}

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {editing && (
                  <>
                    {/* Suggested Skills */}
                    {suggestedSkills.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2">Suggested for {editData.headline}:</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedSkills.slice(0, 10).map((skill) => (
                            <Badge
                              key={skill}
                              className="cursor-pointer bg-white text-blue-700 hover:bg-blue-100 border border-blue-200"
                              onClick={() => addSkill(skill)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Manual Skill Input */}
                    <div className="flex gap-2 mb-4">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a custom skill"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <Button onClick={() => addSkill()} className="swipe-gradient">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </>
                )}
                
                {/* Current Skills */}
                <div className="flex flex-wrap gap-2">
                  {(editing ? editData.skills : candidate?.skills)?.map((skill) => (
                    <Badge
                      key={skill}
                      className="bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 border-0 px-3 py-1.5"
                    >
                      {skill}
                      {editing && (
                        <button onClick={() => removeSkill(skill)} className="ml-2">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!candidate?.skills || candidate.skills.length === 0) && !editing && (
                    <p className="text-gray-400">No skills added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            {candidate?.experience?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Work Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidate.experience.map((exp, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-pink-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                        <p className="text-gray-600">{exp.company}</p>
                        <p className="text-sm text-gray-400">{exp.start_date} - {exp.end_date || 'Present'}</p>
                        {exp.description && (
                          <div 
                            className="text-gray-600 mt-2 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: exp.description }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Experience Level & Culture */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Experience & Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Experience Level</Label>
                    {editing ? (
                      <Select 
                        value={editData.experience_level || ''} 
                        onValueChange={(v) => setEditData({ ...editData, experience_level: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium capitalize">{candidate?.experience_level || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Years of Experience</Label>
                    {editing ? (
                      <Input 
                        type="number" 
                        value={editData.experience_years || ''} 
                        onChange={(e) => setEditData({ ...editData, experience_years: parseInt(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium">{candidate?.experience_years ? `${candidate.experience_years} years` : 'Not set'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Culture Preferences</Label>
                  {editing ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Remote-first', 'Collaborative', 'Fast-paced', 'Work-life balance', 'Innovative', 'Startup', 'Corporate'].map(trait => (
                        <Badge
                          key={trait}
                          className={`cursor-pointer transition-all ${
                            editData.culture_preferences?.includes(trait)
                              ? 'swipe-gradient text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          onClick={() => {
                            const prefs = editData.culture_preferences || [];
                            if (prefs.includes(trait)) {
                              setEditData({ ...editData, culture_preferences: prefs.filter(p => p !== trait) });
                            } else {
                              setEditData({ ...editData, culture_preferences: [...prefs, trait] });
                            }
                          }}
                        >
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {candidate?.culture_preferences?.map(pref => (
                        <Badge key={pref} className="bg-purple-100 text-purple-600">{pref}</Badge>
                      )) || <p className="text-gray-400">No preferences set</p>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Deal Breakers */}
            {editing && (
              <DealBreakersEditor
                dealBreakers={editData.deal_breakers || []}
                onChange={(dealBreakers) => setEditData({ ...editData, deal_breakers: dealBreakers })}
              />
            )}

            {!editing && candidate?.deal_breakers?.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Your Deal Breakers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {candidate.deal_breakers.map((db, i) => (
                      <Badge key={i} variant="secondary">
                        {db.type}: {db.value}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Intro */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="w-5 h-5 text-pink-500" />
                  Video Introduction
                </CardTitle>
                {candidate?.video_intro_url && (
                  <Button variant="outline" size="sm" onClick={() => setShowVideoRecorder(true)}>
                    <Edit2 className="w-4 h-4 mr-1" /> Change
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {candidate?.video_intro_url ? (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <video src={candidate.video_intro_url} controls className="max-w-full max-h-64 rounded-xl object-contain" />
                      <Badge className="absolute top-2 left-2 bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Video Added
                      </Badge>
                    </div>
                    <VideoTranscript 
                      videoUrl={candidate.video_intro_url}
                      transcript={candidate.video_transcript || videoTranscript}
                      onTranscriptUpdate={async (transcript) => {
                        setVideoTranscript(transcript);
                        if (candidate?.id) {
                          await base44.entities.Candidate.update(candidate.id, { video_transcript: transcript });
                          setCandidate({ ...candidate, video_transcript: transcript });
                        }
                      }}
                      isGenerating={isGeneratingTranscript}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl">
                    <Video className="w-12 h-12 mx-auto text-pink-400 mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Stand out with a video intro!</h4>
                    <p className="text-gray-500 mb-4 text-sm">Candidates with videos get 2x more views</p>
                    <Button onClick={() => setShowVideoRecorder(true)} className="swipe-gradient text-white">
                      <Video className="w-4 h-4 mr-2" /> Record Video
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            {userVideos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No videos posted yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {userVideos.map((video) => (
                  <div 
                    key={video.id}
                    className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <video 
                      src={video.video_url} 
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <Play className="w-10 h-10 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {video.views || 0}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {video.likes || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="experience" className="space-y-4">
          <Button 
            onClick={() => {
              setNewExperience({ title: '', company: '', start_date: '', end_date: '', description: '', logo_url: '' });
              setEditingExperienceIndex(null);
              setShowExperienceModal(true);
            }} 
            className="w-full swipe-gradient text-white"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Experience
          </Button>

            {(editing ? editData.experience : candidate?.experience)?.map((exp, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-pink-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                          <p className="text-gray-600">{exp.company}</p>
                          <p className="text-sm text-gray-400">{exp.start_date} - {exp.end_date || 'Present'}</p>
                          {exp.description && (
                            <div 
                              className="text-gray-600 mt-2 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: exp.description }}
                            />
                          )}
                        </div>
                        {editing && (
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setNewExperience(exp);
                                setEditingExperienceIndex(i);
                                setShowExperienceModal(true);
                              }}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditData({
                                  ...editData,
                                  experience: editData.experience.filter((_, idx) => idx !== i)
                                });
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!candidate?.experience || candidate.experience.length === 0) && !editing && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No experience added yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="portfolio">
            <PortfolioSection
              candidate={candidate}
              editing={editing}
              editData={editData}
              setEditData={setEditData}
            />
            
            {/* Resume Parser */}
            <div className="mt-6">
              <ResumeParser 
                candidate={candidate}
                onDataExtracted={(data) => {
                  const mergedData = {
                    ...editData,
                    ...data,
                    skills: [...new Set([...(editData.skills || []), ...(data.skills || [])])],
                    experience: [...(data.experience || []), ...(editData.experience || [])]
                  };
                  setEditData(mergedData);
                  if (candidate?.id) {
                    base44.entities.Candidate.update(candidate.id, mergedData);
                    setCandidate(mergedData);
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="credentials">
            <CredentialsSection
              candidate={candidate}
              editing={editing}
              editData={editData}
              setEditData={setEditData}
            />
          </TabsContent>

          <TabsContent value="resume" className="space-y-4">
            <Card className="bg-gradient-to-br from-pink-50 to-orange-50 border-pink-200">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">Build Your Professional Resume</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Create a beautiful, ATS-friendly resume with AI assistance. Your profile data will be automatically imported.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowResumeBuilder(true)}>
                <CardContent className="py-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">AI Resume Builder</h3>
                  <p className="text-sm text-gray-500">Create a professional resume with AI-powered content suggestions</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="py-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Upload Resume</h3>
                  <p className="text-sm text-gray-500 mb-4">Already have a resume? Upload it here</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    id="resume-upload"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        const { file_url } = await base44.integrations.Core.UploadFile({ file });
                        await base44.entities.Candidate.update(candidate.id, { resume_url: file_url });
                        setCandidate({ ...candidate, resume_url: file_url });
                        setEditData({ ...editData, resume_url: file_url });
                      } catch (error) {
                        console.error('Upload failed:', error);
                        alert('Upload failed. Please try again.');
                      }
                    }}
                  />
                  <label htmlFor="resume-upload">
                    <Button variant="outline" size="sm" type="button" asChild>
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" /> Choose File
                      </span>
                    </Button>
                  </label>
                </CardContent>
              </Card>
            </div>

            {candidate?.resume_url && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-10 h-10 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">Current Resume</p>
                        <p className="text-sm text-gray-500">Resume uploaded and ready</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowResume(true)}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Remove current resume?')) {
                            await base44.entities.Candidate.update(candidate.id, { resume_url: null });
                            setCandidate({ ...candidate, resume_url: null });
                            setEditData({ ...editData, resume_url: null });
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            {/* AI Career Coach */}
            <AICareerCoach candidate={candidate} user={user} />
            
            {/* Calendar Integration */}
            <CalendarIntegration userType="candidate" />
          </TabsContent>
        </Tabs>

        {/* Job Suggestions */}
        {candidate?.id && !editing && (
          <div className="mt-6 space-y-6">
            <JobSuggestions candidate={candidate} />
            <RecommendedConnections candidate={candidate} userId={user?.id} userType="candidate" />
          </div>
        )}

        {/* Premium Upsell */}
        {!candidate?.is_premium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="swipe-gradient text-white overflow-hidden">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Crown className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Upgrade to Premium</h3>
                    <p className="text-white/80 text-sm">Get more visibility, unlimited SuperSwipes, and exclusive features</p>
                  </div>
                  <ChevronRight className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black">
          {selectedVideo && (
            <div className="relative">
              <video 
                src={selectedVideo.video_url} 
                controls 
                autoPlay
                className="w-full max-h-[80vh]"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                <p className="text-sm">{selectedVideo.caption}</p>
                <div className="flex gap-4 mt-2 text-xs text-white/80">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {selectedVideo.views || 0}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {selectedVideo.likes || 0}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Intro Recorder */}
      <VideoIntroRecorder
        open={showVideoRecorder}
        onOpenChange={setShowVideoRecorder}
        existingVideo={candidate?.video_intro_url}
        onVideoSaved={async (videoUrl) => {
          const updated = { ...candidate, video_intro_url: videoUrl, video_transcript: null };
          await base44.entities.Candidate.update(candidate.id, { video_intro_url: videoUrl, video_transcript: null });
          setCandidate(updated);
          setEditData(updated);
          setVideoTranscript(null);
          setIsGeneratingTranscript(true);
        }}
        onTranscriptGenerated={async (transcript) => {
          setIsGeneratingTranscript(false);
          setVideoTranscript(transcript);
          if (candidate?.id) {
            await base44.entities.Candidate.update(candidate.id, { video_transcript: transcript });
            setCandidate(prev => ({ ...prev, video_transcript: transcript }));
          }
        }}
      />

      {/* Experience Modal */}
      <Dialog open={showExperienceModal} onOpenChange={setShowExperienceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExperienceIndex !== null ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Company Logo (optional)</Label>
              <div className="flex items-center gap-4 mt-2">
                <div className="relative">
                  {uploadingExpLogo ? (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                    </div>
                  ) : newExperience.logo_url ? (
                    <img src={newExperience.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-pink-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-6 h-6 swipe-gradient rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                    <Upload className="w-3 h-3 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleExpLogoUpload} disabled={uploadingExpLogo} />
                  </label>
                </div>
                {newExperience.logo_url && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewExperience({ ...newExperience, logo_url: '' })}
                    className="text-red-500"
                  >
                    <X className="w-4 h-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Job Title</Label>
              <Input
                value={newExperience.title}
                onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={newExperience.company}
                onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="month"
                  value={newExperience.start_date}
                  onChange={(e) => setNewExperience({ ...newExperience, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="month"
                  value={newExperience.end_date}
                  onChange={(e) => setNewExperience({ ...newExperience, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Description (supports formatting)</Label>
              <div className="rounded-lg overflow-hidden" style={{ minHeight: '350px' }}>
                <ReactQuill
                  value={newExperience.description || ''}
                  onChange={(value) => setNewExperience({ ...newExperience, description: value })}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'indent': '-1'}, { 'indent': '+1' }],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'align': [] }],
                      ['link', 'code-block'],
                      ['clean']
                    ]
                  }}
                  placeholder="✨ Describe your role and achievements... Use the toolbar above for formatting!"
                  theme="snow"
                  style={{ height: '250px' }}
                />
              </div>
            </div>
            <Button onClick={addExperience} className="w-full swipe-gradient text-white">
              {editingExperienceIndex !== null ? 'Update Experience' : 'Add Experience'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resume Viewer */}
      <ResumeViewer
        resumeUrl={candidate?.resume_url}
        open={showResume}
        onOpenChange={setShowResume}
      />

      {/* Resume Builder */}
      <ResumeBuilder
        open={showResumeBuilder}
        onOpenChange={setShowResumeBuilder}
        candidate={{ ...candidate, user }}
        onResumeSaved={async (resumeUrl) => {
          await base44.entities.Candidate.update(candidate.id, { resume_url: resumeUrl });
          setCandidate({ ...candidate, resume_url: resumeUrl });
          setEditData({ ...editData, resume_url: resumeUrl });
        }}
      />

      {/* Experience Logo Cropper */}
      <ImageCropper
        file={selectedExpLogoFile}
        open={showExpLogoCropper}
        onOpenChange={setShowExpLogoCropper}
        onCropComplete={handleExpLogoCropComplete}
      />
    </div>
  );
}