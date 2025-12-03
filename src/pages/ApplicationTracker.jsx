import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  Briefcase, Building2, MapPin, Clock, CheckCircle2, XCircle, 
  Eye, Users, Calendar, Loader2, FileText, TrendingUp, Video
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, isSameDay } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      setCandidate(candidateData);

      if (candidateData) {
        // Get all jobs and companies first
        const allJobs = await base44.entities.Job.list();
        const jobMap = {};
        allJobs.forEach(j => { jobMap[j.id] = j; });
        setJobs(jobMap);

        const allCompanies = await base44.entities.Company.list();
        const companyMap = {};
        allCompanies.forEach(c => { companyMap[c.id] = c; });
        setCompanies(companyMap);

        // Get swipes (right swipes = applications)
        const swipes = await base44.entities.Swipe.filter({ 
          swiper_id: currentUser.id, 
          swiper_type: 'candidate'
        }, '-created_date');
        
        const rightSwipes = swipes.filter(s => s.direction === 'right' || s.direction === 'super');

        // Get matches for this candidate
        const matches = await base44.entities.Match.filter({ candidate_id: candidateData.id });
        const matchByJobId = {};
        matches.forEach(m => { matchByJobId[m.job_id] = m; });

        // Build applications from swipes and matches
        const combinedApps = rightSwipes.map(swipe => {
          const job = jobMap[swipe.job_id];
          const match = matchByJobId[swipe.job_id];
          
          let status = 'applied';
          if (match) {
            status = match.status || 'matched';
            if (status === 'matched') status = 'viewed'; // Map matched to viewed stage
          }

          return {
            id: swipe.id,
            job_id: swipe.job_id,
            company_id: job?.company_id,
            status: status,
            created_date: swipe.created_date,
            match_id: match?.id,
            match_score: match?.match_score
          };
        });

        setApplications(combinedApps);

        // Load interviews for this candidate
        const candidateInterviews = await base44.entities.Interview.filter({ candidate_id: candidateData.id });
        setInterviews(candidateInterviews);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
    setLoading(false);
  };

  const getInterviewsForDate = (date) => {
    return interviews.filter(i => {
      if (!i.scheduled_at) return false;
      return isSameDay(new Date(i.scheduled_at), date);
    });
  };

  const interviewDates = interviews
    .filter(i => i.scheduled_at && (i.status === 'scheduled' || i.status === 'confirmed'))
    .map(i => new Date(i.scheduled_at));

  const withdrawApplication = async (appId) => {
    // Delete the swipe to withdraw application
    await base44.entities.Swipe.delete(appId);
    setApplications(applications.filter(a => a.id !== appId));
  };

  const getStatusConfig = (status) => {
    const configs = {
      applied: { color: 'bg-blue-100 text-blue-700', icon: FileText, label: 'Applied' },
      viewed: { color: 'bg-purple-100 text-purple-700', icon: Eye, label: 'Matched' },
      matched: { color: 'bg-purple-100 text-purple-700', icon: Eye, label: 'Matched' },
      shortlisted: { color: 'bg-amber-100 text-amber-700', icon: Users, label: 'Shortlisted' },
      interviewing: { color: 'bg-indigo-100 text-indigo-700', icon: Calendar, label: 'Interviewing' },
      offered: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Offer Received' },
      hired: { color: 'swipe-gradient text-white', icon: CheckCircle2, label: 'Hired!' },
      rejected: { color: 'bg-gray-100 text-gray-500', icon: XCircle, label: 'Not Selected' },
      withdrawn: { color: 'bg-gray-100 text-gray-400', icon: XCircle, label: 'Withdrawn' }
    };
    return configs[status] || configs.applied;
  };

  const filteredApps = filter === 'all' 
    ? applications 
    : applications.filter(a => a.status === filter);

  const stats = {
    total: applications.length,
    active: applications.filter(a => ['applied', 'viewed', 'matched', 'shortlisted', 'interviewing'].includes(a.status)).length,
    interviews: applications.filter(a => a.status === 'interviewing').length,
    offers: applications.filter(a => ['offered', 'hired'].includes(a.status)).length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <style>{`
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Application Tracker</h1>
          <p className="text-gray-500">Track your job applications in one place</p>
        </div>

        {/* Interview Calendar Section */}
        {interviews.filter(i => i.status === 'scheduled' || i.status === 'confirmed').length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            {/* Calendar */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  My Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md"
                  modifiers={{
                    hasInterview: interviewDates
                  }}
                  modifiersStyles={{
                    hasInterview: {
                      backgroundColor: '#FF005C',
                      color: 'white',
                      borderRadius: '50%'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Interviews for Selected Date */}
            <Card className="border-0 shadow-sm md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {format(selectedDate, 'EEEE, MMMM d')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getInterviewsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No interviews on this day</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getInterviewsForDate(selectedDate).map((interview) => {
                      const job = jobs[interview.job_id];
                      const company = companies[job?.company_id];
                      
                      return (
                        <div 
                          key={interview.id} 
                          className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl cursor-pointer hover:shadow-md transition-all"
                          onClick={() => navigate(createPageUrl('Chat') + `?matchId=${interview.match_id}`)}
                        >
                          {company?.logo_url ? (
                            <img src={company.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-purple-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{company?.name || 'Company'}</p>
                            <p className="text-sm text-gray-500">{job?.title}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-purple-600">
                              {format(new Date(interview.scheduled_at), 'h:mm a')}
                            </p>
                            <Badge className="bg-purple-100 text-purple-700">
                              <Video className="w-3 h-3 mr-1" />
                              {interview.interview_type}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Applied', value: stats.total, icon: Briefcase, color: 'from-blue-500 to-blue-600' },
            { label: 'Active', value: stats.active, icon: TrendingUp, color: 'from-green-500 to-green-600' },
            { label: 'Interviews', value: stats.interviews, icon: Calendar, color: 'from-purple-500 to-purple-600' },
            { label: 'Offers', value: stats.offers, icon: CheckCircle2, color: 'from-pink-500 to-orange-500' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-white rounded-xl p-1 shadow-sm flex-wrap h-auto">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg"
            >
              All ({applications.length})
            </TabsTrigger>
            <TabsTrigger 
              value="applied" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg"
            >
              Applied
            </TabsTrigger>
            <TabsTrigger 
              value="interviewing" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg"
            >
              Interviewing
            </TabsTrigger>
            <TabsTrigger 
              value="offered" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg"
            >
              Offers
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Applications List */}
        {filteredApps.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-500 mb-4">Start swiping on jobs to apply!</p>
              <Link to={createPageUrl('SwipeJobs')}>
                <Button className="swipe-gradient text-white">Find Jobs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app, index) => {
              const job = jobs[app.job_id];
              const company = companies[app.company_id];
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        {company?.logo_url ? (
                          <img src={company.logo_url} alt={company.name} className="w-14 h-14 rounded-xl object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-pink-500" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{job?.title || 'Position'}</h3>
                              <p className="text-gray-600">{company?.name || 'Company'}</p>
                            </div>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                            {job?.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" /> Applied {formatDistanceToNow(new Date(app.created_date), { addSuffix: true })}
                            </span>
                            {app.match_score && (
                              <Badge variant="outline" className="text-pink-500 border-pink-200">
                                {app.match_score}% match
                              </Badge>
                            )}
                          </div>

                          {/* Timeline / Progress */}
                          <div className="mt-4 flex items-center gap-1">
                            {['applied', 'viewed', 'shortlisted', 'interviewing', 'offered', 'hired'].map((step, i) => {
                              const stepIndex = ['applied', 'viewed', 'shortlisted', 'interviewing', 'offered', 'hired'].indexOf(app.status);
                              const isComplete = i <= stepIndex && !['rejected', 'withdrawn'].includes(app.status);
                              const isCurrent = i === stepIndex;
                              return (
                                <React.Fragment key={step}>
                                  <div className={`w-3 h-3 rounded-full ${isComplete ? 'swipe-gradient' : 'bg-gray-200'} ${isCurrent ? 'ring-2 ring-pink-300 ring-offset-1' : ''}`} />
                                  {i < 5 && <div className={`flex-1 h-0.5 ${isComplete && i < stepIndex ? 'swipe-gradient' : 'bg-gray-200'}`} />}
                                </React.Fragment>
                              );
                            })}
                          </div>

                          {/* Actions */}
                          {!['rejected', 'withdrawn', 'hired'].includes(app.status) && (
                            <div className="mt-4 flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => withdrawApplication(app.id)}>
                                Withdraw
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}