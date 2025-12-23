import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Trash2, Search, Users, Briefcase, Building2, Video, 
  Flag, Loader2, ShieldAlert, Eye, Ban, Star, UserCog
} from 'lucide-react';
import RecruiterRating from '@/components/recruiter/RecruiterRating';
import { format } from 'date-fns';
import BackfillResumeParser from '@/components/utils/BackfillResumeParser';

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState({});
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [recruiterFeedback, setRecruiterFeedback] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.role !== 'admin') {
        setLoading(false);
        return;
      }

      const [allCandidates, allCompanies, allJobs, allVideos, allUsers, allFeedback] = await Promise.all([
        base44.entities.Candidate.list(),
        base44.entities.Company.list(),
        base44.entities.Job.list(),
        base44.entities.VideoPost.list(),
        base44.entities.User.list(),
        base44.entities.RecruiterFeedback.list()
      ]);

      console.log('Loaded data:', {
        candidates: allCandidates.length,
        companies: allCompanies.length,
        jobs: allJobs.length,
        videos: allVideos.length,
        users: allUsers.length
      });

      setCandidates(allCandidates || []);
      setCompanies(allCompanies || []);
      setJobs(allJobs || []);
      setVideos(allVideos || []);
      setRecruiterFeedback(allFeedback || []);

      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setError(error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !deleteType) return;

    try {
      switch (deleteType) {
        case 'candidate':
          await base44.entities.Candidate.delete(deleteTarget.id);
          setCandidates(candidates.filter(c => c.id !== deleteTarget.id));
          break;
        case 'company':
          await base44.entities.Company.delete(deleteTarget.id);
          setCompanies(companies.filter(c => c.id !== deleteTarget.id));
          break;
        case 'job':
          await base44.entities.Job.delete(deleteTarget.id);
          setJobs(jobs.filter(j => j.id !== deleteTarget.id));
          break;
        case 'video':
          await base44.entities.VideoPost.delete(deleteTarget.id);
          setVideos(videos.filter(v => v.id !== deleteTarget.id));
          break;
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
    setDeleteTarget(null);
    setDeleteType('');
  };

  const handleRejectVideo = async (video) => {
    await base44.entities.VideoPost.update(video.id, { moderation_status: 'rejected' });
    setVideos(videos.map(v => v.id === video.id ? { ...v, moderation_status: 'rejected' } : v));
  };

  const handleApproveVideo = async (video) => {
    await base44.entities.VideoPost.update(video.id, { moderation_status: 'approved', is_flagged: false });
    setVideos(videos.map(v => v.id === video.id ? { ...v, moderation_status: 'approved', is_flagged: false } : v));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 text-center max-w-md">
          <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Data</h1>
          <p className="text-gray-500 mb-4">{error.message || 'Something went wrong'}</p>
          <Button onClick={loadData} className="swipe-gradient text-white">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 text-center max-w-md">
          <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500">You don't have permission to access this page.</p>
        </Card>
      </div>
    );
  }

  const flaggedVideos = videos.filter(v => v.is_flagged);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500">Manage users, profiles, and content</p>
          </div>
          {flaggedVideos.length > 0 && (
            <Badge className="bg-red-500 text-white">
              <Flag className="w-3 h-3 mr-1" /> {flaggedVideos.length} Flagged
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidates.length}</p>
                <p className="text-sm text-gray-500">Candidates</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies.length}</p>
                <p className="text-sm text-gray-500">Companies</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{jobs.length}</p>
                <p className="text-sm text-gray-500">Jobs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Video className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{videos.length}</p>
                <p className="text-sm text-gray-500">Videos</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="candidates">
          <TabsList className="mb-4">
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="recruiters">Recruiters</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="videos">
              Videos {flaggedVideos.length > 0 && <Badge className="ml-2 bg-red-500">{flaggedVideos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="tools">
              🔧 Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="candidates">
            <Card>
              {candidates.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No candidates in the system yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Headline</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates
                      .filter(c => {
                        const u = users[c.user_id];
                        return !search || 
                          u?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                          c.headline?.toLowerCase().includes(search.toLowerCase());
                      })
                      .map((candidate) => {
                        const u = users[candidate.user_id];
                        return (
                          <TableRow key={candidate.id}>
                            <TableCell className="font-medium">{u?.full_name || 'Unknown'}</TableCell>
                            <TableCell>{u?.email || '-'}</TableCell>
                            <TableCell>{candidate.headline || '-'}</TableCell>
                            <TableCell>{format(new Date(candidate.created_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => { setDeleteTarget(candidate); setDeleteType('candidate'); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {candidates.filter(c => {
                      const u = users[c.user_id];
                      return !search || 
                        u?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                        c.headline?.toLowerCase().includes(search.toLowerCase());
                    }).length === 0 && search && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No candidates match your search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="recruiters">
            <Card>
              {companies.length === 0 ? (
                <div className="p-12 text-center">
                  <UserCog className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No recruiters in the system yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recruiter</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Reviews</TableHead>
                      <TableHead>Jobs Posted</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies
                      .filter(c => !search || 
                        c.name?.toLowerCase().includes(search.toLowerCase()) ||
                        users[c.user_id]?.full_name?.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((company) => {
                        const recruiter = users[company.user_id];
                        const feedback = recruiterFeedback.filter(f => f.recruiter_id === company.user_id);
                        const avgRating = feedback.length > 0 
                          ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
                          : 0;
                        const recruiterJobs = jobs.filter(j => j.company_id === company.id);
                        
                        return (
                          <TableRow key={company.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {company.logo_url ? (
                                  <img src={company.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                                    {recruiter?.full_name?.charAt(0) || '?'}
                                  </div>
                                )}
                                <span className="font-medium">{recruiter?.full_name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{recruiter?.email || '-'}</TableCell>
                            <TableCell>{company.name}</TableCell>
                            <TableCell>
                              <RecruiterRating rating={avgRating} size="sm" />
                            </TableCell>
                            <TableCell>{feedback.length}</TableCell>
                            <TableCell>{recruiterJobs.length}</TableCell>
                            <TableCell>{format(new Date(company.created_date), 'MMM d, yyyy')}</TableCell>
                          </TableRow>
                        );
                      })}
                    {companies.filter(c => !search || 
                      c.name?.toLowerCase().includes(search.toLowerCase()) ||
                      users[c.user_id]?.full_name?.toLowerCase().includes(search.toLowerCase())
                    ).length === 0 && search && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No recruiters match your search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <Card>
              {companies.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No companies in the system yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Recruiter</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies
                      .filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()))
                      .map((company) => {
                        const recruiter = users[company.user_id];
                        return (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>{recruiter?.full_name || '-'}</TableCell>
                            <TableCell>{recruiter?.email || '-'}</TableCell>
                            <TableCell>{company.industry || '-'}</TableCell>
                            <TableCell>{company.location || '-'}</TableCell>
                            <TableCell>{format(new Date(company.created_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => { setDeleteTarget(company); setDeleteType('company'); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {companies.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase())).length === 0 && search && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No companies match your search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              {jobs.length === 0 ? (
                <div className="p-12 text-center">
                  <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No jobs in the system yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs
                      .filter(j => !search || j.title?.toLowerCase().includes(search.toLowerCase()))
                      .map((job) => {
                        const company = companies.find(c => c.id === job.company_id);
                        return (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.title}</TableCell>
                            <TableCell>{company?.name || '-'}</TableCell>
                            <TableCell>{job.location || '-'}</TableCell>
                            <TableCell>
                              <Badge className={job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                                {job.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => { setDeleteTarget(job); setDeleteType('job'); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {jobs.filter(j => !search || j.title?.toLowerCase().includes(search.toLowerCase())).length === 0 && search && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No jobs match your search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <Card>
              {videos.length === 0 ? (
                <div className="p-12 text-center">
                  <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No videos in the system yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Author</TableHead>
                      <TableHead>Caption</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos
                      .filter(v => !search || v.caption?.toLowerCase().includes(search.toLowerCase()))
                      .map((video) => {
                        const u = users[video.author_id];
                        return (
                          <TableRow key={video.id} className={video.is_flagged ? 'bg-red-50' : ''}>
                            <TableCell className="font-medium">{u?.full_name || 'Unknown'}</TableCell>
                            <TableCell className="max-w-xs truncate">{video.caption || '-'}</TableCell>
                            <TableCell>{video.type}</TableCell>
                            <TableCell>
                              {video.is_flagged && (
                                <Badge className="bg-red-100 text-red-700 mr-1">
                                  <Flag className="w-3 h-3 mr-1" /> Flagged
                                </Badge>
                              )}
                              <Badge className={
                                video.moderation_status === 'approved' ? 'bg-green-100 text-green-700' :
                                video.moderation_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }>
                                {video.moderation_status || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(video.video_url, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {video.moderation_status !== 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => handleApproveVideo(video)}
                                >
                                  Approve
                                </Button>
                              )}
                              {video.moderation_status !== 'rejected' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-orange-600"
                                  onClick={() => handleRejectVideo(video)}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => { setDeleteTarget(video); setDeleteType('video'); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {videos.filter(v => !search || v.caption?.toLowerCase().includes(search.toLowerCase())).length === 0 && search && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No videos match your search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            {/* Resume Backfill Tool */}
            <BackfillResumeParser
              onComplete={(results) => {
                alert(`Backfill complete!\nSuccess: ${results.success}\nFailed: ${results.failed}`);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this {deleteType}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}