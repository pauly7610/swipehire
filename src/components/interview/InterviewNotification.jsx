import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, Bell, X, Phone } from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, isBefore, isAfter, addMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function InterviewNotification() {
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [jobs, setJobs] = useState({});
  const [companies, setCompanies] = useState({});
  const [dismissed, setDismissed] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadInterviews();
    const interval = setInterval(loadInterviews, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const loadInterviews = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [candidates] = await base44.entities.Candidate.filter({ user_id: user.id });
      if (!candidates) return;

      const now = new Date();
      const in48Hours = addMinutes(now, 48 * 60);

      // Get interviews in next 48 hours
      const allInterviews = await base44.entities.Interview.filter({
        candidate_id: candidates.id,
        status: { $in: ['scheduled', 'confirmed'] }
      });

      const upcoming = allInterviews.filter(interview => {
        const scheduledTime = new Date(interview.scheduled_at);
        return isAfter(scheduledTime, now) && isBefore(scheduledTime, in48Hours);
      });

      setUpcomingInterviews(upcoming);

      // Load job and company details
      const jobIds = [...new Set(upcoming.map(i => i.job_id))];
      const companyIds = [...new Set(upcoming.map(i => i.company_id))];

      const [allJobs, allCompanies] = await Promise.all([
        base44.entities.Job.list(),
        base44.entities.Company.list()
      ]);

      const jobMap = {};
      allJobs.forEach(j => { jobMap[j.id] = j; });
      setJobs(jobMap);

      const companyMap = {};
      allCompanies.forEach(c => { companyMap[c.id] = c; });
      setCompanies(companyMap);

      // Send notifications for interviews within specific time windows
      for (const interview of upcoming) {
        const scheduledTime = new Date(interview.scheduled_at);
        const minutesUntil = differenceInMinutes(scheduledTime, now);
        const job = jobMap[interview.job_id];
        const company = companyMap[interview.company_id];

        // Send notification at 48h, 24h, 1h, and 15min marks
        if ((minutesUntil <= 48 * 60 && !interview.reminder_48h) ||
            (minutesUntil <= 24 * 60 && !interview.reminder_24h) ||
            (minutesUntil <= 60 && !interview.reminder_1h) ||
            (minutesUntil <= 15 && !interview.reminder_15m)) {
          
          let timeText = '';
          let reminderField = '';
          
          if (minutesUntil <= 15 && !interview.reminder_15m) {
            timeText = 'in 15 minutes!';
            reminderField = 'reminder_15m';
          } else if (minutesUntil <= 60 && !interview.reminder_1h) {
            timeText = 'in 1 hour!';
            reminderField = 'reminder_1h';
          } else if (minutesUntil <= 24 * 60 && !interview.reminder_24h) {
            timeText = 'tomorrow!';
            reminderField = 'reminder_24h';
          } else if (minutesUntil <= 48 * 60 && !interview.reminder_48h) {
            timeText = 'in 2 days!';
            reminderField = 'reminder_48h';
          }

          if (reminderField) {
            await base44.entities.Notification.create({
              user_id: user.id,
              type: 'interview',
              title: `📹 Interview Reminder: ${job?.title || 'Interview'}`,
              message: `Your interview with ${company?.name || 'the company'} is ${timeText}`,
              navigate_to: 'CommunicationHub'
            });

            // Update reminder flag
            await base44.entities.Interview.update(interview.id, { [reminderField]: true });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load interviews:', error);
    }
  };

  const getTimeUntil = (scheduledAt) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const minutesUntil = differenceInMinutes(scheduled, now);

    if (minutesUntil < 60) {
      return { text: `in ${minutesUntil} minutes`, urgent: true, canJoin: minutesUntil <= 15 };
    }

    const hoursUntil = differenceInHours(scheduled, now);
    if (hoursUntil < 24) {
      return { text: `in ${hoursUntil} hours`, urgent: hoursUntil <= 1, canJoin: false };
    }

    return { text: `on ${format(scheduled, 'MMM d')}`, urgent: false, canJoin: false };
  };

  const handleJoinInterview = (interview) => {
    navigate(createPageUrl('Chat') + `?matchId=${interview.match_id}`);
  };

  const handleDismiss = (interviewId) => {
    setDismissed(new Set([...dismissed, interviewId]));
  };

  const activeInterviews = upcomingInterviews.filter(i => !dismissed.has(i.id));

  if (activeInterviews.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50 space-y-3 max-w-sm">
      <AnimatePresence>
        {activeInterviews.map((interview) => {
          const timeInfo = getTimeUntil(interview.scheduled_at);
          const job = jobs[interview.job_id];
          const company = companies[interview.company_id];

          return (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="relative"
            >
              <Card className={`border-0 shadow-2xl overflow-hidden ${
                timeInfo.urgent ? 'ring-2 ring-pink-500 animate-pulse' : ''
              }`}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-orange-500" />
                <CardContent className="p-4">
                  <button
                    onClick={() => handleDismiss(interview.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>

                  <div className="flex items-start gap-3 mb-3">
                    {company?.logo_url ? (
                      <img src={company.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                        <Video className="w-6 h-6 text-pink-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${
                          timeInfo.urgent 
                            ? 'bg-red-500 animate-pulse' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          <Bell className="w-3 h-3 mr-1" />
                          {timeInfo.text}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {job?.title || 'Interview'}
                      </h4>
                      <p className="text-xs text-gray-500">{company?.name || 'Company'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(interview.scheduled_at), 'EEE, MMM d')}
                    <Clock className="w-3 h-3 ml-2" />
                    {format(new Date(interview.scheduled_at), 'h:mm a')}
                  </div>

                  {timeInfo.canJoin ? (
                    <Button
                      onClick={() => handleJoinInterview(interview)}
                      className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Join Interview Now
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate(createPageUrl('CommunicationHub'))}
                      variant="outline"
                      className="w-full"
                    >
                      View Details
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}