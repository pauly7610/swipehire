import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, Clock, Plus, X, Send, Loader2, CheckCircle, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

// Get user's timezone
const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export default function SendInterviewSlots({ open, onOpenChange, match, candidate, job, company, onSent }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [slots, setSlots] = useState([]);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  const userTimezone = getUserTimezone();

  const addSlot = () => {
    if (!selectedDate || !selectedTime) return;
    
    // Create a proper UTC datetime
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const localDateTime = new Date(`${dateStr}T${selectedTime}:00`);
    const utcDateTime = localDateTime.toISOString();
    
    const newSlot = {
      date: dateStr,
      time: selectedTime,
      duration: parseInt(duration),
      utc_datetime: utcDateTime, // Store UTC for timezone conversion
      timezone: userTimezone,
      displayDate: format(selectedDate, 'EEE, MMM d'),
      displayTime: selectedTime
    };
    
    // Check for duplicates
    const exists = slots.some(s => s.date === newSlot.date && s.time === newSlot.time);
    if (!exists) {
      setSlots([...slots, newSlot]);
    }
    
    setSelectedTime('');
  };

  const removeSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (slots.length === 0) return;
    
    setSending(true);
    try {
      // Create interview with available slots
      const interview = await base44.entities.Interview.create({
        match_id: match.id,
        candidate_id: candidate.id,
        company_id: company?.id || match.company_id,
        job_id: job.id,
        interview_type: 'live',
        status: 'pending',
        available_slots: slots.map(s => ({ date: s.date, time: s.time, duration: s.duration })),
        notes
      });

      // Send notification to candidate
      await base44.entities.Notification.create({
        user_id: candidate.user_id,
        type: 'interview',
        title: '📅 Interview Time Slots Available!',
        message: `${company?.name || 'A company'} has sent you ${slots.length} time slot options for your ${job.title} interview. Pick one!`,
        match_id: match.id,
        job_id: job.id,
        navigate_to: 'ApplicationTracker'
      });

      // Send message in chat
      await base44.entities.Message.create({
        match_id: match.id,
        sender_id: match.company_user_id,
        sender_type: 'employer',
        content: `📅 I've sent you ${slots.length} available time slots for our interview. Please select one that works best for you!`,
        message_type: 'interview_invite'
      });

      setSent(true);
      setTimeout(() => {
        onSent?.(interview);
        onOpenChange(false);
        setSent(false);
        setSlots([]);
        setNotes('');
      }, 2000);
    } catch (error) {
      console.error('Failed to send slots:', error);
    }
    setSending(false);
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Slots Sent!</h3>
            <p className="text-gray-500">The candidate will pick their preferred time.</p>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-pink-500" />
            Send Interview Time Slots
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Calendar & Time Selection */}
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                className="rounded-xl border"
              />
            </div>

            <div>
              <Label className="mb-2 block">Select Time</Label>
              <div className="grid grid-cols-3 gap-2 max-h-[150px] overflow-y-auto">
                {TIME_SLOTS.map(slot => (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTime(slot)}
                    className={selectedTime === slot ? 'bg-pink-500 hover:bg-pink-600' : ''}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={addSlot} 
                disabled={!selectedDate || !selectedTime}
                className="bg-pink-500 hover:bg-pink-600"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Slot
              </Button>
            </div>
            
            {/* Timezone indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <Globe className="w-3 h-3" />
              <span>Times shown in your timezone: {userTimezone}</span>
            </div>
          </div>

          {/* Selected Slots & Notes */}
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Available Slots ({slots.length})</Label>
              {slots.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Add at least one time slot</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {slots.map((slot, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between bg-pink-50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-pink-500" />
                        <span className="font-medium text-gray-900">{slot.displayDate}</span>
                        <Badge variant="secondary">{slot.displayTime}</Badge>
                        <span className="text-xs text-gray-500">{slot.duration} min</span>
                      </div>
                      <button onClick={() => removeSlot(i)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Message to Candidate (optional)</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any preparation tips or things to discuss..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSend}
              disabled={slots.length === 0 || sending}
              className="w-full"
              style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send {slots.length} Slot{slots.length !== 1 ? 's' : ''} to Candidate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}