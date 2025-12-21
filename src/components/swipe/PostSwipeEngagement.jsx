import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Calendar, Heart, X, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

/**
 * Post-Swipe Engagement Modal
 * Shows after someone swipes on you - provides immediate action options
 */
export default function PostSwipeEngagement({ 
  open, 
  onOpenChange, 
  swiper, 
  target, 
  context,
  userType 
}) {
  const [step, setStep] = useState('options'); // 'options', 'message', 'schedule', 'respond'
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!open || !swiper || !target) return null;

  const swiperName = swiper.full_name || 'Someone';
  const contextText = context?.title || context?.headline || '';
  const isRecruiter = userType === 'employer';

  const resetAndClose = () => {
    setStep('options');
    setMessage('');
    onOpenChange(false);
  };

  const handleMessageNow = async () => {
    if (!message.trim()) return;
    setSending(true);

    try {
      // Create direct message
      await base44.entities.DirectMessage.create({
        sender_id: target.id,
        receiver_id: swiper.id,
        message: message.trim(),
        is_read: false
      });

      // Notify the swiper
      await base44.entities.Notification.create({
        user_id: swiper.id,
        type: 'new_message',
        title: '💬 New Message',
        message: `${target.full_name} sent you a message`
      });

      resetAndClose();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  const handleSwipeResponse = async (interested) => {
    try {
      if (interested) {
        // Create mutual interest - this will create a match
        await base44.entities.Notification.create({
          user_id: swiper.id,
          type: 'mutual_interest',
          title: '🎉 Mutual Interest!',
          message: `${target.full_name} is interested! Start a conversation.`
        });

        // Auto-open messaging
        setStep('message');
      } else {
        // Politely decline
        await base44.entities.Notification.create({
          user_id: swiper.id,
          type: 'system',
          title: 'Update',
          message: 'Thanks for considering. Keep swiping!'
        });
        resetAndClose();
      }
    } catch (error) {
      console.error('Failed to respond:', error);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
          onClick={resetAndClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-r from-pink-500 to-orange-500 text-white">
              <button
                onClick={resetAndClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold mb-1">Someone's Interested! 🎉</h2>
              <p className="text-white/90 text-sm">
                {swiperName} swiped on you for <span className="font-semibold">{contextText}</span>
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'options' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    What would you like to do?
                  </p>

                  <Button
                    onClick={() => setStep('message')}
                    className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5 mr-3" />
                    <div className="text-left flex-1">
                      <div className="font-bold">Message Now</div>
                      <div className="text-xs text-white/80">Start a conversation</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setStep('schedule')}
                    variant="outline"
                    className="w-full h-14 border-2 border-purple-200 hover:bg-purple-50 dark:border-purple-900/50 dark:hover:bg-purple-950/20"
                  >
                    <Calendar className="w-5 h-5 mr-3 text-purple-500" />
                    <div className="text-left flex-1">
                      <div className="font-bold text-gray-900 dark:text-white">Set Up Time to Talk</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Propose availability</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setStep('respond')}
                    variant="outline"
                    className="w-full h-14 border-2 border-pink-200 hover:bg-pink-50 dark:border-pink-900/50 dark:hover:bg-pink-950/20"
                  >
                    <Heart className="w-5 h-5 mr-3 text-pink-500" />
                    <div className="text-left flex-1">
                      <div className="font-bold text-gray-900 dark:text-white">Swipe to Respond</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Show your interest</div>
                    </div>
                  </Button>

                  <Button
                    onClick={resetAndClose}
                    variant="ghost"
                    className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Maybe Later
                  </Button>
                </div>
              )}

              {step === 'message' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Your Message
                    </label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Hi ${swiperName}, thanks for your interest! I'd love to discuss ${contextText}...`}
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setStep('options')}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleMessageNow}
                      disabled={!message.trim() || sending}
                      className="flex-1 swipe-gradient text-white"
                    >
                      {sending ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {step === 'schedule' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Schedule a quick chat with {swiperName}
                  </p>

                  <div className="space-y-2">
                    {['Tomorrow 2pm', 'This Week', 'Next Week'].map((slot) => (
                      <Button
                        key={slot}
                        variant="outline"
                        className="w-full h-12 justify-start border-2 hover:border-purple-300 dark:hover:border-purple-700"
                        onClick={async () => {
                          // Send availability proposal
                          await base44.entities.DirectMessage.create({
                            sender_id: target.id,
                            receiver_id: swiper.id,
                            message: `Hi ${swiperName}! I'm available ${slot}. Does that work for you?`,
                            is_read: false
                          });
                          resetAndClose();
                        }}
                      >
                        <Clock className="w-4 h-4 mr-3 text-purple-500" />
                        {slot}
                      </Button>
                    ))}
                  </div>

                  <Button
                    onClick={() => setStep('options')}
                    variant="ghost"
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              )}

              {step === 'respond' && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Are you interested in connecting with {swiperName}?
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleSwipeResponse(false)}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2 border-2 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <X className="w-6 h-6 text-gray-400" />
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Not Now</span>
                    </Button>

                    <Button
                      onClick={() => handleSwipeResponse(true)}
                      className="h-20 flex flex-col items-center justify-center gap-2 swipe-gradient text-white"
                    >
                      <Heart className="w-6 h-6 fill-white" />
                      <span className="text-sm font-bold">Interested!</span>
                    </Button>
                  </div>

                  <Button
                    onClick={() => setStep('options')}
                    variant="ghost"
                    className="w-full text-gray-500"
                  >
                    Back
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}