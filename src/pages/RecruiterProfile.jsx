import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, MapPin, Globe, Users, Briefcase, Loader2, 
  Eye, Heart, Play, Video, Linkedin, ExternalLink, Star, User, Edit2, Upload, Mail, Phone
} from 'lucide-react';
import RecruiterFeedbackSection from '@/components/recruiter/RecruiterFeedbackSection';
import RecruiterRating from '@/components/recruiter/RecruiterRating';
import { Link } from 'react-router-dom';
import ImageCropper from '@/components/shared/ImageCropper';
import ImageViewer from '@/components/shared/ImageViewer';

export default function RecruiterProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoStats, setVideoStats] = useState({ views: 0, likes: 0 });
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [companyData] = await base44.entities.Company.filter({ user_id: currentUser.id });
      setCompany(companyData);

      if (companyData) {
        const companyJobs = await base44.entities.Job.filter({ company_id: companyData.id });
        setJobs(companyJobs);
      }

      // Load videos posted by this user
      const userVideos = await base44.entities.VideoPost.filter({ author_id: currentUser.id });
      setVideos(userVideos);
      
      const totalViews = userVideos.reduce((sum, v) => sum + (v.views || 0), 0);
      const totalLikes = userVideos.reduce((sum, v) => sum + (v.likes || 0), 0);
      setVideoStats({ views: totalViews, likes: totalLikes });

      // Load followers
      const followersList = await base44.entities.Follow.filter({ followed_id: currentUser.id });
      setFollowers(followersList.length);

      // Load recruiter feedback
      const feedback = await base44.entities.RecruiterFeedback.filter({ recruiter_id: currentUser.id });
      setReviewCount(feedback.length);
      if (feedback.length > 0) {
        const avg = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
        setAverageRating(avg);
      }

      // Set edit data from user
      setEditData({
        full_name: currentUser.full_name,
        title: currentUser.title || '',
        workplace: currentUser.workplace || '',
        bio: currentUser.bio || '',
        phone: currentUser.phone || '',
        linkedin_url: currentUser.linkedin_url || '',
        photo_url: currentUser.photo_url || '',
        years_recruiting: currentUser.years_recruiting || '',
        specialties: currentUser.specialties || []
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
    setLoading(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setShowImageCropper(true);
  };

  const handleCropComplete = async (croppedFile) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
      await base44.auth.updateMe({ photo_url: file_url });
      setUser({ ...user, photo_url: file_url });
      setEditData({ ...editData, photo_url: file_url });
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    try {
      await base44.auth.updateMe(editData);
      setUser({ ...user, ...editData });
      setEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
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
      {company?.cover_image_url ? (
        <div className="h-32 relative">
          <img src={company.cover_image_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="swipe-gradient h-32" />
      )}

      <div className="max-w-2xl mx-auto px-4 -mt-16">
        {/* Recruiter Personal Profile Card */}
        <Card className="shadow-xl border-0 mb-6 overflow-visible">
          <CardContent className="pt-0">
            {editing && (
              <div className="absolute top-4 right-4 z-10">
                <Button 
                  onClick={handleSave}
                  className="swipe-gradient text-white shadow-lg"
                >
                  Save Changes
                </Button>
              </div>
            )}
            <div className="flex justify-between items-start">
              <div className="relative -mt-12">
                <div className="relative group">
                  {uploading ? (
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                    </div>
                  ) : (user?.photo_url || editData.photo_url) ? (
                    <img 
                      src={user?.photo_url || editData.photo_url} 
                      alt="" 
                      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setShowImageViewer(true)}
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-12 h-12 text-pink-400" />
                    </div>
                  )}
                  
                  {/* Upload button - always visible */}
                  <label className="absolute bottom-0 right-0 w-8 h-8 swipe-gradient rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                    <Upload className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              <Button 
                variant={editing ? "default" : "outline"} 
                onClick={() => editing ? handleSave() : setEditing(true)}
                className={`mt-4 ${editing ? 'swipe-gradient text-white' : ''}`}
              >
                {editing ? 'Save Changes' : <><Edit2 className="w-4 h-4 mr-2" /> Edit Profile</>}
              </Button>
            </div>

            {/* Recruiter Info */}
            <div className="mt-4">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={editData.full_name || ''} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Title / Role</Label>
                    <Input placeholder="e.g., Senior Technical Recruiter" value={editData.title || ''} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Current Workplace</Label>
                    <Input placeholder="Where do you work?" value={editData.workplace || ''} onChange={(e) => setEditData({ ...editData, workplace: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <Textarea placeholder="Tell candidates about yourself..." value={editData.bio || ''} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} className="mt-1" rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <Input placeholder="+1 (555) 000-0000" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Years Recruiting</Label>
                      <Input type="number" placeholder="5" value={editData.years_recruiting || ''} onChange={(e) => setEditData({ ...editData, years_recruiting: e.target.value })} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label>LinkedIn URL</Label>
                    <Input placeholder="https://linkedin.com/in/..." value={editData.linkedin_url || ''} onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })} className="mt-1" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
                      <p className="text-gray-600">
                        {user?.title || 'Recruiter'}
                        {user?.workplace && <span className="text-gray-500"> @ {user.workplace}</span>}
                      </p>
                      {user?.bio && <p className="text-gray-500 text-sm mt-2">{user.bio}</p>}
                      
                      <div className="flex items-center gap-4 mt-3 text-gray-500 text-sm">
                        {user?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </span>
                        )}
                        {user?.years_recruiting && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {user.years_recruiting}+ years recruiting
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="flex-shrink-0"
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Edit Profile
                    </Button>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-3 mt-3">
                    {user?.linkedin_url && (
                      <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer"
                         className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                        <Linkedin className="w-4 h-4 text-blue-600" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex gap-6 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{videos.length}</p>
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
                <p className="text-xl font-bold text-gray-900">{jobs.filter(j => j.is_active).length}</p>
                <p className="text-xs text-gray-500">Active Jobs</p>
              </div>
              <div className="text-center">
                <RecruiterRating rating={averageRating} size="sm" showNumber={false} />
                <p className="text-xs text-gray-500 mt-0.5">{reviewCount} Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Tabs */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="w-full bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="about" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              About
            </TabsTrigger>
            {company && (
              <TabsTrigger value="company" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
                Company
              </TabsTrigger>
            )}
            <TabsTrigger value="videos" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Videos
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Jobs
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{user?.bio || 'No bio yet.'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            {/* Company Header */}
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {company?.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-pink-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-500">{company.industry}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                      {company?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {company.location}
                        </span>
                      )}
                      {company?.size && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" /> {company.size}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to={createPageUrl('CompanyBranding')}>
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-1" /> Edit Company
                    </Button>
                  </Link>
                </div>
                
                {/* Company Social Links */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  {company?.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <Globe className="w-4 h-4 mr-1" /> Website
                      </Button>
                    </a>
                  )}
                  {company?.linkedin_url && (
                    <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <Linkedin className="w-4 h-4 mr-1" /> LinkedIn
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {company?.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About the Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{company.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Mission */}
            {company?.mission && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{company.mission}</p>
                </CardContent>
              </Card>
            )}

            {/* Culture Traits */}
            {company?.culture_traits?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Culture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {company.culture_traits.map((trait, i) => (
                      <Badge key={i} className="bg-purple-100 text-purple-700">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {company?.benefits?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {company.benefits.map((benefit, i) => (
                      <Badge key={i} className="bg-green-100 text-green-700">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            {videos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No videos posted yet</p>
                  <Link to={createPageUrl('VideoFeed')}>
                    <Button className="mt-4 swipe-gradient text-white">
                      Post Your First Video
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {videos.map((video) => (
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

          <TabsContent value="jobs" className="space-y-4">
            {jobs.filter(j => j.is_active).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No active job postings</p>
                  <Link to={createPageUrl('PostJob')}>
                    <Button className="mt-4 swipe-gradient text-white">
                      Post a Job
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              jobs.filter(j => j.is_active).map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-pink-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{job.location || 'Remote'}</span>
                          <Badge variant="secondary" className="capitalize">
                            {job.job_type?.replace('-', ' ')}
                          </Badge>
                        </div>
                        {job.skills_required?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.skills_required.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs bg-gray-100">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <RecruiterFeedbackSection 
              recruiterId={user?.id} 
              companyId={company?.id}
              canLeaveFeedback={false}
            />
          </TabsContent>
        </Tabs>
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

      {/* Image Cropper */}
      <ImageCropper
        file={selectedFile}
        open={showImageCropper}
        onOpenChange={setShowImageCropper}
        onCropComplete={handleCropComplete}
      />

      {/* Image Viewer */}
      <ImageViewer
        imageUrl={user?.photo_url || editData.photo_url}
        open={showImageViewer}
        onOpenChange={setShowImageViewer}
        title={user?.full_name}
      />
    </div>
  );
}