import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Lightbulb, Target, TrendingUp, BookOpen, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function AICareerCoach({ candidate, user }) {
  const [question, setQuestion] = useState('');
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ask');

  const quickTopics = [
    { id: 'profile', label: 'Optimize My Profile', icon: Target },
    { id: 'interview', label: 'Interview Prep', icon: Lightbulb },
    { id: 'skills', label: 'Skill Development', icon: TrendingUp },
    { id: 'market', label: 'Job Market Trends', icon: BookOpen },
  ];

  const getAdvice = async (topic) => {
    setLoading(true);
    setAdvice(null);

    let prompt = '';
    const candidateInfo = {
      headline: candidate?.headline,
      skills: candidate?.skills || [],
      experience: candidate?.experience || [],
      experienceLevel: candidate?.experience_level,
      location: candidate?.location,
    };

    switch(topic) {
      case 'profile':
        prompt = `As a career coach, analyze this candidate's profile and provide 5 specific, actionable recommendations to improve their job search success:

Profile:
- Headline: ${candidateInfo.headline || 'Not set'}
- Skills: ${candidateInfo.skills.join(', ') || 'None listed'}
- Experience Level: ${candidateInfo.experienceLevel || 'Not specified'}
- Location: ${candidateInfo.location || 'Not specified'}

Provide concrete suggestions for: profile headline, skills to add, missing information, and presentation improvements.`;
        break;

      case 'interview':
        prompt = `As a career coach, provide interview preparation advice for a ${candidateInfo.experienceLevel || 'professional'} with skills in ${candidateInfo.skills.slice(0, 5).join(', ')}.

Include:
1. Top 5 common interview questions they should prepare for
2. How to showcase their key skills
3. STAR method examples relevant to their experience
4. Red flags to avoid`;
        break;

      case 'skills':
        prompt = `As a career coach, analyze the current job market and recommend skill development for:

Current Skills: ${candidateInfo.skills.join(', ') || 'None listed'}
Experience Level: ${candidateInfo.experienceLevel || 'Not specified'}

Provide:
1. Top 3 in-demand skills to learn based on their profile
2. Free/affordable learning resources
3. Timeline for skill development
4. How these skills will improve job prospects`;
        break;

      case 'market':
        prompt = `As a career coach, provide job market insights for a ${candidateInfo.experienceLevel || 'professional'} in ${candidateInfo.location || 'their area'} with skills in ${candidateInfo.skills.slice(0, 5).join(', ')}.

Include:
1. Current market demand for their skills
2. Emerging opportunities in their field
3. Salary trends and expectations
4. Industries that are actively hiring`;
        break;

      case 'custom':
        prompt = `As a career coach, answer this question for a ${candidateInfo.experienceLevel || 'professional'} with skills in ${candidateInfo.skills.slice(0, 5).join(', ')}:

${question}

Provide practical, actionable advice.`;
        break;
    }

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: topic === 'market' || topic === 'skills',
      });

      setAdvice({
        topic,
        content: response,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to get advice:', error);
      setAdvice({
        topic,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      });
    }

    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Career Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Quick Topics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickTopics.map((topic) => (
            <Button
              key={topic.id}
              variant="outline"
              onClick={() => getAdvice(topic.id)}
              disabled={loading}
              className="h-auto py-3 justify-start hover:border-purple-500 hover:bg-purple-50"
            >
              <topic.icon className="w-4 h-4 mr-2 text-purple-500" />
              <span className="text-sm">{topic.label}</span>
            </Button>
          ))}
        </div>

        {/* Custom Question */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Ask Your Own Question</label>
          <Textarea
            placeholder="e.g., How can I transition from marketing to product management?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button
            onClick={() => getAdvice('custom')}
            disabled={loading || !question.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting Advice...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Personalized Advice
              </>
            )}
          </Button>
        </div>

        {/* Advice Display */}
        <AnimatePresence>
          {advice && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-purple-500 text-white">
                  {quickTopics.find(t => t.id === advice.topic)?.label || 'Custom Question'}
                </Badge>
                <span className="text-xs text-gray-500">
                  {advice.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <ReactMarkdown 
                className="prose prose-sm max-w-none text-gray-700"
                components={{
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 underline font-medium"
                    >
                      {children}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2 pb-2 border-b border-purple-200">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold text-gray-900 mt-3 mb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-gray-800 mt-2 mb-1">
                      {children}
                    </h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 space-y-1 my-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 space-y-1 my-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-700 leading-relaxed">
                      {children}
                    </li>
                  ),
                  p: ({ children }) => (
                    <p className="my-2 leading-relaxed">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">
                      {children}
                    </strong>
                  ),
                }}
              >
                {advice.content}
              </ReactMarkdown>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}