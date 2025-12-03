import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, Clock, CheckCircle, Loader2, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function SelectInterviewSlot({ open, onOpenChange, interview, job, company, onConfirmed }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    
    setConfirming(true);
    try {
      // Build the scheduled_at datetime
      const scheduledAt = new Date(`${selectedSlot.date}T${selectedSlot.time}:00`);
      
      // Update interview with selected slot
      await base44.entities.Interview.update(interview.id, {
        status: 'confirmed',
        selected_slot: selectedSlot,
        scheduled_at: scheduledAt.toISOString()
      });

      // Notify employer
      const match = await base44.entities.Match.filter({ id: interview.match_id });
      if (match[0]?.company_user_id) {
        await base44.entities.Notification.create({
          user_id: match[0].company_user_id,
          type: 'interview',
          title: '✅ Interview Confirmed!',
          message: `Candidate confirmed the interview for ${format(scheduledAt, 'MMM d')} at ${selectedSlot.time}`,
          match_id: interview.match_id,
          job_id: interview.job_id,
          navigate_to: 'EmployerMatches'
        });
      }

      // Send message
      await base44.entities.Message.create({
        match_id: interview.match_id,
        sender_id: interview.candidate_id,
        sender_type: 'candidate',
        content: `✅ I've confirmed the interview for ${format(scheduledAt, 'EEEE, MMMM d')} at ${selectedSlot.time}. Looking forward to it!`,
        message_type: 'system'
      });

      setConfirmed(true);
      setTimeout(() => {
        onConfirmed?.(interview);
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to confirm slot:', error);
    }
    setConfirming(false);
  };

  if (confirmed) {
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Interview Confirmed!</h3>
            <p className="text-gray-500">You'll receive a reminder before the interview.</p>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-pink-500" />
            Select Interview Time
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Job Info */}
          <Card className="bg-gradient-to-r from-pink-50 to-orange-50 border-0">
            <CardContent className="p-4 flex items-center gap-3">
              {company?.logo_url ? (
                <img src={company.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-pink-500" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{job?.title}</p>
                <p className="text-sm text-gray-600">{company?.name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Available Slots */}
          <div>
            <p className="text-sm text-gray-600 mb-3">Pick a time that works for you:</p>
            <div className="space-y-2">
              {interview?.available_slots?.map((slot, i) => {
                const isSelected = selectedSlot?.date === slot.date && selectedSlot?.time === slot.time;
                const slotDate = parseISO(slot.date);
                
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'border-pink-500 bg-pink-50' 
                        : 'border-gray-200 hover:border-pink-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {format(slotDate, 'EEEE, MMMM d')}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          {slot.time} • {slot.duration} min
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-pink-500" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <Button 
            onClick={handleConfirm}
            disabled={!selectedSlot || confirming}
            className="w-full"
            style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
          >
            {confirming ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Confirm This Time
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}