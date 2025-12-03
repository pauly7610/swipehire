import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, Users, Calendar, MessageCircle, Plus, TrendingUp,
  Building2, ArrowRight, CheckCircle2, Clock, Eye, Video, BarChart3, Sparkles, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isSameDay, addHours, addMinutes, differenceInHours, differenceInMinutes } from 'date-fns';
import AICandidateSourcing from '@/components/recruiter/AICandidateSourcing';
import AutoScheduler from '@/components/recruiter/AutoScheduler';
import RecruitmentAnalytics from '@/components/recruiter/RecruitmentAnalytics';

export default function EmployerDashboard() {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [swipes, setSwipes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const user = await base44.auth.me();
      const [companyData] = await base44.entities.Company.filter({ user_id: user.id });
      
      if (companyData) {
        setCompany(companyData);

        const [companyJobs, companyMatches, companyInterviews, allCandidates, allUsers, companySwipes] = await Promise.all([
          base44.entities.Job.filter({ company_id: companyData.id }),
          base44.entities.Match.filter({ company_id: companyData.id }),
          base44.entities.Interview.filter({ company_id: companyData.id }),
          base44.entities.Candidate.list(),
          base44.entities.User.list(),
          base44.entities.Swipe.filter({ swiper_id: user.id, swiper_type: 'employer' })
        ]);

        setJobs(companyJobs);
        setMatches(companyMatches);
        setInterviews(companyInterviews);
        setSwipes(companySwipes);

        const candidateMap = {};
        allCandidates.forEach(c => { candidateMap[c.id] = c; });
        setCandidates(candidateMap);

        const userMap = {};
        allUsers.forEach(u => { userMap[u.id] = u; });
        setUsers(userMap);

        // Check and send interview reminders
        await checkInterviewReminders(companyInterviews, candidateMap, userMap, companyData);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
    setLoading(false);
  };

  const checkInterviewReminders = async (interviewsList, candidatesMap, usersMap, companyData) => {
    const now = new Date();
    
    for (const interview of interviewsList) {
      if (!interview.scheduled_at || interview.status === 'completed' || interview.status === 'cancelled') continue;
      
      const scheduledTime = new Date(interview.scheduled_at);
      const hoursUntil = differenceInHours(scheduledTime, now);
      const minutesUntil = differenceInMinutes(scheduledTime, now);
      
      const candidate = candidatesMap[interview.candidate_id];
      const candidateUser = candidate ? usersMap[candidate.user_id] : null;
      const job = jobs.find(j => j.id === interview.job_id);
      
      // Define reminder intervals
      const reminderIntervals = [
        { hours: 48, key: 'reminder_48h' },
        { hours: 24, key: 'reminder_24h' },
        { hours: 1, key: 'reminder_1h' },
        { minutes: 15, key: 'reminder_15m' }
      ];

      for (const reminder of reminderIntervals) {
        const targetMinutes = reminder.hours ? reminder.hours * 60 : reminder.minutes;
        const isWithinWindow = minutesUntil <= targetMinutes && minutesUntil > (targetMinutes - 30);
        const reminderSent = interview[reminder.key];

        if (isWithinWindow && !reminderSent) {
          const timeLabel = reminder.hours ? `${reminder.hours} hour${reminder.hours > 1 ? 's' : ''}` : `${reminder.minutes} minutes`;
          
          // Send to candidate
          if (candidateUser) {
            await base44.entities.Notification.create({
              user_id: candidateUser.id,
              type: 'interview',
              title: `⏰ Interview Reminder`,
              message: `Your interview with ${companyData.name} is in ${timeLabel}!`,
              match_id: interview.match_id,
              navigate_to: 'Chat'
            });

            await base44.integrations.Core.SendEmail({
              to: candidateUser.email,
              subject: `Interview Reminder - ${timeLabel} until your interview`,
              body: `Hi ${candidateUser.full_name},\n\nThis is a reminder that your interview with ${companyData.name} for the ${job?.title || 'position'} is in ${timeLabel}.\n\nScheduled time: ${format(scheduledTime, 'EEEE, MMMM d at h:mm a')}\n\nGood luck!\n\nBest,\nSwipeHire Team`
            });
          }

          // Mark reminder as sent
          await base44.entities.Interview.update(interview.id, { [reminder.key]: true });
        }
      }
    }
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

  const stats = [
    { 
      label: 'Active Jobs', 
      value: jobs.filter(j => j.is_active).length, 
      icon: Briefcase, 
      color: 'from-pink-500 to-orange-500',
      bgColor: 'from-pink-50 to-orange-50',
      link: 'ManageJobs'
    },
    { 
      label: 'Total Matches', 
      value: matches.length, 
      icon: Users, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      link: 'ATS'
    },
    { 
      label: 'Interviews', 
      value: interviews.filter(i => i.status === 'scheduled' || i.status === 'confirmed').length, 
      icon: Calendar, 
      color: 'from-blue-500 to-purple-500',
      bgColor: 'from-blue-50 to-purple-50',
      link: 'ATS'
    },
    { 
      label: 'Hired', 
      value: matches.filter(m => m.status === 'hired').length, 
      icon: CheckCircle2, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      link: 'ATS'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full swipe-gradient animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
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

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl swipe-gradient flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-gray-500">{company?.name || 'Your Company'}</p>
            </div>
          </div>
          <Link to={createPageUrl('PostJob')}>
            <Button className="swipe-gradient text-white shadow-lg shadow-pink-500/25">
              <Plus className="w-5 h-5 mr-2" /> Post a Job
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card 
                className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(createPageUrl(stat.link))}
              >
                <CardContent className="p-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.bgColor} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{ color: stat.color.includes('pink') ? '#FF005C' : stat.color.includes('purple') ? '#9333EA' : stat.color.includes('blue') ? '#3B82F6' : '#22C55E' }} />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Recent Matches */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Matches</CardTitle>
              <Link to={createPageUrl('EmployerMatches')}>
                <Button variant="ghost" size="sm" className="text-pink-500">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No matches yet</p>
                  <Link to={createPageUrl('SwipeCandidates')}>
                    <Button variant="outline" className="mt-4">
                      Start Swiping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 4).map((match) => {
                    const candidate = candidates[match.candidate_id];
                    const user = candidate ? users[candidate.user_id] : null;
                    const job = jobs.find(j => j.id === match.job_id);
                    
                    return (
                      <div 
                        key={match.id} 
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(createPageUrl('EmployerChat') + `?matchId=${match.id}`)}
                      >
                        {candidate?.photo_url ? (
                          <img src={candidate.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full swipe-gradient flex items-center justify-center text-white font-semibold">
                            {user?.full_name?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user?.full_name || 'Candidate'}</p>
                          <p className="text-sm text-gray-500">{job?.title} • {match.match_score}% match</p>
                        </div>
                        <Badge className={
                          match.status === 'hired' ? 'bg-green-100 text-green-700' :
                          match.status === 'interviewing' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {match.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Jobs */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Active Jobs</CardTitle>
              <Link to={createPageUrl('ManageJobs')}>
                <Button variant="ghost" size="sm" className="text-pink-500">
                  Manage <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {jobs.filter(j => j.is_active).length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No active jobs</p>
                  <Link to={createPageUrl('PostJob')}>
                    <Button className="mt-4 swipe-gradient text-white">
                      Post Your First Job
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.filter(j => j.is_active).slice(0, 4).map((job) => (
                    <div 
                      key={job.id} 
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => navigate(createPageUrl('ManageJobs'))}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-pink-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">{job.location} • {job.job_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {matches.filter(m => m.job_id === job.id).length} matches
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interview Calendar Section */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Interview Calendar
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
            <CardHeader>
              <CardTitle className="text-lg">
                Interviews on {format(selectedDate, 'EEEE, MMMM d')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getInterviewsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No interviews scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getInterviewsForDate(selectedDate).map((interview) => {
                    const candidate = candidates[interview.candidate_id];
                    const user = candidate ? users[candidate.user_id] : null;
                    const job = jobs.find(j => j.id === interview.job_id);
                    
                    return (
                      <div 
                        key={interview.id} 
                        className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl cursor-pointer hover:shadow-md transition-all"
                        onClick={() => navigate(createPageUrl('EmployerChat') + `?matchId=${interview.match_id}`)}
                      >
                        {candidate?.photo_url ? (
                          <img src={candidate.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user?.full_name || 'Candidate'}</p>
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

        {/* Upcoming Interviews */}
        <Card className="border-0 shadow-sm mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Upcoming Interviews
            </CardTitle>
            <Link to={createPageUrl('ATS')}>
              <Button variant="ghost" size="sm" className="text-pink-500">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {interviews.filter(i => i.status === 'scheduled' || i.status === 'confirmed').length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No scheduled interviews</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interviews
                  .filter(i => i.status === 'scheduled' || i.status === 'confirmed')
                  .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                  .slice(0, 6)
                  .map((interview) => {
                    const candidate = candidates[interview.candidate_id];
                    const user = candidate ? users[candidate.user_id] : null;
                    const job = jobs.find(j => j.id === interview.job_id);
                    
                    return (
                      <div 
                        key={interview.id} 
                        className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl cursor-pointer hover:shadow-md transition-all"
                        onClick={() => navigate(createPageUrl('EmployerChat') + `?matchId=${interview.match_id}`)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {candidate?.photo_url ? (
                            <img src={candidate.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Users className="w-5 h-5 text-purple-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user?.full_name || 'Candidate'}</p>
                            <p className="text-xs text-gray-500 truncate">{job?.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-purple-600">
                            {interview.scheduled_at ? format(new Date(interview.scheduled_at), 'MMM d, h:mm a') : 'TBD'}
                          </p>
                          <Badge className="bg-white text-purple-600 border border-purple-200 text-xs">
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
    </div>
  );
}