import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, Users, Calendar, MessageCircle, Plus, TrendingUp,
  Building2, ArrowRight, CheckCircle2, Clock, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function EmployerDashboard() {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const user = await base44.auth.me();
      const [companyData] = await base44.entities.Company.filter({ user_id: user.id });
      
      if (companyData) {
        setCompany(companyData);

        const companyJobs = await base44.entities.Job.filter({ company_id: companyData.id });
        setJobs(companyJobs);

        const companyMatches = await base44.entities.Match.filter({ company_id: companyData.id });
        setMatches(companyMatches);

        const companyInterviews = await base44.entities.Interview.filter({ company_id: companyData.id });
        setInterviews(companyInterviews);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
    setLoading(false);
  };

  const stats = [
    { 
      label: 'Active Jobs', 
      value: jobs.filter(j => j.is_active).length, 
      icon: Briefcase, 
      color: 'from-pink-500 to-orange-500',
      bgColor: 'from-pink-50 to-orange-50'
    },
    { 
      label: 'Total Matches', 
      value: matches.length, 
      icon: Users, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50'
    },
    { 
      label: 'Interviews', 
      value: interviews.filter(i => i.status === 'scheduled').length, 
      icon: Calendar, 
      color: 'from-blue-500 to-purple-500',
      bgColor: 'from-blue-50 to-purple-50'
    },
    { 
      label: 'Hired', 
      value: matches.filter(m => m.status === 'hired').length, 
      icon: CheckCircle2, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50'
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
              <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
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
                  {matches.slice(0, 4).map((match) => (
                    <div key={match.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 rounded-full swipe-gradient flex items-center justify-center text-white font-semibold">
                        C
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">New Candidate</p>
                        <p className="text-sm text-gray-500">{match.match_score}% match</p>
                      </div>
                      <Badge className={
                        match.status === 'hired' ? 'bg-green-100 text-green-700' :
                        match.status === 'interviewing' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }>
                        {match.status}
                      </Badge>
                    </div>
                  ))}
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
                    <div key={job.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
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

        {/* Upcoming Interviews */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Upcoming Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviews.filter(i => i.status === 'scheduled').length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No scheduled interviews</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interviews.filter(i => i.status === 'scheduled').slice(0, 6).map((interview) => (
                  <div key={interview.id} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {interview.scheduled_at ? format(new Date(interview.scheduled_at), 'MMM d, h:mm a') : 'TBD'}
                        </p>
                        <p className="text-sm text-gray-500">{interview.interview_type} interview</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}