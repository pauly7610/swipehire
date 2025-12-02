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
  Video, FileText, Star, Zap, Crown, ChevronRight, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DealBreakersEditor from '@/components/profile/DealBreakersEditor';
import PortfolioSection from '@/components/profile/PortfolioSection';
import JobSuggestions from '@/components/matching/JobSuggestions';
import ResumeParser from '@/components/profile/ResumeParser';

export default function CandidateProfile() {
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [newExperience, setNewExperience] = useState({ title: '', company: '', start_date: '', end_date: '', description: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      setCandidate(candidateData || {});
      setEditData(candidateData || {});
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

  const addSkill = () => {
    if (newSkill.trim() && !editData.skills?.includes(newSkill.trim())) {
      setEditData({
        ...editData,
        skills: [...(editData.skills || []), newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setEditData({
      ...editData,
      skills: editData.skills?.filter(s => s !== skill)
    });
  };

  const addExperience = () => {
    setEditData({
      ...editData,
      experience: [...(editData.experience || []), newExperience]
    });
    setNewExperience({ title: '', company: '', start_date: '', end_date: '', description: '' });
    setShowExperienceModal(false);
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
      <div className="swipe-gradient h-32 relative" />

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

              <Button
                variant={editing ? "default" : "outline"}
                onClick={() => editing ? handleSave() : setEditing(true)}
                className={editing ? "swipe-gradient text-white mt-4" : "mt-4"}
              >
                {editing ? 'Save Changes' : <><Edit2 className="w-4 h-4 mr-2" /> Edit Profile</>}
              </Button>
            </div>

            {/* Info */}
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
              {editing ? (
                <Input
                  value={editData.headline || ''}
                  onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                  placeholder="Your professional headline"
                  className="mt-2"
                />
              ) : (
                <p className="text-gray-600">{candidate?.headline || 'Add your headline'}</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="w-full bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="about" className="flex-1 data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              About
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex-1 data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Experience
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex-1 data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="resume" className="flex-1 data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Resume
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

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {editing && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button onClick={addSkill} className="swipe-gradient">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                )}
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
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="w-5 h-5 text-pink-500" />
                  Video Introduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidate?.video_intro_url ? (
                  <video src={candidate.video_intro_url} controls className="w-full rounded-xl" />
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Video className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-4">Add a 30-second video introduction</p>
                    <Button variant="outline">Record Video</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience" className="space-y-4">
            {editing && (
              <Button 
                onClick={() => setShowExperienceModal(true)} 
                className="w-full swipe-gradient text-white"
              >
                <Plus className="w-5 h-5 mr-2" /> Add Experience
              </Button>
            )}

            {(editing ? editData.experience : candidate?.experience)?.map((exp, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                      <p className="text-gray-600">{exp.company}</p>
                      <p className="text-sm text-gray-400">{exp.start_date} - {exp.end_date || 'Present'}</p>
                      {exp.description && <p className="text-gray-600 mt-2">{exp.description}</p>}
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
          </TabsContent>

          <TabsContent value="resume">
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
          </TabsContent>
        </Tabs>

        {/* Job Suggestions */}
        {candidate?.id && !editing && (
          <div className="mt-6">
            <JobSuggestions candidate={candidate} />
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

      {/* Experience Modal */}
      <Dialog open={showExperienceModal} onOpenChange={setShowExperienceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              <Label>Description</Label>
              <Textarea
                value={newExperience.description}
                onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
              />
            </div>
            <Button onClick={addExperience} className="w-full swipe-gradient text-white">
              Add Experience
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}