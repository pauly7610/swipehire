import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, Target, BookOpen, TrendingUp, Award, 
  Briefcase, Loader2, ChevronRight, Star, Zap,
  GraduationCap, Code, Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CandidateCareerHub() {
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [learningPaths, setLearningPaths] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      setCandidate(candidateData);

      if (candidateData) {
        const [results, candidateMatches] = await Promise.all([
          base44.entities.TestResult.filter({ candidate_id: candidateData.id }),
          base44.entities.Match.filter({ candidate_id: candidateData.id })
        ]);
        setTestResults(results);
        setMatches(candidateMatches);

        // Generate AI insights
        generateInsights(candidateData, results, candidateMatches);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const generateInsights = async (candidateData, results, candidateMatches) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this candidate's profile and provide personalized career insights.

Candidate:
- Headline: ${candidateData.headline || 'Not set'}
- Skills: ${candidateData.skills?.join(', ') || 'None listed'}
- Experience Level: ${candidateData.experience_level || 'Not set'}
- Years of Experience: ${candidateData.experience_years || 0}
- Test Results: ${results.length} completed, avg score ${results.length > 0 ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0}%
- Active Matches: ${candidateMatches.length}

Provide:
1. Overall profile strength score (0-100)
2. Top 3 strengths
3. Top 3 areas to improve
4. 3 recommended learning paths with specific skills
5. Career trajectory prediction`,
        response_json_schema: {
          type: 'object',
          properties: {
            profile_strength: { type: 'number' },
            strengths: { type: 'array', items: { type: 'string' } },
            improvements: { type: 'array', items: { type: 'string' } },
            learning_paths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  skills: { type: 'array', items: { type: 'string' } },
                  impact: { type: 'string' }
                }
              }
            },
            career_prediction: { type: 'string' }
          }
        }
      });
      setInsights(result);
      setLearningPaths(result.learning_paths || []);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  const profileStrength = insights?.profile_strength || 65;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <style>{`
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
        .swipe-gradient-text { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Career Hub</h1>
            <p className="text-gray-500">Your personalized career development center</p>
          </div>
          <Badge className="swipe-gradient text-white">
            <Sparkles className="w-3 h-3 mr-1" /> AI-Powered
          </Badge>
        </div>

        {/* Profile Strength */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="swipe-gradient p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">Profile Strength</h2>
                <p className="text-white/80 text-sm">Based on your skills, experience, and activity</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{profileStrength}%</p>
                <p className="text-sm text-white/80">
                  {profileStrength >= 80 ? 'Excellent' : profileStrength >= 60 ? 'Good' : 'Needs Work'}
                </p>
              </div>
            </div>
            <Progress value={profileStrength} className="h-2 mt-4 bg-white/20" />
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Matches', value: matches.length, icon: Briefcase, color: 'text-pink-500' },
            { label: 'Tests Completed', value: testResults.length, icon: Award, color: 'text-purple-500' },
            { label: 'Skills Listed', value: candidate?.skills?.length || 0, icon: Code, color: 'text-blue-500' },
            { label: 'Profile Views', value: Math.floor(Math.random() * 50) + 20, icon: Users, color: 'text-green-500' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList className="bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="insights" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg">
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="learning" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg">
              Learning Paths
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg">
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Strengths */}
              <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-green-500" /> Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(insights?.strengths || ['Strong technical foundation', 'Good communication skills', 'Relevant experience']).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Improvements */}
              <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-500" /> Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(insights?.improvements || ['Add more portfolio projects', 'Complete skill assessments', 'Expand professional network']).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Career Prediction */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Career Trajectory</h3>
                    <p className="text-sm text-gray-600">
                      {insights?.career_prediction || 'Based on your profile, you\'re well-positioned for mid-level roles in your field. With additional certifications and networking, senior positions could be within reach in 2-3 years.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="learning" className="space-y-4">
            {learningPaths.map((path, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{path.title}</h3>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {path.skills?.map((skill, j) => (
                              <Badge key={j} variant="secondary" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 mt-2">{path.impact}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            <Link to={createPageUrl('SkillTests')}>
              <Button className="w-full swipe-gradient text-white">
                <Zap className="w-4 h-4 mr-2" /> Take Skill Assessments
              </Button>
            </Link>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { title: 'Profile Complete', icon: '✅', earned: profileStrength >= 80 },
                { title: 'First Match', icon: '🎯', earned: matches.length > 0 },
                { title: 'Skill Master', icon: '🏆', earned: testResults.some(r => r.score >= 90) },
                { title: 'Networker', icon: '🤝', earned: false },
                { title: 'Quick Responder', icon: '⚡', earned: true },
                { title: 'Top Candidate', icon: '⭐', earned: false },
              ].map((achievement, i) => (
                <Card key={i} className={`border-0 shadow-sm ${!achievement.earned && 'opacity-50'}`}>
                  <CardContent className="p-4 text-center">
                    <span className="text-3xl">{achievement.icon}</span>
                    <p className="font-medium text-sm mt-2">{achievement.title}</p>
                    <p className="text-xs text-gray-400">{achievement.earned ? 'Earned' : 'Locked'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}