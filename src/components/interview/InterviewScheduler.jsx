import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarDays, Clock, Video, FileText, Send, 
  Loader2, CheckCircle, Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

export default function InterviewScheduler({ match, candidate, job, company, onScheduled, onClose }) {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [interviewType, setInterviewType] = useState('live');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSchedule = async () => {
    if (!date || !time) return;

    setSending(true);
    try {
      const scheduledAt = new Date(date);
      const [hours, mins] = time.split(':');
      scheduledAt.setHours(parseInt(hours), parseInt(mins), 0);

      // Create interview
      const interview = await base44.entities.Interview.create({
        match_id: match.id,
        candidate_id: candidate.id,
        company_id: company.id,
        job_id: job.id,
        interview_type: interviewType,
        scheduled_at: scheduledAt.toISOString(),
        status: 'scheduled',
        notes
      });

      // Update match status
      await base44.entities.Match.update(match.id, { status: 'interviewing' });

      // Send email notification
      const candidateUser = await base44.entities.User.filter({ id: candidate.user_id });
      if (candidateUser[0]?.email) {
        await base44.integrations.Core.SendEmail({
          to: candidateUser[0].email,
          subject: `Interview Scheduled: ${job.title} at ${company.name}`,
          body: `
Hi ${candidateUser[0].full_name || 'there'},

Great news! You've been selected for an interview for the ${job.title} position at ${company.name}.

📅 Date: ${format(scheduledAt, 'EEEE, MMMM do, yyyy')}
🕐 Time: ${time}
⏱️ Duration: ${duration} minutes
📹 Type: ${interviewType === 'live' ? 'Live Video Interview' : 'Recorded Interview'}

${notes ? `Additional Notes:\n${notes}` : ''}

Please make sure you're in a quiet environment with good lighting and a stable internet connection.

Best of luck!
${company.name} Hiring Team

---
Add to your calendar:
Google Calendar: https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Interview: ${job.title} at ${company.name}`)}&dates=${format(scheduledAt, "yyyyMMdd'T'HHmmss")}/${format(new Date(scheduledAt.getTime() + parseInt(duration) * 60000), "yyyyMMdd'T'HHmmss")}&details=${encodeURIComponent(`Video interview for ${job.title} position`)}
          `
        });
      }

      // Create notification
      await base44.entities.Notification.create({
        user_id: candidate.user_id,
        type: 'interview',
        title: 'Interview Scheduled! 🎉',
        message: `Your interview for ${job.title} at ${company.name} is scheduled for ${format(scheduledAt, 'MMM d')} at ${time}`,
        match_id: match.id,
        job_id: job.id
      });

      setSent(true);
      setTimeout(() => {
        onScheduled?.(interview);
      }, 2000);
    } catch (error) {
      console.error('Failed to schedule interview:', error);
    }
    setSending(false);
  };

  if (sent) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Interview Scheduled!</h3>
        <p className="text-gray-500">Calendar invite has been sent to the candidate.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-pink-500" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Schedule Interview</h3>
          <p className="text-sm text-gray-500">for {job?.title}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <Label className="mb-2 block">Select Date</Label>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
            className="rounded-xl border"
          />
        </div>

        {/* Time & Details */}
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Select Time</Label>
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              {TIME_SLOTS.map(slot => (
                <Button
                  key={slot}
                  variant={time === slot ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTime(slot)}
                  className={time === slot ? 'bg-pink-500 hover:bg-pink-600' : ''}
                >
                  {slot}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Interview Type</Label>
            <div className="flex gap-2">
              <Button
                variant={interviewType === 'live' ? 'default' : 'outline'}
                onClick={() => setInterviewType('live')}
                className={interviewType === 'live' ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                <Video className="w-4 h-4 mr-2" /> Live Video
              </Button>
              <Button
                variant={interviewType === 'recorded' ? 'default' : 'outline'}
                onClick={() => setInterviewType('recorded')}
                className={interviewType === 'recorded' ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                <FileText className="w-4 h-4 mr-2" /> Recorded
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Notes for Candidate (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any preparation tips or things to bring..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {date && time && (
        <Card className="bg-gradient-to-r from-pink-50 to-orange-50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-pink-500" />
              <div>
                <p className="font-medium text-gray-900">
                  {format(date, 'EEEE, MMMM do')} at {time}
                </p>
                <p className="text-sm text-gray-500">
                  {duration} min {interviewType} interview • Calendar invite will be sent
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSchedule}
          disabled={!date || !time || sending}
          className="flex-1"
          style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Send Invite
        </Button>
      </div>
    </div>
  );
}