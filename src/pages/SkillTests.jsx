import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, Stethoscope, Calculator, DollarSign, Megaphone, 
  Users, Palette, Briefcase, Trophy, Clock, Star, Loader2,
  ChevronRight, Sparkles, Award, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import SkillTestQuiz from '@/components/tests/SkillTestQuiz';

const CATEGORIES = [
  { id: 'tech', label: 'Technology', icon: Code, color: 'bg-blue-500' },
  { id: 'healthcare', label: 'Healthcare', icon: Stethoscope, color: 'bg-green-500' },
  { id: 'accounting', label: 'Accounting', icon: Calculator, color: 'bg-purple-500' },
  { id: 'finance', label: 'Finance', icon: DollarSign, color: 'bg-emerald-500' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'bg-pink-500' },
  { id: 'sales', label: 'Sales', icon: Users, color: 'bg-orange-500' },
  { id: 'design', label: 'Design', icon: Palette, color: 'bg-indigo-500' },
  { id: 'management', label: 'Management', icon: Briefcase, color: 'bg-amber-500' },
];

export default function SkillTests() {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTest, setActiveTest] = useState(null);
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      setCandidate(candidateData);

      const allTests = await base44.entities.SkillTest.list();
      setTests(allTests);

      if (candidateData) {
        const userResults = await base44.entities.TestResult.filter({ candidate_id: candidateData.id });
        setResults(userResults);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const generateTest = async (category) => {
    setGenerating(true);
    try {
      const catInfo = CATEGORIES.find(c => c.id === category);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a skill assessment test for ${catInfo.label} professionals. Generate 10 multiple choice questions that test practical knowledge. Mix difficulty levels. Each question should have 4 options with only one correct answer.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } },
                  correct_answer: { type: 'number' },
                  explanation: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const newTest = await base44.entities.SkillTest.create({
        title: result.title,
        category,
        description: result.description,
        difficulty: 'intermediate',
        questions: result.questions,
        time_limit_minutes: 15,
        passing_score: 70
      });

      setTests([...tests, newTest]);
    } catch (error) {
      console.error('Failed to generate test:', error);
    }
    setGenerating(false);
  };

  const handleTestComplete = async (testResult) => {
    const newResult = await base44.entities.TestResult.create({
      candidate_id: candidate.id,
      user_id: user.id,
      test_id: activeTest.id,
      ...testResult
    });
    setResults([...results, newResult]);
    setActiveTest(null);
    loadData();
  };

  const getTestResult = (testId) => results.find(r => r.test_id === testId);
  const getCategoryIcon = (categoryId) => CATEGORIES.find(c => c.id === categoryId)?.icon || Briefcase;
  const getCategoryColor = (categoryId) => CATEGORIES.find(c => c.id === categoryId)?.color || 'bg-gray-500';

  const filteredTests = selectedCategory === 'all' 
    ? tests 
    : tests.filter(t => t.category === selectedCategory);

  const passedTests = results.filter(r => r.passed).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (activeTest) {
    return (
      <SkillTestQuiz
        test={activeTest}
        onComplete={handleTestComplete}
        onCancel={() => setActiveTest(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Skill Tests</h1>
          <p className="text-gray-500">Keep your skills sharp and earn badges</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{passedTests}</p>
            <p className="text-sm text-gray-500">Tests Passed</p>
          </Card>
          <Card className="p-4 text-center">
            <Award className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{results.filter(r => r.badge_earned).length}</p>
            <p className="text-sm text-gray-500">Badges Earned</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="w-8 h-8 mx-auto text-pink-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {results.length > 0 ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0}%
            </p>
            <p className="text-sm text-gray-500">Avg Score</p>
          </Card>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="flex-wrap h-auto p-1 bg-white">
            <TabsTrigger value="all" className="data-[state=active]:swipe-gradient data-[state=active]:text-white">
              All
            </TabsTrigger>
            {CATEGORIES.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="data-[state=active]:swipe-gradient data-[state=active]:text-white"
              >
                <cat.icon className="w-4 h-4 mr-1" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Generate Test Button */}
        {selectedCategory !== 'all' && (
          <Button
            onClick={() => generateTest(selectedCategory)}
            disabled={generating}
            className="mb-6 swipe-gradient text-white"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate New {CATEGORIES.find(c => c.id === selectedCategory)?.label} Test</>
            )}
          </Button>
        )}

        {/* Tests Grid */}
        {filteredTests.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Tests Available</h3>
            <p className="text-gray-500 mb-4">Select a category and generate an AI-powered test</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredTests.map((test) => {
              const result = getTestResult(test.id);
              const Icon = getCategoryIcon(test.category);
              const color = getCategoryColor(test.category);

              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className={`w-2 ${color}`} />
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{test.title}</h3>
                                <p className="text-sm text-gray-500 capitalize">{test.category} • {test.difficulty}</p>
                              </div>
                            </div>
                            {result && (
                              <Badge className={result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {result.score}%
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{test.description}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {test.time_limit_minutes || 15} min
                              </span>
                              <span>{test.questions?.length || 10} questions</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setActiveTest(test)}
                              className={result?.passed ? 'bg-green-600 hover:bg-green-700' : 'swipe-gradient'}
                            >
                              {result?.passed ? (
                                <><CheckCircle className="w-4 h-4 mr-1" /> Retake</>
                              ) : result ? (
                                'Retry'
                              ) : (
                                <>Start <ChevronRight className="w-4 h-4 ml-1" /></>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}