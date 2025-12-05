import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, FileSearch, MessageSquare, HelpCircle, Loader2, 
  CheckCircle2, XCircle, AlertTriangle, Copy, RefreshCw,
  User, Briefcase, Star, ThumbsUp, ThumbsDown, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIRecruiterAssistant({ jobs, candidates, users, company }) {
  const [activeTab, setActiveTab] = useState('screen');
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Results
  const [screeningResults, setScreeningResults] = useState(null);
  const [interviewQuestions, setInterviewQuestions] = useState(null);
  const [outreachMessage, setOutreachMessage] = useState(null);
  const [messageType, setMessageType] = useState('initial');

  const candidateList = Object.values(candidates || {});
  const jobList = jobs || [];

  // Resume Screening
  const screenResume = async () => {
    if (!selectedJob || !selectedCandidate) return;
    setLoading(true);
    setScreeningResults(null);

    const job = jobList.find(j => j.id === selectedJob);
    const candidate = candidateList.find(c => c.id === selectedCandidate);
    const user = users?.[candidate?.user_id];

    const prompt = `You are an expert recruiter. Analyze this candidate's fit for the job position.

JOB DETAILS:
- Title: ${job?.title}
- Description: ${job?.description}
- Required Skills: ${job?.skills_required?.join(', ') || 'Not specified'}
- Experience Level: ${job?.experience_level_required || 'Not specified'}
- Requirements: ${job?.requirements?.join(', ') || 'Not specified'}

CANDIDATE PROFILE:
- Name: ${user?.full_name || 'Unknown'}
- Headline: ${candidate?.headline || 'Not specified'}
- Skills: ${candidate?.skills?.join(', ') || 'Not specified'}
- Experience Level: ${candidate?.experience_level || 'Not specified'}
- Years of Experience: ${candidate?.experience_years || 'Not specified'}
- Bio: ${candidate?.bio || 'Not provided'}
- Work Experience: ${candidate?.experience?.map(e => `${e.title} at ${e.company}`).join('; ') || 'Not provided'}

Provide a detailed screening analysis.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number", description: "Match score 0-100" },
            recommendation: { type: "string", enum: ["Strong Yes", "Yes", "Maybe", "No"] },
            strengths: { type: "array", items: { type: "string" } },
            concerns: { type: "array", items: { type: "string" } },
            skill_match: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  skill: { type: "string" },
                  matched: { type: "boolean" }
                }
              }
            },
            experience_fit: { type: "string" },
            culture_fit_notes: { type: "string" },
            red_flags: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        }
      });
      setScreeningResults(result);
    } catch (error) {
      console.error('Screening failed:', error);
    }
    setLoading(false);
  };

  // Generate Interview Questions
  const generateQuestions = async () => {
    if (!selectedJob || !selectedCandidate) return;
    setLoading(true);
    setInterviewQuestions(null);

    const job = jobList.find(j => j.id === selectedJob);
    const candidate = candidateList.find(c => c.id === selectedCandidate);
    const user = users?.[candidate?.user_id];

    const prompt = `Generate tailored interview questions for this candidate applying to this position.

JOB: ${job?.title}
Description: ${job?.description}
Required Skills: ${job?.skills_required?.join(', ') || 'General'}

CANDIDATE:
- Name: ${user?.full_name}
- Background: ${candidate?.headline}
- Skills: ${candidate?.skills?.join(', ')}
- Experience: ${candidate?.experience?.map(e => `${e.title} at ${e.company}`).join('; ') || 'Entry level'}

Generate questions that:
1. Assess their technical skills for this specific role
2. Explore their relevant experience
3. Evaluate cultural fit
4. Uncover potential concerns
5. Allow them to showcase strengths`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            technical_questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  purpose: { type: "string" },
                  good_answer_indicators: { type: "string" }
                }
              }
            },
            behavioral_questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  purpose: { type: "string" },
                  good_answer_indicators: { type: "string" }
                }
              }
            },
            role_specific_questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  purpose: { type: "string" }
                }
              }
            },
            red_flag_probing_questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  concern_addressed: { type: "string" }
                }
              }
            }
          }
        }
      });
      setInterviewQuestions(result);
    } catch (error) {
      console.error('Question generation failed:', error);
    }
    setLoading(false);
  };

  // Draft Outreach Message
  const draftOutreach = async () => {
    if (!selectedJob || !selectedCandidate) return;
    setLoading(true);
    setOutreachMessage(null);

    const job = jobList.find(j => j.id === selectedJob);
    const candidate = candidateList.find(c => c.id === selectedCandidate);
    const user = users?.[candidate?.user_id];

    const messageTypeDescriptions = {
      initial: 'First outreach to introduce the opportunity',
      followup: 'Follow-up message after no response',
      interview_invite: 'Invitation to schedule an interview',
      rejection: 'Polite rejection with encouragement'
    };

    const prompt = `Draft a personalized ${messageTypeDescriptions[messageType]} message from a recruiter to a candidate.

COMPANY: ${company?.name}
Company Description: ${company?.description || 'A great place to work'}

JOB: ${job?.title}
Location: ${job?.location}
Key Benefits: ${job?.benefits?.slice(0, 3).join(', ') || 'Competitive package'}

CANDIDATE:
- Name: ${user?.full_name}
- Current Role: ${candidate?.headline || 'Professional'}
- Key Skills: ${candidate?.skills?.slice(0, 5).join(', ')}
- Background: ${candidate?.experience?.[0] ? `${candidate.experience[0].title} at ${candidate.experience[0].company}` : 'Experienced professional'}

Write a warm, personalized message that:
1. Addresses them by name
2. References something specific about their background
3. Is concise but compelling
4. Has a clear call to action
5. Represents the company culture well

Message type: ${messageType}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject_line: { type: "string" },
            message: { type: "string" },
            personalization_points: { type: "array", items: { type: "string" } },
            call_to_action: { type: "string" },
            alternative_version: { type: "string" }
          }
        }
      });
      setOutreachMessage(result);
    } catch (error) {
      console.error('Outreach draft failed:', error);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl swipe-gradient flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          AI Recruiter Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-none border-b bg-gray-50 p-1">
            <TabsTrigger value="screen" className="flex-1 data-[state=active]:bg-white">
              <FileSearch className="w-4 h-4 mr-2" /> Screen Resume
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex-1 data-[state=active]:bg-white">
              <HelpCircle className="w-4 h-4 mr-2" /> Interview Questions
            </TabsTrigger>
            <TabsTrigger value="outreach" className="flex-1 data-[state=active]:bg-white">
              <MessageSquare className="w-4 h-4 mr-2" /> Draft Outreach
            </TabsTrigger>
          </TabsList>

          {/* Common Selection */}
          <div className="p-4 border-b bg-gray-50/50">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Select Job</label>
                <Select value={selectedJob || ''} onValueChange={setSelectedJob}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a job position" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobList.map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Select Candidate</label>
                <Select value={selectedCandidate || ''} onValueChange={setSelectedCandidate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateList.map(candidate => {
                      const user = users?.[candidate.user_id];
                      return (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {user?.full_name || 'Unknown'} - {candidate.headline || 'Candidate'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Resume Screening Tab */}
          <TabsContent value="screen" className="p-4 m-0">
            <Button 
              onClick={screenResume} 
              disabled={!selectedJob || !selectedCandidate || loading}
              className="w-full swipe-gradient text-white mb-4"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSearch className="w-4 h-4 mr-2" />}
              Analyze Candidate Fit
            </Button>

            <AnimatePresence>
              {screeningResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Score Card */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${
                        screeningResults.overall_score >= 80 ? 'text-green-600' :
                        screeningResults.overall_score >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {screeningResults.overall_score}%
                      </div>
                      <p className="text-sm text-gray-500">Match Score</p>
                    </div>
                    <div className="flex-1">
                      <Badge className={
                        screeningResults.recommendation === 'Strong Yes' ? 'bg-green-100 text-green-700' :
                        screeningResults.recommendation === 'Yes' ? 'bg-blue-100 text-blue-700' :
                        screeningResults.recommendation === 'Maybe' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {screeningResults.recommendation}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">{screeningResults.summary}</p>
                    </div>
                  </div>

                  {/* Skills Match */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Skills Match</h4>
                    <div className="flex flex-wrap gap-2">
                      {screeningResults.skill_match?.map((skill, i) => (
                        <Badge 
                          key={i} 
                          className={skill.matched ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
                        >
                          {skill.matched ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {skill.skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Concerns */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" /> Strengths
                      </h4>
                      <ul className="space-y-1 text-sm text-green-700">
                        {screeningResults.strengths?.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Concerns
                      </h4>
                      <ul className="space-y-1 text-sm text-amber-700">
                        {screeningResults.concerns?.map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Red Flags */}
                  {screeningResults.red_flags?.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Red Flags
                      </h4>
                      <ul className="space-y-1 text-sm text-red-700">
                        {screeningResults.red_flags.map((f, i) => (
                          <li key={i}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Interview Questions Tab */}
          <TabsContent value="questions" className="p-4 m-0">
            <Button 
              onClick={generateQuestions} 
              disabled={!selectedJob || !selectedCandidate || loading}
              className="w-full swipe-gradient text-white mb-4"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <HelpCircle className="w-4 h-4 mr-2" />}
              Generate Interview Questions
            </Button>

            <AnimatePresence>
              {interviewQuestions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-6">
                      {/* Technical Questions */}
                      <QuestionSection 
                        title="Technical Questions" 
                        icon={<Briefcase className="w-4 h-4" />}
                        color="blue"
                        questions={interviewQuestions.technical_questions}
                        onCopy={copyToClipboard}
                      />

                      {/* Behavioral Questions */}
                      <QuestionSection 
                        title="Behavioral Questions" 
                        icon={<User className="w-4 h-4" />}
                        color="purple"
                        questions={interviewQuestions.behavioral_questions}
                        onCopy={copyToClipboard}
                      />

                      {/* Role Specific */}
                      <QuestionSection 
                        title="Role-Specific Questions" 
                        icon={<Star className="w-4 h-4" />}
                        color="amber"
                        questions={interviewQuestions.role_specific_questions}
                        onCopy={copyToClipboard}
                      />

                      {/* Probing Questions */}
                      {interviewQuestions.red_flag_probing_questions?.length > 0 && (
                        <QuestionSection 
                          title="Probing Questions" 
                          icon={<AlertTriangle className="w-4 h-4" />}
                          color="red"
                          questions={interviewQuestions.red_flag_probing_questions}
                          onCopy={copyToClipboard}
                        />
                      )}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach" className="p-4 m-0">
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Message Type</label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial">Initial Outreach</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="interview_invite">Interview Invitation</SelectItem>
                  <SelectItem value="rejection">Polite Rejection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={draftOutreach} 
              disabled={!selectedJob || !selectedCandidate || loading}
              className="w-full swipe-gradient text-white mb-4"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Draft Message
            </Button>

            <AnimatePresence>
              {outreachMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Subject Line */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500">Subject Line</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(outreachMessage.subject_line)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-medium text-gray-900">{outreachMessage.subject_line}</p>
                  </div>

                  {/* Main Message */}
                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Message</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(outreachMessage.message)}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <Textarea 
                      value={outreachMessage.message} 
                      readOnly 
                      className="min-h-[150px] resize-none"
                    />
                  </div>

                  {/* Personalization Points */}
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <h4 className="text-sm font-medium text-pink-800 mb-2">Personalization Points Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {outreachMessage.personalization_points?.map((point, i) => (
                        <Badge key={i} className="bg-pink-100 text-pink-700">{point}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Alternative Version */}
                  {outreachMessage.alternative_version && (
                    <div className="p-4 border border-dashed rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Alternative Version</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(outreachMessage.alternative_version)}
                        >
                          <Copy className="w-4 h-4 mr-1" /> Copy
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">{outreachMessage.alternative_version}</p>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    onClick={draftOutreach}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function QuestionSection({ title, icon, color, questions, onCopy }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div>
      <h4 className={`font-medium mb-3 flex items-center gap-2 ${colorClasses[color].split(' ')[1]}`}>
        {icon} {title}
      </h4>
      <div className="space-y-3">
        {questions?.map((q, i) => (
          <div key={i} className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-gray-900">{q.question}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-shrink-0"
                onClick={() => onCopy(q.question)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            {q.purpose && (
              <p className="text-xs text-gray-500 mt-1">Purpose: {q.purpose}</p>
            )}
            {q.good_answer_indicators && (
              <p className="text-xs text-green-600 mt-1">✓ Look for: {q.good_answer_indicators}</p>
            )}
            {q.concern_addressed && (
              <p className="text-xs text-amber-600 mt-1">Addresses: {q.concern_addressed}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}