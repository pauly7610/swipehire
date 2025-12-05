import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Calendar, Clock, Users, Zap, Send, Settings, CheckCircle,
  Loader2, Video, ChevronRight, Bell, Mail
} from 'lucide-react';
import { format, addDays, setHours, setMinutes, isBefore, isAfter, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

export default function AutoScheduler({ matches, candidates, users, jobs, company }) {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    autoSendSlots: false,
    autoScheduleEnabled: false,
    autoScheduleThreshold: 80, // Match score threshold for auto-scheduling
    defaultDuration: 30,
    bufferTime: 15,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    excludeWeekends: true,
    reminderEnabled: true,
    reminderTimes: ['24h', '1h'],
    daysAhead: 3, // Auto-schedule X days ahead
    slotsPerDay: 3 // Number of slots to offer per day
  });
  const [pendingSchedules, setPendingSchedules] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    // Find matches ready for scheduling (matched but no interview yet)
    const readyForInterview = matches.filter(m => 
      m.status === 'matched' || m.status === 'interviewing'
    );
    setPendingSchedules(readyForInterview);
  }, [matches]);

  const generateAvailableSlots = (date) => {
    if (!date) return [];
    
    const dayOfWeek = date.getDay();
    if (settings.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return [];
    }

    const now = new Date();
    const isToday = startOfDay(date).getTime() === startOfDay(now).getTime();

    return TIME_SLOTS.filter(slot => {
      const [hours, mins] = slot.split(':').map(Number);
      const slotTime = setMinutes(setHours(date, hours), mins);
      
      // Filter by working hours
      const startHour = parseInt(settings.workingHoursStart.split(':')[0]);
      const endHour = parseInt(settings.workingHoursEnd.split(':')[0]);
      
      if (hours < startHour || hours >= endHour) return false;
      
      // Filter past times for today
      if (isToday && isBefore(slotTime, now)) return false;
      
      return true;
    });
  };

  const handleSendSlots = async () => {
    if (!selectedMatch || selectedSlots.length === 0 || !selectedDate) return;
    
    setSending(true);
    try {
      const currentUser = await base44.auth.me();
      const candidate = candidates[selectedMatch.candidate_id];
      const candidateUser = candidate ? users[candidate.user_id] : null;
      const job = jobs.find(j => j.id === selectedMatch.job_id);

      // Create interview with available slots
      const availableSlots = selectedSlots.map(slot => {
        const [hours, mins] = slot.split(':').map(Number);
        const slotDate = setMinutes(setHours(selectedDate, hours), mins);
        return {
          date: format(slotDate, 'yyyy-MM-dd'),
          time: slot,
          duration: settings.defaultDuration,
          utc_datetime: slotDate.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
      });

      const interview = await base44.entities.Interview.create({
        match_id: selectedMatch.id,
        candidate_id: selectedMatch.candidate_id,
        company_id: company.id,
        job_id: selectedMatch.job_id,
        interview_type: 'live',
        status: 'pending',
        available_slots: availableSlots
      });

      // Send notification to candidate
      if (candidateUser) {
        await base44.entities.Notification.create({
          user_id: candidateUser.id,
          type: 'interview',
          title: '📅 Interview Invitation',
          message: `${company.name} wants to schedule an interview for ${job?.title}!`,
          match_id: selectedMatch.id,
          navigate_to: 'Chat'
        });

        // Send email
        const slotsList = availableSlots.map(s => 
          `• ${format(new Date(s.utc_datetime), 'EEEE, MMMM d')} at ${s.time}`
        ).join('\n');

        await base44.integrations.Core.SendEmail({
          to: candidateUser.email,
          subject: `Interview Invitation from ${company.name}`,
          body: `Hi ${candidateUser.full_name},\n\nGreat news! ${company.name} would like to schedule an interview with you for the ${job?.title} position.\n\nPlease select a time that works for you:\n${slotsList}\n\n${message ? `Message from the recruiter:\n"${message}"\n\n` : ''}Log in to SwipeHire to confirm your preferred time.\n\nBest,\nSwipeHire Team`
        });
      }

      // Update match status
      await base44.entities.Match.update(selectedMatch.id, { status: 'interviewing' });

      // Send chat message
      await base44.entities.Message.create({
        match_id: selectedMatch.id,
        sender_id: currentUser.id,
        sender_type: 'employer',
        content: `📅 Interview invitation sent! Please select a time that works for you.${message ? `\n\n"${message}"` : ''}`,
        message_type: 'interview_invite'
      });

      setShowScheduleDialog(false);
      setSelectedMatch(null);
      setSelectedSlots([]);
      setSelectedDate(null);
      setMessage('');
    } catch (error) {
      console.error('Failed to send slots:', error);
    }
    setSending(false);
  };

  const handleQuickSchedule = (match) => {
    setSelectedMatch(match);
    setSelectedDate(addDays(new Date(), 2)); // Default to 2 days from now
    setShowScheduleDialog(true);
  };

  // Auto-generate slots for a given number of days ahead
  const generateAutoSlots = (daysAhead, slotsPerDay) => {
    const autoSlots = [];
    for (let d = 1; d <= daysAhead; d++) {
      const date = addDays(new Date(), d);
      const daySlots = generateAvailableSlots(date);
      
      // Pick evenly distributed slots
      if (daySlots.length > 0) {
        const step = Math.max(1, Math.floor(daySlots.length / slotsPerDay));
        for (let i = 0; i < slotsPerDay && i * step < daySlots.length; i++) {
          const slot = daySlots[i * step];
          const [hours, mins] = slot.split(':').map(Number);
          const slotDate = setMinutes(setHours(date, hours), mins);
          autoSlots.push({
            date: format(date, 'yyyy-MM-dd'),
            time: slot,
            duration: settings.defaultDuration,
            utc_datetime: slotDate.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
        }
      }
    }
    return autoSlots;
  };

  // Auto-schedule interviews for high-match candidates
  const runAutoSchedule = async () => {
    if (!settings.autoScheduleEnabled) return;
    
    setAutoScheduling(true);
    let count = 0;
    
    try {
      const currentUser = await base44.auth.me();
      
      // Get candidates that meet the threshold and haven't been scheduled
      const eligibleMatches = pendingSchedules.filter(m => 
        m.status === 'matched' && 
        (m.match_score || 0) >= settings.autoScheduleThreshold
      );

      // Check which ones already have interviews
      const existingInterviews = await base44.entities.Interview.filter({ company_id: company.id });
      const scheduledMatchIds = new Set(existingInterviews.map(i => i.match_id));
      
      const toSchedule = eligibleMatches.filter(m => !scheduledMatchIds.has(m.id));

      for (const match of toSchedule.slice(0, 5)) { // Limit to 5 per run
        const candidate = candidates[match.candidate_id];
        const candidateUser = candidate ? users[candidate.user_id] : null;
        const job = jobs.find(j => j.id === match.job_id);

        if (!candidateUser || !job) continue;

        const autoSlots = generateAutoSlots(settings.daysAhead, settings.slotsPerDay);
        
        if (autoSlots.length === 0) continue;

        // Create interview
        await base44.entities.Interview.create({
          match_id: match.id,
          candidate_id: match.candidate_id,
          company_id: company.id,
          job_id: match.job_id,
          interview_type: 'live',
          status: 'pending',
          available_slots: autoSlots
        });

        // Send notification
        await base44.entities.Notification.create({
          user_id: candidateUser.id,
          type: 'interview',
          title: '📅 Interview Invitation',
          message: `${company.name} wants to schedule an interview for ${job.title}! Select your preferred time.`,
          match_id: match.id,
          navigate_to: 'ApplicationTracker'
        });

        // Send email
        const slotsList = autoSlots.map(s => 
          `• ${format(new Date(s.utc_datetime), 'EEEE, MMMM d')} at ${s.time}`
        ).join('\n');

        await base44.integrations.Core.SendEmail({
          to: candidateUser.email,
          subject: `Interview Invitation from ${company.name}`,
          body: `Hi ${candidateUser.full_name},\n\nGreat news! Based on your strong match (${match.match_score}%), ${company.name} would like to schedule an interview with you for the ${job.title} position.\n\nAvailable times:\n${slotsList}\n\nLog in to SwipeHire to confirm your preferred time.\n\nBest,\nSwipeHire Team`
        });

        // Update match status
        await base44.entities.Match.update(match.id, { status: 'interviewing' });

        // Send chat message
        await base44.entities.Message.create({
          match_id: match.id,
          sender_id: currentUser.id,
          sender_type: 'employer',
          content: `📅 Auto-scheduled interview! Your ${match.match_score}% match score qualified you for automatic scheduling. Please select a time that works for you.`,
          message_type: 'interview_invite'
        });

        count++;
      }

      setScheduledCount(count);
    } catch (error) {
      console.error('Auto-schedule failed:', error);
    }
    setAutoScheduling(false);
  };

  // Run auto-schedule when enabled and matches change
  useEffect(() => {
    if (settings.autoScheduleEnabled && pendingSchedules.length > 0) {
      runAutoSchedule();
    }
  }, [settings.autoScheduleEnabled, pendingSchedules.length]);

  const availableSlots = generateAvailableSlots(selectedDate);

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Smart Scheduling</CardTitle>
              <p className="text-sm text-gray-500">
                {pendingSchedules.length} candidates ready to schedule
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {settings.autoScheduleEnabled && (
              <Badge className="bg-green-100 text-green-700">
                <Zap className="w-3 h-3 mr-1" /> Auto
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Auto-schedule status */}
          {autoScheduling && (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="text-blue-700">Auto-scheduling high-match candidates...</span>
            </div>
          )}
          
          {scheduledCount > 0 && !autoScheduling && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 rounded-xl flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700">Auto-scheduled {scheduledCount} interviews!</span>
              <Button variant="ghost" size="sm" onClick={() => setScheduledCount(0)}>Dismiss</Button>
            </motion.div>
          )}

          {/* Manual scheduling button for bulk */}
          {pendingSchedules.length > 0 && !settings.autoScheduleEnabled && (
            <Button 
              onClick={runAutoSchedule}
              disabled={autoScheduling}
              className="w-full mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              {autoScheduling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Auto-Schedule Top Matches ({'>'}={settings.autoScheduleThreshold}% score)
            </Button>
          )}

          {pendingSchedules.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No candidates waiting for scheduling</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSchedules.slice(0, 5).map((match, idx) => {
                const candidate = candidates[match.candidate_id];
                const user = candidate ? users[candidate.user_id] : null;
                const job = jobs.find(j => j.id === match.job_id);

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {candidate?.photo_url ? (
                      <img src={candidate.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {user?.full_name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{user?.full_name || 'Candidate'}</p>
                      <p className="text-xs text-gray-500 truncate">{job?.title}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickSchedule(match)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    >
                      <Calendar className="w-4 h-4 mr-1" /> Schedule
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Send Interview Slots
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedMatch && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    {users[candidates[selectedMatch.candidate_id]?.user_id]?.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {jobs.find(j => j.id === selectedMatch.job_id)?.title}
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label className="mb-2 block">Select Date</Label>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                className="rounded-xl border"
              />
            </div>

            {selectedDate && (
              <div>
                <Label className="mb-2 block">
                  Available Time Slots ({availableSlots.length} available)
                </Label>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-gray-500">No slots available for this date</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {availableSlots.map(slot => (
                      <Button
                        key={slot}
                        variant={selectedSlots.includes(slot) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (selectedSlots.includes(slot)) {
                            setSelectedSlots(selectedSlots.filter(s => s !== slot));
                          } else {
                            setSelectedSlots([...selectedSlots, slot]);
                          }
                        }}
                        className={selectedSlots.includes(slot) 
                          ? 'bg-purple-500 hover:bg-purple-600' 
                          : ''}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                )}
                {selectedSlots.length > 0 && (
                  <p className="text-xs text-purple-600 mt-2">
                    {selectedSlots.length} slot(s) selected
                  </p>
                )}
              </div>
            )}

            <div>
              <Label className="mb-2 block">Personal Message (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Looking forward to meeting you..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Auto-reminders enabled</span>
              </div>
              <Badge variant="secondary">24h & 1h before</Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendSlots}
              disabled={sending || selectedSlots.length === 0}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send {selectedSlots.length} Slot{selectedSlots.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scheduling Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Auto-Schedule Section */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold">Auto-Schedule</Label>
                  <p className="text-xs text-gray-500">Automatically send interview slots to high-match candidates</p>
                </div>
                <Switch
                  checked={settings.autoScheduleEnabled}
                  onCheckedChange={(v) => setSettings({...settings, autoScheduleEnabled: v})}
                />
              </div>
              
              {settings.autoScheduleEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Min Match Score</Label>
                    <Select 
                      value={String(settings.autoScheduleThreshold)} 
                      onValueChange={(v) => setSettings({...settings, autoScheduleThreshold: Number(v)})}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="70">70%+</SelectItem>
                        <SelectItem value="80">80%+</SelectItem>
                        <SelectItem value="85">85%+</SelectItem>
                        <SelectItem value="90">90%+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Days Ahead</Label>
                    <Select 
                      value={String(settings.daysAhead)} 
                      onValueChange={(v) => setSettings({...settings, daysAhead: Number(v)})}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 days</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="5">5 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Slots per Day</Label>
                    <Select 
                      value={String(settings.slotsPerDay)} 
                      onValueChange={(v) => setSettings({...settings, slotsPerDay: Number(v)})}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 slots</SelectItem>
                        <SelectItem value="3">3 slots</SelectItem>
                        <SelectItem value="4">4 slots</SelectItem>
                        <SelectItem value="5">5 slots</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label>Default Interview Duration</Label>
              <Select 
                value={String(settings.defaultDuration)} 
                onValueChange={(v) => setSettings({...settings, defaultDuration: Number(v)})}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Working Hours Start</Label>
              <Select 
                value={settings.workingHoursStart} 
                onValueChange={(v) => setSettings({...settings, workingHoursStart: v})}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['08:00', '09:00', '10:00'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Working Hours End</Label>
              <Select 
                value={settings.workingHoursEnd} 
                onValueChange={(v) => setSettings({...settings, workingHoursEnd: v})}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['17:00', '18:00', '19:00', '20:00'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Exclude Weekends</Label>
              <Switch
                checked={settings.excludeWeekends}
                onCheckedChange={(v) => setSettings({...settings, excludeWeekends: v})}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Auto-send Reminders</Label>
              <Switch
                checked={settings.reminderEnabled}
                onCheckedChange={(v) => setSettings({...settings, reminderEnabled: v})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSettings(false)} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}