import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, Mail, Users, Target, Zap, Loader2, 
  CheckCircle, Clock, TrendingUp, Eye 
} from 'lucide-react';
import { format } from 'date-fns';

export default function JobAlertManager() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [interestSignals, setInterestSignals] = useState([]);
  const [emailEvents, setEmailEvents] = useState([]);
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.role !== 'admin') {
        setLoading(false);
        return;
      }

      const [allCandidates, allJobs, signals, events] = await Promise.all([
        base44.entities.Candidate.list(),
        base44.entities.Job.list(),
        base44.entities.InterestSignal.list(),
        base44.entities.EmailEvent.list()
      ]);

      setCandidates(allCandidates);
      setJobs(allJobs);
      setInterestSignals(signals);
      setEmailEvents(events);

      // Build last sent map
      const sentMap = {};
      events.forEach(e => {
        if (!sentMap[e.recipient_id] || new Date(e.sent_at) > new Date(sentMap[e.recipient_id])) {
          sentMap[e.recipient_id] = e.sent_at;
        }
      });
      setLastSent(sentMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const matchJobToCandidate = (candidate, job) => {
    // Check for interest signals
    const signals = interestSignals.filter(s => 
      s.candidate_id === candidate.id && 
      s.job_id === job.id
    );
    
    if (signals.length > 0) {
      return { match: true, reason: 'interest_signal', score: 95 };
    }

    // Profile-based matching
    let score = 0;
    
    // Title match
    if (candidate.target_job_titles?.some(title => 
      job.title.toLowerCase().includes(title.toLowerCase())
    )) {
      score += 40;
    }

    // Industry match
    if (candidate.target_industries?.includes(job.industry)) {
      score += 30;
    }

    // Location match
    if (candidate.preferred_locations?.includes(job.location) || 
        job.location?.toLowerCase().includes('remote')) {
      score += 20;
    }

    // Seniority match
    if (candidate.target_seniority && job.experience_level === candidate.target_seniority) {
      score += 10;
    }

    return { match: score >= 50, reason: 'profile_match', score };
  };

  const sendJobAlert = async (candidate, job) => {
    if (!candidate.user_id || candidate.email_frequency === 'never') return;

    // Check if already sent
    const existingEvent = emailEvents.find(e => 
      e.recipient_id === candidate.user_id && 
      e.job_id === job.id
    );
    if (existingEvent) return;

    // Check weekly cap
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentEmails = emailEvents.filter(e => 
      e.recipient_id === candidate.user_id &&
      new Date(e.sent_at) > weekAgo
    );
    if (recentEmails.length >= 2) return;

    const users = await base44.entities.User.list();
    const candidateUser = users.find(u => u.id === candidate.user_id);
    if (!candidateUser?.email) return;

    const firstName = candidateUser.full_name?.split(' ')[0] || 'there';
    const company = await base44.entities.Company.filter({ id: job.company_id });
    const companyName = company[0]?.name || 'a company';

    const salaryRange = job.salary_min && job.salary_max 
      ? `$${job.salary_min/1000}k - $${job.salary_max/1000}k`
      : 'Competitive salary';

    const applyLink = `${window.location.origin}/PublicJobView?id=${job.id}`;
    const referralLink = `${window.location.origin}/PublicJobView?id=${job.id}&ref=${candidate.user_id}`;

    const subject = `${firstName}, a role you might like just opened`;
    const body = `Hi ${firstName},

You recently looked at roles like this on SwipeHire, and a new one just went live.

${job.title}
${companyName} — ${job.location || 'Remote'}
${salaryRange}

If it's relevant, you can jump back in and swipe to apply.

👉 View role: ${applyLink}

Not looking right now?
Send this to someone who is — they can apply here: ${referralLink}

— Rell
SwipeHire`;

    try {
      await base44.integrations.Core.SendEmail({
        to: candidateUser.email,
        subject,
        body,
        from_name: 'Rell from SwipeHire'
      });

      await base44.entities.EmailEvent.create({
        recipient_id: candidate.user_id,
        email_type: 'job_alert',
        job_id: job.id,
        subject,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  };

  const sendBulkAlerts = async () => {
    setSending(true);
    let sent = 0;

    for (const job of jobs.filter(j => j.is_active)) {
      for (const candidate of candidates) {
        const { match } = matchJobToCandidate(candidate, job);
        if (match) {
          const success = await sendJobAlert(candidate, job);
          if (success) sent++;
        }
      }
    }

    await loadData();
    setSending(false);
    alert(`Sent ${sent} personalized job alerts`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500">Admin access required.</p>
        </Card>
      </div>
    );
  }

  const eligibleCandidates = candidates.filter(c => 
    c.email_frequency !== 'never' && 
    (c.job_search_status === 'actively_looking' || c.job_search_status === 'passively_open')
  );

  const candidatesWithInterest = candidates.filter(c => 
    interestSignals.some(s => s.candidate_id === c.id)
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Alert Manager</h1>
          <p className="text-gray-600">Send personalized job alerts based on interest signals and preferences</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{eligibleCandidates.length}</p>
              <p className="text-xs text-gray-500">Eligible Candidates</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{candidatesWithInterest}</p>
              <p className="text-xs text-gray-500">With Interest Signals</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Mail className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{emailEvents.length}</p>
              <p className="text-xs text-gray-500">Total Emails Sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 mx-auto text-pink-500 mb-2" />
              <p className="text-2xl font-bold">{jobs.filter(j => j.is_active).length}</p>
              <p className="text-xs text-gray-500">Active Jobs</p>
            </CardContent>
          </Card>
        </div>

        {/* Manual Send */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manual Job Alert Campaign</CardTitle>
            <CardDescription>
              Send personalized alerts to candidates based on their interest signals and stated preferences.
              Max 2 emails per week per candidate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={sendBulkAlerts}
              disabled={sending}
              className="w-full swipe-gradient text-white"
              size="lg"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending Personalized Alerts...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Job Alerts Now
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Note: Backend functions required for automatic triggers. Currently manual send only.
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="signals">
          <TabsList>
            <TabsTrigger value="signals">Interest Signals</TabsTrigger>
            <TabsTrigger value="events">Email Events</TabsTrigger>
            <TabsTrigger value="candidates">Candidate Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="signals">
            <Card>
              <CardHeader>
                <CardTitle>Recent Interest Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {interestSignals.slice(0, 50).map((signal) => {
                    const candidate = candidates.find(c => c.id === signal.candidate_id);
                    const job = jobs.find(j => j.id === signal.job_id);
                    return (
                      <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{candidate?.headline || 'Candidate'}</p>
                          <p className="text-xs text-gray-500">{job?.title || 'Job'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="capitalize text-xs">
                            {signal.signal_type}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {format(new Date(signal.created_date), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {interestSignals.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No interest signals yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Email Campaign History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emailEvents.slice(0, 50).map((event) => {
                    const job = jobs.find(j => j.id === event.job_id);
                    return (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{event.subject}</p>
                          <p className="text-xs text-gray-500">{job?.title || 'General alert'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            className={
                              event.status === 'applied' ? 'bg-green-100 text-green-700' :
                              event.status === 'clicked' ? 'bg-blue-100 text-blue-700' :
                              event.status === 'opened' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }
                          >
                            {event.status}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {format(new Date(event.sent_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {emailEvents.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No emails sent yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Email Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{candidate.headline || 'No title'}</p>
                        <div className="flex gap-2 mt-1">
                          {candidate.target_job_titles?.slice(0, 2).map(title => (
                            <Badge key={title} variant="secondary" className="text-xs">
                              {title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={
                          candidate.email_frequency === 'never' ? 'bg-red-100 text-red-700' :
                          candidate.job_search_status === 'actively_looking' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {candidate.job_search_status || 'not_set'}
                        </Badge>
                        {lastSent[candidate.user_id] && (
                          <span className="text-xs text-gray-400">
                            Last: {format(new Date(lastSent[candidate.user_id]), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}