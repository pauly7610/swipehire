import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus, Video, Loader2, Send } from 'lucide-react';
import ChallengeCard from './ChallengeCard';
import VideoIntroRecorder from '@/components/candidate/VideoIntroRecorder';

export default function ChallengeFeed({ viewerType, user, company, jobs = [] }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showResponseRecorder, setShowResponseRecorder] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [userResponses, setUserResponses] = useState(new Set());
  const [newChallenge, setNewChallenge] = useState({
    prompt: '',
    challenge_type: 'pitch_yourself',
    job_id: '',
    max_duration_seconds: 90
  });

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const [allChallenges, myResponses] = await Promise.all([
        base44.entities.Challenge.filter({ status: 'active' }, '-created_date', 50),
        user ? base44.entities.ChallengeResponse.filter({ user_id: user.id }) : Promise.resolve([])
      ]);

      setChallenges(allChallenges);
      setUserResponses(new Set(myResponses.map(r => r.challenge_id)));
    } catch (error) {
      console.error('Failed to load challenges:', error);
    }
    setLoading(false);
  };

  const createChallenge = async () => {
    if (!newChallenge.prompt.trim()) return;

    try {
      const challenge = await base44.entities.Challenge.create({
        issuer_id: user.id,
        company_id: company.id,
        job_id: newChallenge.job_id || null,
        prompt: newChallenge.prompt,
        challenge_type: newChallenge.challenge_type,
        max_duration_seconds: newChallenge.max_duration_seconds,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      });

      setChallenges([challenge, ...challenges]);
      setShowCreateChallenge(false);
      setNewChallenge({ prompt: '', challenge_type: 'pitch_yourself', job_id: '', max_duration_seconds: 90 });
    } catch (error) {
      console.error('Failed to create challenge:', error);
    }
  };

  const handleRespondToChallenge = (challenge) => {
    setActiveChallenge(challenge);
    setShowResponseRecorder(true);
  };

  const handleVideoResponse = async (videoUrl) => {
    if (!activeChallenge) return;

    try {
      // Create response
      const [candidateData] = await base44.entities.Candidate.filter({ user_id: user.id });
      
      const response = await base44.entities.ChallengeResponse.create({
        challenge_id: activeChallenge.id,
        candidate_id: candidateData?.id,
        user_id: user.id,
        video_url: videoUrl,
        status: 'submitted'
      });

      // Update challenge response count
      await base44.entities.Challenge.update(activeChallenge.id, {
        response_count: (activeChallenge.response_count || 0) + 1
      });

      // AI Evaluation in background
      evaluateResponse(response, activeChallenge, candidateData);

      // Update local state
      setUserResponses(prev => new Set(prev).add(activeChallenge.id));
      setChallenges(challenges.map(c => 
        c.id === activeChallenge.id 
          ? { ...c, response_count: (c.response_count || 0) + 1 } 
          : c
      ));

      setShowResponseRecorder(false);
      setActiveChallenge(null);
    } catch (error) {
      console.error('Failed to submit response:', error);
    }
  };

  const evaluateResponse = async (response, challenge, candidate) => {
    try {
      const prompt = `Evaluate this video challenge response.
      
      Challenge: ${challenge.prompt}
      Type: ${challenge.challenge_type}
      Candidate: ${candidate?.headline}
      
      Evaluate on:
      1. Clarity (0-100): How clear and articulate is the response?
      2. Confidence (0-100): How confident is the delivery?
      3. Depth (0-100): How thorough and detailed?
      4. Relevance (0-100): How relevant to the challenge?
      
      Also provide:
      - Overall score (0-100)
      - Brief feedback (2-3 sentences)
      - Top 2 strengths
      - Top 2 areas to improve
      
      Return as JSON.`;

      const evaluation = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            clarity_score: { type: "number" },
            confidence_score: { type: "number" },
            depth_score: { type: "number" },
            relevance_score: { type: "number" },
            overall_score: { type: "number" },
            feedback: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            areas_to_improve: { type: "array", items: { type: "string" } }
          }
        }
      });

      await base44.entities.ChallengeResponse.update(response.id, {
        ai_evaluation: evaluation
      });

      // Notify candidate
      await base44.entities.Notification.create({
        user_id: user.id,
        type: 'system',
        title: '✅ Challenge Evaluated',
        message: `Your response scored ${evaluation.overall_score}/100. ${evaluation.feedback}`,
        navigate_to: 'VideoFeed'
      });
    } catch (error) {
      console.error('Failed to evaluate response:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Proof-of-Work Challenges
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Show what you can do, not just what you say</p>
        </div>
        {viewerType === 'employer' && (
          <Button onClick={() => setShowCreateChallenge(true)} className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" /> New Challenge
          </Button>
        )}
      </div>

      {/* Challenge List */}
      <div className="space-y-3">
        {challenges.length === 0 ? (
          <Card className="p-8 text-center">
            <Zap className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No active challenges yet</p>
            {viewerType === 'employer' && (
              <Button 
                onClick={() => setShowCreateChallenge(true)} 
                className="mt-4 bg-purple-500 hover:bg-purple-600"
              >
                Create First Challenge
              </Button>
            )}
          </Card>
        ) : (
          challenges.map((challenge) => {
            const [job] = jobs.filter(j => j.id === challenge.job_id);
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                company={company}
                job={job}
                userHasResponded={userResponses.has(challenge.id)}
                onRespond={handleRespondToChallenge}
              />
            );
          })
        )}
      </div>

      {/* Create Challenge Dialog */}
      <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Challenge Type</label>
              <Select 
                value={newChallenge.challenge_type} 
                onValueChange={(v) => setNewChallenge({ ...newChallenge, challenge_type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pitch_yourself">Pitch Yourself</SelectItem>
                  <SelectItem value="explain_system">Explain a System You Built</SelectItem>
                  <SelectItem value="walk_through_bug">Walk Through a Bug Fix</SelectItem>
                  <SelectItem value="solve_problem">Solve This Problem</SelectItem>
                  <SelectItem value="design_review">Design Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">For Job (Optional)</label>
              <Select 
                value={newChallenge.job_id} 
                onValueChange={(v) => setNewChallenge({ ...newChallenge, job_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select job (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All candidates</SelectItem>
                  {jobs.map(j => (
                    <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Challenge Prompt</label>
              <Textarea
                value={newChallenge.prompt}
                onChange={(e) => setNewChallenge({ ...newChallenge, prompt: e.target.value })}
                placeholder="e.g., Walk us through a complex technical problem you solved recently..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Max Duration (seconds)</label>
              <Input
                type="number"
                value={newChallenge.max_duration_seconds}
                onChange={(e) => setNewChallenge({ ...newChallenge, max_duration_seconds: parseInt(e.target.value) })}
                min={30}
                max={180}
                className="mt-1"
              />
            </div>

            <Button 
              onClick={createChallenge} 
              className="w-full bg-purple-500 hover:bg-purple-600"
              disabled={!newChallenge.prompt.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Issue Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Response Recorder */}
      <VideoIntroRecorder
        open={showResponseRecorder}
        onOpenChange={setShowResponseRecorder}
        onVideoSaved={handleVideoResponse}
        maxDuration={activeChallenge?.max_duration_seconds || 90}
      />
    </div>
  );
}