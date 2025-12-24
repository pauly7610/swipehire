import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, Video, FileVideo, Clock, 
  Plus, X, Send, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function ScheduleInterview({ onSchedule, onClose }) {
  const [interviewType, setInterviewType] = useState('live');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [questions, setQuestions] = useState(['']);
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  const addQuestion = () => {
    if (questions.length < 5) {
      setQuestions([...questions, '']);
    }
  };

  const updateQuestion = (index, value) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    const interviewData = {
      interview_type: interviewType,
      scheduled_at: selectedDate && selectedTime ? 
        new Date(`${format(selectedDate, 'yyyy-MM-dd')} ${selectedTime}`).toISOString() : null,
      questions: interviewType === 'recorded' ? questions.filter(q => q.trim()) : [],
      status: interviewType === 'live' ? 'scheduled' : 'pending'
    };

    await onSchedule(interviewData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule Interview</h2>
          <p className="text-gray-500 dark:text-gray-400">Choose the interview format</p>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Interview Type Selection */}
          <RadioGroup value={interviewType} onValueChange={setInterviewType}>
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                interviewType === 'live' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="live" className="sr-only" />
                <div className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                    interviewType === 'live' ? 'swipe-gradient' : 'bg-gray-100'
                  }`}>
                    <Video className={`w-6 h-6 ${interviewType === 'live' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">Live Interview</h3>
                  <p className="text-xs text-gray-500 mt-1">Real-time video call</p>
                </div>
              </label>

              <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                interviewType === 'recorded' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="recorded" className="sr-only" />
                <div className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                    interviewType === 'recorded' ? 'swipe-gradient' : 'bg-gray-100'
                  }`}>
                    <FileVideo className={`w-6 h-6 ${interviewType === 'recorded' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">Recorded</h3>
                  <p className="text-xs text-gray-500 mt-1">Async video response</p>
                </div>
              </label>
            </div>
          </RadioGroup>

          {/* Live Interview: Date & Time */}
          {interviewType === 'live' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start mt-2 h-12">
                      <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                      {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="dark:text-gray-300">Select Time</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2 max-h-60 overflow-y-auto p-1">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      type="button"
                      className={`py-2.5 px-3 rounded-lg text-sm transition-all flex-shrink-0 ${
                        selectedTime === time 
                          ? 'swipe-gradient text-white shadow-md' 
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Recorded Interview: Questions */}
          {interviewType === 'recorded' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <Label>Interview Questions</Label>
                <span className="text-sm text-gray-400">{questions.length}/5</span>
              </div>

              <div className="space-y-3">
                {questions.map((q, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-shrink-0 w-8 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-pink-500">{index + 1}</span>
                    </div>
                    <Input
                      value={q}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder="Enter your question..."
                      className="flex-1"
                    />
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {questions.length < 5 && (
                <Button
                  variant="outline"
                  onClick={addQuestion}
                  className="w-full border-dashed"
                >
                  <Plus className="w-5 h-5 mr-2" /> Add Question
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 dark:border-slate-600 dark:text-gray-300">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (interviewType === 'live' && (!selectedDate || !selectedTime))}
            className="flex-1 h-12 swipe-gradient text-white"
          >
            {loading ? 'Sending...' : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Invite
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}