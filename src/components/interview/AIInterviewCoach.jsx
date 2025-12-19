import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Video, MessageSquare, Mic, Check, X, Play, Pause,
  Loader2, TrendingUp, AlertCircle, Award, Clock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function AIInterviewCoach({ candidate, job, onClose }) {
  const [session, setSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sessionType, setSessionType] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const startSession = async (type) => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Generate questions
      const prompt = `Generate 5 interview questions for a ${job?.title || 'job'} position.
      
      ${type === 'behavioral' ? 'Focus on behavioral questions (STAR method).' : ''}
      ${type === 'technical' ? 'Focus on technical/role-specific questions.' : ''}
      ${type === 'mixed' ? 'Mix of behavioral and technical questions.' : ''}
      
      Job Description: ${job?.description?.substring(0, 300) || 'General position'}
      
      Return a JSON array of questions, each with:
      - question: string
      - question_type: "behavioral" or "technical"`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  question_type: { type: "string" }
                }
              }
            }
          }
        }
      });

      const newSession = await base44.entities.InterviewSession.create({
        candidate_id: candidate.id,
        user_id: user.id,
        job_id: job?.id,
        session_type: type,
        questions: result.questions.map(q => ({
          question: q.question,
          question_type: q.question_type,
          answer: '',
          feedback: null
        }))
      });

      setSession(newSession);
      setSessionType(type);
      setStartTime(Date.now());
      toast.success('Interview session started!');
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session');
    }
    setLoading(false);
  };

  const analyzeAnswer = async () => {
    if (!answer.trim()) return;
    
    setAnalyzing(true);
    try {
      const currentQuestion = session.questions[currentQuestionIndex];
      
      const prompt = `Analyze this interview answer and provide detailed feedback:

Question: ${currentQuestion.question}
Question Type: ${currentQuestion.question_type}
Answer: ${answer}

Evaluate:
1. Clarity (0-100): Is the answer clear and well-structured?
2. Confidence (0-100): Does it convey confidence?
3. Structure (0-100): Does it follow good answer structure (STAR for behavioral)?
4. Filler Words: Count instances of "um", "uh", "like", "you know"
5. Specific suggestions for improvement (max 3 points)

Return scores and actionable feedback.`;

      const feedback = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            clarity_score: { type: "number" },
            confidence_score: { type: "number" },
            structure_score: { type: "number" },
            filler_words_count: { type: "number" },
            suggestions: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      // Update session with answer and feedback
      const updatedQuestions = [...session.questions];
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        answer,
        feedback
      };

      await base44.entities.InterviewSession.update(session.id, {
        questions: updatedQuestions
      });

      setSession({ ...session, questions: updatedQuestions });
      toast.success('Answer analyzed!');
    } catch (error) {
      console.error('Failed to analyze answer:', error);
      toast.error('Failed to analyze answer');
    }
    setAnalyzing(false);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswer('');
    }
  };

  const completeSession = async () => {
    try {
      const duration = Math.round((Date.now() - startTime) / 1000 / 60);
      const avgScore = session.questions.reduce((sum, q) => {
        if (!q.feedback) return sum;
        const avg = (q.feedback.clarity_score + q.feedback.confidence_score + q.feedback.structure_score) / 3;
        return sum + avg;
      }, 0) / session.questions.filter(q => q.feedback).length;

      await base44.entities.InterviewSession.update(session.id, {
        completion_status: 'completed',
        duration_minutes: duration,
        overall_score: Math.round(avgScore)
      });

      toast.success(`Session complete! Overall score: ${Math.round(avgScore)}%`);
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  if (!sessionType) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            AI Interview Coach
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-600 mb-6">
            Practice interview questions and get real-time feedback to improve your performance.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => startSession('behavioral')}
              disabled={loading}
              className="w-full justify-start h-auto p-4"
              variant="outline"
            >
              <div className="text-left flex-1">
                <p className="font-semibold">Behavioral Interview</p>
                <p className="text-xs text-gray-500">STAR method questions about past experiences</p>
              </div>
            </Button>

            <Button
              onClick={() => startSession('technical')}
              disabled={loading}
              className="w-full justify-start h-auto p-4"
              variant="outline"
            >
              <div className="text-left flex-1">
                <p className="font-semibold">Technical Interview</p>
                <p className="text-xs text-gray-500">Role-specific technical questions</p>
              </div>
            </Button>

            <Button
              onClick={() => startSession('mixed')}
              disabled={loading}
              className="w-full justify-start h-auto p-4 swipe-gradient text-white"
            >
              <div className="text-left flex-1">
                <p className="font-semibold">Mixed Interview (Recommended)</p>
                <p className="text-xs text-white/80">Combination of behavioral and technical</p>
              </div>
            </Button>
          </div>

          {loading && (
            <div className="mt-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Preparing your interview...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            Interview Practice
          </CardTitle>
          <Badge variant="secondary">
            Question {currentQuestionIndex + 1} of {session.questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Current Question */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
          <Badge className="mb-3" variant="secondary">
            {currentQuestion.question_type}
          </Badge>
          <p className="text-lg font-medium text-gray-900">{currentQuestion.question}</p>
        </div>

        {/* Answer Input */}
        {!currentQuestion.feedback ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Type your answer here... Aim for clear, structured responses."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={8}
              className="resize-none"
            />
            
            <div className="flex gap-2">
              <Button
                onClick={analyzeAnswer}
                disabled={!answer.trim() || analyzing}
                className="flex-1 swipe-gradient text-white"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Get Feedback
                  </>
                )}
              </Button>
              {currentQuestionIndex > 0 && (
                <Button variant="outline" onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}>
                  Previous
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Scores */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Clarity</p>
                <p className="text-2xl font-bold text-blue-600">{currentQuestion.feedback.clarity_score}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Confidence</p>
                <p className="text-2xl font-bold text-purple-600">{currentQuestion.feedback.confidence_score}</p>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Structure</p>
                <p className="text-2xl font-bold text-pink-600">{currentQuestion.feedback.structure_score}</p>
              </div>
            </div>

            {/* Feedback */}
            <div className="p-4 bg-amber-50 rounded-xl">
              <h4 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Areas to Improve
              </h4>
              <ul className="space-y-2">
                {currentQuestion.feedback.suggestions?.map((suggestion, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {currentQuestion.feedback.filler_words_count > 5 && (
              <div className="p-3 bg-orange-50 rounded-xl">
                <p className="text-sm text-orange-900">
                  <strong>Filler words detected:</strong> {currentQuestion.feedback.filler_words_count} instances. 
                  Try to pause instead of using "um", "uh", or "like".
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2">
              {currentQuestionIndex < session.questions.length - 1 ? (
                <Button onClick={nextQuestion} className="flex-1 swipe-gradient text-white">
                  Next Question
                </Button>
              ) : (
                <Button onClick={completeSession} className="flex-1 swipe-gradient text-white">
                  <Award className="w-4 h-4 mr-2" />
                  Complete Session
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}