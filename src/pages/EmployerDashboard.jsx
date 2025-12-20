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
  Building2, ArrowRight, CheckCircle2, Clock, Eye, Video, BarChart3, Sparkles, Zap, Bot, Search
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { format, isSameDay, addHours, addMinutes, differenceInHours, differenceInMinutes } from 'date-fns';
import AICandidateSourcing from '@/components/recruiter/AICandidateSourcing';
import AutoScheduler from '@/components/recruiter/AutoScheduler';
import RecruitmentAnalytics from '@/components/recruiter/RecruitmentAnalytics';
import AdvancedHiringAnalytics from '@/components/analytics/AdvancedHiringAnalytics';
import AIRecruiterAssistant from '@/components/recruiter/AIRecruiterAssistant';

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
  const [user, setUser] = useState(null);
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [allCompanies, setAllCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const [companyData] = await base44.entities.Company.filter({ user_id: currentUser.id });
      
      // Also load all companies for linking
      const companiesList = await base44.entities.Company.list();
      setAllCompanies(companiesList);

      if (!companyData) {
        navigate(createPageUrl('Onboarding'), { replace: true });
        return;
      }

      if (companyData) {
        setCompany(companyData);

        const [companyJobs, companyMatches, companyInterviews, allCandidates, allUsers, companySwipes] = await Promise.all([
          base44.entities.Job.filter({ company_id: companyData.id }),
          base44.entities.Match.filter({ company_id: companyData.id }),
          base44.entities.Interview.filter({ company_id: companyData.id }),
          base44.entities.Candidate.list(),
          base44.entities.User.list(),
          base44.entities.Swipe.filter({ swiper_id: currentUser.id, swiper_type: 'employer' })
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
      navigate(createPageUrl('Welcome'), { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8 pb-24 relative overflow-hidden transition-colors">
      {/* Tech Grid Background (dark mode only) */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,0,92,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,92,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)] dark:opacity-100 opacity-0 transition-opacity" />
      
      {/* Animated Gradient Orbs */}
      <div className="fixed top-0 -left-40 w-80 h-80 bg-pink-500/10 dark:bg-pink-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="fixed bottom-0 -right-40 w-80 h-80 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
        .glass-morphism {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08);
        }
        .dark .glass-morphism {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        .neon-border {
          box-shadow: 0 0 20px rgba(255, 0, 92, 0.3),
                      inset 0 0 20px rgba(255, 0, 92, 0.05);
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(255, 0, 92, 0.4), 0 0 60px rgba(255, 123, 0, 0.2); }
          50% { box-shadow: 0 0 40px rgba(255, 0, 92, 0.6), 0 0 80px rgba(255, 123, 0, 0.3); }
        }
        .glow-on-hover:hover {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .scan-line {
          background: linear-gradient(transparent 50%, rgba(255, 0, 92, 0.03) 50%);
          background-size: 100% 4px;
          animation: scan 8s linear infinite;
        }
        @keyframes scan {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {user?.recruiter_photo ? (
              <div className="relative">
                <img src={user.recruiter_photo} alt={user.recruiter_name} className="w-16 h-16 rounded-full object-cover border-2 border-pink-500/50" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 to-orange-500/20 animate-pulse" />
              </div>
            ) : (
              <div className="relative w-16 h-16 rounded-full swipe-gradient flex items-center justify-center neon-border">
                <Users className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-pink-200 dark:to-orange-200">Welcome back, {user?.recruiter_name || user?.full_name?.split(' ')[0] || 'Recruiter'}!</h1>
              {company ? (
                <button 
                  onClick={() => setShowCompanySearch(true)}
                  className="text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors flex items-center gap-1 text-sm"
                >
                  {user?.recruiter_title || 'Recruiter'} at <span className="font-medium text-gray-900 dark:text-white">{company.name}</span>
                  <Building2 className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => setShowCompanySearch(true)}
                  className="text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 transition-colors flex items-center gap-1 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" /> Link to a company
                </button>
              )}
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to={createPageUrl('PostJob')}>
              <Button className="swipe-gradient text-white shadow-xl shadow-pink-500/30 glow-on-hover">
                <Plus className="w-5 h-5 mr-2" /> Post a Job
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="glass-morphism border-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:neon-border text-gray-600 dark:text-gray-400">
              <Eye className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="sourcing" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:neon-border text-gray-600 dark:text-gray-400">
              <Sparkles className="w-4 h-4 mr-2" /> AI Sourcing
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:neon-border text-gray-600 dark:text-gray-400">
              <Zap className="w-4 h-4 mr-2" /> Scheduling
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:neon-border text-gray-600 dark:text-gray-400">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:neon-border text-gray-600 dark:text-gray-400">
              <Bot className="w-4 h-4 mr-2" /> AI Assistant
            </TabsTrigger>
            </TabsList>

          {/* AI Sourcing Tab */}
          <TabsContent value="sourcing" className="mt-6">
            <AICandidateSourcing jobs={jobs} company={company} />
          </TabsContent>

          {/* Scheduling Tab */}
          <TabsContent value="scheduling" className="mt-6">
            <AutoScheduler 
              matches={matches} 
              candidates={candidates} 
              users={users} 
              jobs={jobs} 
              company={company}
              interviews={interviews}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <AdvancedHiringAnalytics 
              jobs={jobs} 
              matches={matches} 
              interviews={interviews} 
              swipes={swipes}
            />
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai-assistant" className="mt-6">
            <AIRecruiterAssistant 
              jobs={jobs}
              candidates={candidates}
              users={users}
              company={company}
            />
          </TabsContent>



          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.98 }}
              className="group"
            >
              <Card 
                className="glass-morphism overflow-hidden cursor-pointer relative scan-line"
                onClick={() => navigate(createPageUrl(stat.link))}
              >
                <CardContent className="p-6 relative">
                  {/* Animated Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-all duration-500`} />
                  
                  {/* Icon with Neon Effect */}
                  <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.bgColor} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`}>
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity`} />
                    <stat.icon className={`w-7 h-7 relative z-10`} style={{ color: stat.color.includes('pink') ? '#FF005C' : stat.color.includes('purple') ? '#9333EA' : stat.color.includes('blue') ? '#3B82F6' : '#22C55E' }} />
                  </div>
                  
                  {/* Value with Gradient */}
                  <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                  
                  {/* Corner Accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Recent Matches */}
          <Card className="glass-morphism border-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/5">
              <CardTitle className="text-lg text-gray-900 dark:text-white">Recent Matches</CardTitle>
              <Link to={createPageUrl('EmployerMatches')}>
                <Button variant="ghost" size="sm" className="text-pink-400 hover:text-pink-300">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No matches yet</p>
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
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer border border-gray-200 dark:border-white/10 hover:border-pink-500/50 group"
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
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-pink-500 dark:group-hover:text-pink-300 transition-colors">{user?.full_name || 'Candidate'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{job?.title} • {match.match_score}% match</p>
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
          <Card className="glass-morphism border-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/5">
              <CardTitle className="text-lg text-gray-900 dark:text-white">Active Jobs</CardTitle>
              <Link to={createPageUrl('ManageJobs')}>
                <Button variant="ghost" size="sm" className="text-pink-400 hover:text-pink-300">
                  Manage <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {jobs.filter(j => j.is_active).length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No active jobs</p>
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
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer border border-gray-200 dark:border-white/10 hover:border-pink-500/50 group"
                      onClick={() => navigate(createPageUrl('ManageJobs'))}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center neon-border">
                        <Briefcase className="w-5 h-5 text-pink-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white group-hover:text-pink-500 dark:group-hover:text-pink-300 transition-colors">{job.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{job.location} • {job.job_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
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
          <Card className="glass-morphism border-0">
            <CardHeader className="border-b border-gray-100 dark:border-white/5">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <Calendar className="w-5 h-5 text-purple-500 dark:text-purple-400" />
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
          <Card className="glass-morphism border-0 md:col-span-2">
            <CardHeader className="border-b border-gray-100 dark:border-white/5">
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                Interviews on {format(selectedDate, 'EEEE, MMMM d')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getInterviewsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No interviews scheduled for this day</p>
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
                        className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all border border-purple-200 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-500/50 group"
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
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors">{user?.full_name || 'Candidate'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{job?.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                            {format(new Date(interview.scheduled_at), 'h:mm a')}
                          </p>
                          <Badge className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/50">
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
        <Card className="glass-morphism border-0 mt-6">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
              <Clock className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              Upcoming Interviews
            </CardTitle>
            <Link to={createPageUrl('ATS')}>
              <Button variant="ghost" size="sm" className="text-pink-400 hover:text-pink-300">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {interviews.filter(i => i.status === 'scheduled' || i.status === 'confirmed').length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No scheduled interviews</p>
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
                        className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all border border-purple-200 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-500/50 group"
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
                            <p className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-200 truncate transition-colors">{user?.full_name || 'Candidate'}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{job?.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                            {interview.scheduled_at ? format(new Date(interview.scheduled_at), 'MMM d, h:mm a') : 'TBD'}
                          </p>
                          <Badge className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/50 text-xs">
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Company Search/Link Dialog */}
      <Dialog open={showCompanySearch} onOpenChange={setShowCompanySearch}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Your Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search companies..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {allCompanies
                .filter(c => c.name?.toLowerCase().includes(companySearch.toLowerCase()))
                .map(c => (
                  <button
                    key={c.id}
                    onClick={async () => {
                      // Update company to link this user
                      await base44.entities.Company.update(c.id, { user_id: user.id });
                      setCompany(c);
                      setShowCompanySearch(false);
                      loadDashboard();
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors text-left ${company?.id === c.id ? 'bg-pink-50 border border-pink-200' : 'bg-gray-50'}`}
                  >
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-pink-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.industry} • {c.location}</p>
                    </div>
                    {company?.id === c.id && (
                      <CheckCircle2 className="w-5 h-5 text-pink-500" />
                    )}
                  </button>
                ))}
              {allCompanies.filter(c => c.name?.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No companies found</p>
                  <Link to={createPageUrl('CompanyBranding')}>
                    <Button variant="link" className="text-pink-500 mt-2">
                      Create a new company
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}