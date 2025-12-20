import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video, Award, TrendingUp, Clock, Target, Loader2,
  Play, CheckCircle, BookOpen, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIInterviewCoach from '@/components/interview/AIInterviewCoach';
import { format } from 'date-fns';

export default function InterviewPrep() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [jobs, setJobs] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCoach, setShowCoach] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate(createPageUrl('Welcome'), { replace: true });
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      if (!candidateData) {
        navigate(createPageUrl('Onboarding'), { replace: true });
        return;
      }
      setCandidate(candidateData);

      const [allSessions, allJobs] = await Promise.all([
        base44.entities.InterviewSession.filter({ candidate_id: candidateData.id }, '-created_date'),
        base44.entities.Job.list()
      ]);

      setSessions(allSessions);

      const jobMap = {};
      allJobs.forEach(j => { jobMap[j.id] = j; });
      setJobs(jobMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const completedSessions = sessions.filter(s => s.completion_status === 'completed');
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / completedSessions.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (showCoach) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              setShowCoach(false);
              loadData();
            }}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <AIInterviewCoach 
            candidate={candidate} 
            job={selectedJob}
            onClose={() => {
              setShowCoach(false);
              loadData();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 pt-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Interview Prep</h1>
          <p className="text-sm text-gray-600">AI coaching for success</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-3xl font-bold text-purple-600">{sessions.length}</p>
              <p className="text-xs text-gray-500">Sessions</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-3xl font-bold text-pink-600">{avgScore}%</p>
              <p className="text-xs text-gray-500">Avg Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start - Mobile Optimized */}
        <Card className="mb-6 border-0 shadow-sm">
          <div className="swipe-gradient p-4">
            <h2 className="text-lg font-bold text-white mb-1">Start Practice</h2>
            <p className="text-sm text-white/90">AI feedback on your answers</p>
          </div>
          <CardContent className="p-3 space-y-2">
            <Button
              onClick={() => { setSelectedJob(null); setShowCoach(true); }}
              className="w-full h-14 swipe-gradient text-white"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Session
            </Button>
          </CardContent>
        </Card>

        {/* Past Sessions */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Practice History</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No practice sessions yet</h3>
                <p className="text-gray-500 mb-6">Start your first session to get AI feedback</p>
                <Button onClick={() => setShowCoach(true)} className="swipe-gradient text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Start First Session
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="capitalize">
                                {session.session_type}
                              </Badge>
                              {session.job_id && (
                                <Badge variant="outline">
                                  {jobs[session.job_id]?.title || 'Role-specific'}
                                </Badge>
                              )}
                              {session.completion_status === 'completed' ? (
                                <Badge className="bg-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Complete
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500">In Progress</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {session.questions?.length || 0} questions • 
                              {session.duration_minutes ? ` ${session.duration_minutes} min • ` : ' '}
                              {format(new Date(session.created_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          {session.overall_score && (
                            <div className="text-center">
                              <p className="text-3xl font-bold text-purple-600">{session.overall_score}%</p>
                              <p className="text-xs text-gray-500">Score</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}