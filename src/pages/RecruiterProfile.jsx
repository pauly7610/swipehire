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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLogoCropper, setShowLogoCropper] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        setLoading(false);
        return;
      }
      
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

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedLogoFile(file);
    setShowLogoCropper(true);
  };

  const handleLogoCropComplete = async (croppedFile) => {
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
      await base44.entities.Company.update(company.id, { logo_url: file_url });
      setCompany({ ...company, logo_url: file_url });
    } catch (err) {
      console.error('Logo upload failed:', err);
    }
    setUploadingLogo(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to view your profile</p>
            <Button 
              onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
              className="w-full swipe-gradient text-white"
            >
              Login to Continue
            </Button>
          </CardContent>
        </Card>
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
        <div className="h-40 md:h-32 relative">
          <img src={company.cover_image_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="swipe-gradient h-40 md:h-32" />
      )}

      <div className="max-w-2xl mx-auto px-4 md:px-6 -mt-20 md:-mt-16">
        {/* Recruiter Personal Profile Card */}
        <Card className="shadow-xl border-0 mb-6 overflow-visible">
          <CardContent className="pt-0 pb-4 md:pb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="relative -mt-16 md:-mt-12 flex-shrink-0">
                <div className="relative group">
                  {uploading ? (
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                    </div>
                  ) : (user?.photo_url || editData.photo_url) ? (
                    <img 
                      src={user?.photo_url || editData.photo_url} 
                      alt="" 
                      className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setShowImageViewer(true)}
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-10 h-10 md:w-12 md:h-12 text-pink-400" />
                    </div>
                  )}
                  
                  {/* Upload button */}
                  <label className="absolute bottom-0 right-0 w-9 h-9 swipe-gradient rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                    <Upload className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              <Button 
                variant={editing ? "default" : "outline"} 
                onClick={() => editing ? handleSave() : setEditing(true)}
                className={`self-start md:mt-4 h-10 md:h-auto ${editing ? 'swipe-gradient text-white' : ''}`}
              >
                {editing ? 'Save' : <><Edit2 className="w-4 h-4 mr-1 md:mr-2" /> Edit</>}
              </Button>
            </div>

            {/* Recruiter Info */}
            <div className="mt-4">
              {editing ? (
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <Label className="text-sm">Full Name</Label>
                    <Input value={editData.full_name || ''} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} className="mt-1 h-11" />
                  </div>
                  <div>
                    <Label className="text-sm">Title / Role</Label>
                    <Input placeholder="e.g., Senior Technical Recruiter" value={editData.title || ''} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="mt-1 h-11" />
                  </div>
                  <div>
                    <Label className="text-sm">Current Workplace</Label>
                    <Input placeholder="Where do you work?" value={editData.workplace || ''} onChange={(e) => setEditData({ ...editData, workplace: e.target.value })} className="mt-1 h-11" />
                  </div>
                  <div>
                    <Label className="text-sm">Bio</Label>
                    <Textarea placeholder="Tell candidates about yourself..." value={editData.bio || ''} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} className="mt-1" rows={3} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Phone</Label>
                      <Input placeholder="+1 (555) 000-0000" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="mt-1 h-11" />
                    </div>
                    <div>
                      <Label className="text-sm">Years Recruiting</Label>
                      <Input type="number" placeholder="5" value={editData.years_recruiting || ''} onChange={(e) => setEditData({ ...editData, years_recruiting: e.target.value })} className="mt-1 h-11" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">LinkedIn URL</Label>
                    <Input placeholder="https://linkedin.com/in/..." value={editData.linkedin_url || ''} onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })} className="mt-1 h-11" />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">{user?.full_name}</h1>
                  <p className="text-sm md:text-base text-gray-600 mt-1">
                    {user?.title || 'Recruiter'}
                    {user?.workplace && <span className="text-gray-500"> @ {user.workplace}</span>}
                  </p>
                  {user?.bio && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{user.bio}</p>}
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-3 text-gray-500 text-xs md:text-sm">
                    {user?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="truncate">{user.email}</span>
                      </span>
                    )}
                    {user?.years_recruiting && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 md:w-4 md:h-4" />
                        {user.years_recruiting}+ years
                      </span>
                    )}
                  </div>

                  {/* Social Links */}
                  {user?.linkedin_url && (
                    <div className="flex gap-3 mt-3">
                      <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer"
                         className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                        <Linkedin className="w-5 h-5 text-blue-600" />
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 md:flex md:gap-6 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold text-gray-900">{videos.length}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Videos</p>
              </div>
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold text-gray-900">{followers}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold text-gray-900">{videoStats.views}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Views</p>
              </div>
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold text-gray-900">{jobs.filter(j => j.is_active).length}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Active Jobs</p>
              </div>
              <div className="text-center">
                <RecruiterRating rating={averageRating} size="sm" showNumber={false} />
                <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">{reviewCount} Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Tabs */}
        <Tabs defaultValue="about" className="space-y-4 md:space-y-6">
          <TabsList className="w-full bg-white rounded-xl p-1 shadow-sm overflow-x-auto flex-nowrap">
            <TabsTrigger value="about" className="flex-shrink-0 px-3 md:flex-1 text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              About
            </TabsTrigger>
            {company && (
              <TabsTrigger value="company" className="flex-shrink-0 px-3 md:flex-1 text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
                Company
              </TabsTrigger>
            )}
            <TabsTrigger value="videos" className="flex-shrink-0 px-3 md:flex-1 text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Videos
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-shrink-0 px-3 md:flex-1 text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Jobs
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-shrink-0 px-3 md:flex-1 text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{user?.bio || 'No bio yet.'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-4 md:space-y-6">
            {/* Company Header */}
            <Card className="shadow-sm border-0">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start md:items-center gap-3 md:gap-4">
                  <div className="relative group flex-shrink-0">
                    {uploadingLogo ? (
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-pink-500 animate-spin" />
                      </div>
                    ) : company?.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 md:w-8 md:h-8 text-pink-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-7 h-7 swipe-gradient rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                      <Upload className="w-3 h-3 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">{company.name}</h3>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{company.industry}</p>
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-2 text-xs md:text-sm text-gray-400">
                      {company?.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" /> 
                          <span className="truncate">{company.location}</span>
                        </span>
                      )}
                      {company?.size && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 md:w-4 md:h-4" /> {company.size}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to={createPageUrl('CompanyBranding')} className="flex-shrink-0">
                    <Button variant="outline" size="sm" className="text-xs md:text-sm h-9 md:h-auto">
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4 md:mr-1" /> 
                      <span className="hidden md:inline">Edit</span>
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
                  <Video className="w-10 h-10 md:w-12 md:h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm md:text-base text-gray-500">No videos posted yet</p>
                  <Link to={createPageUrl('VideoFeed')}>
                    <Button className="mt-4 swipe-gradient text-white h-10 md:h-auto text-sm md:text-base">
                      Post Your First Video
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
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

          <TabsContent value="jobs" className="space-y-3 md:space-y-4">
            {jobs.filter(j => j.is_active).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-10 h-10 md:w-12 md:h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm md:text-base text-gray-500">No active job postings</p>
                  <Link to={createPageUrl('PostJob')}>
                    <Button className="mt-4 swipe-gradient text-white h-10 md:h-auto text-sm md:text-base">
                      Post a Job
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              jobs.filter(j => j.is_active).map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-3 md:py-4">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">{job.title}</h3>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-1 text-xs md:text-sm text-gray-500">
                          <span className="truncate">{job.location || 'Remote'}</span>
                          <Badge variant="secondary" className="capitalize text-xs w-fit">
                            {job.job_type?.replace('-', ' ')}
                          </Badge>
                        </div>
                        {job.skills_required?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.skills_required.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-[10px] md:text-xs bg-gray-100">
                                {skill}
                              </Badge>
                            ))}
                            {job.skills_required.length > 3 && (
                              <Badge variant="outline" className="text-[10px] md:text-xs">
                                +{job.skills_required.length - 3}
                              </Badge>
                            )}
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

      {/* Logo Cropper */}
      <ImageCropper
        file={selectedLogoFile}
        open={showLogoCropper}
        onOpenChange={setShowLogoCropper}
        onCropComplete={handleLogoCropComplete}
      />
    </div>
  );
}