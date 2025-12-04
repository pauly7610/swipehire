import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Sparkles, Loader2, Trophy, Medal, Award, Users,
  CheckCircle2, XCircle, Crown, FileText, ArrowRight
} from 'lucide-react';

export default function ResumeCompare({ 
  open, 
  onOpenChange, 
  candidates, 
  users, 
  jobs,
  selectedCandidateIds = [],
  onSelectCandidate
}) {
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState(new Set(selectedCandidateIds));
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleCandidate = (candidateId) => {
    const newSet = new Set(selectedForCompare);
    if (newSet.has(candidateId)) {
      newSet.delete(candidateId);
    } else if (newSet.size < 5) {
      newSet.add(candidateId);
    }
    setSelectedForCompare(newSet);
  };

  const runComparison = async () => {
    if (selectedForCompare.size < 2 || !selectedJob) return;
    
    setLoading(true);
    try {
      const job = jobs.find(j => j.id === selectedJob);
      const candidateProfiles = Array.from(selectedForCompare).map(id => {
        const candidate = candidates[id];
        const user = users[candidate?.user_id];
        return {
          id,
          name: user?.full_name || 'Unknown',
          headline: candidate?.headline || '',
          skills: candidate?.skills || [],
          experience_level: candidate?.experience_level || '',
          experience_years: candidate?.experience_years || 0,
          location: candidate?.location || '',
          bio: candidate?.bio || '',
          experience: candidate?.experience || [],
          has_resume: !!candidate?.resume_url
        };
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert technical recruiter. Compare these candidates for a specific job role and rank them.

JOB DETAILS:
Title: ${job?.title || 'N/A'}
Description: ${job?.description || 'N/A'}
Required Skills: ${job?.skills_required?.join(', ') || 'N/A'}
Experience Level: ${job?.experience_level_required || 'N/A'}
Location: ${job?.location || 'N/A'}
Job Type: ${job?.job_type || 'N/A'}

CANDIDATES:
${candidateProfiles.map((c, i) => `
Candidate ${i + 1} (ID: ${c.id}):
- Name: ${c.name}
- Headline: ${c.headline}
- Skills: ${c.skills.join(', ')}
- Experience Level: ${c.experience_level}
- Years of Experience: ${c.experience_years}
- Location: ${c.location}
- Has Resume: ${c.has_resume ? 'Yes' : 'No'}
- Experience: ${c.experience.map(e => `${e.title} at ${e.company}`).join('; ')}
`).join('\n')}

Analyze each candidate against the job requirements and provide:
1. A ranking from best to worst fit
2. For each candidate: match score (0-100), strengths, weaknesses, and recommendation
3. A clear winner with justification

Return JSON format:
{
  "rankings": [
    {
      "candidate_id": "id",
      "rank": 1,
      "score": 95,
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1"],
      "recommendation": "Strong hire - excellent skills match"
    }
  ],
  "winner": {
    "candidate_id": "id",
    "justification": "Why this candidate is the best fit"
  },
  "comparison_summary": "Brief overview of the comparison"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            rankings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  candidate_id: { type: "string" },
                  rank: { type: "number" },
                  score: { type: "number" },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  recommendation: { type: "string" }
                }
              }
            },
            winner: {
              type: "object",
              properties: {
                candidate_id: { type: "string" },
                justification: { type: "string" }
              }
            },
            comparison_summary: { type: "string" }
          }
        }
      });

      setComparison(result);
    } catch (error) {
      console.error('Comparison failed:', error);
    }
    setLoading(false);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
    if (rank === 2) return 'bg-gray-50 border-gray-200';
    if (rank === 3) return 'bg-amber-50 border-amber-200';
    return 'bg-white border-gray-200';
  };

  const candidateList = Object.values(candidates);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            AI Resume Comparison Tool
          </DialogTitle>
        </DialogHeader>

        {!comparison ? (
          <div className="space-y-6">
            {/* Job Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Job to Compare Against</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Candidate Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Candidates to Compare (2-5)
                <span className="text-gray-400 ml-2">{selectedForCompare.size} selected</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {candidateList.map(candidate => {
                  const user = users[candidate.user_id];
                  const isSelected = selectedForCompare.has(candidate.id);
                  
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => toggleCandidate(candidate.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-pink-500 bg-pink-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{user?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate">{candidate.headline}</p>
                      </div>
                      {candidate.resume_url && (
                        <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button 
              onClick={runComparison}
              disabled={loading || selectedForCompare.size < 2 || !selectedJob}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Candidates...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Compare {selectedForCompare.size} Candidates
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Winner Banner */}
            {comparison.winner && (
              <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-yellow-900">
                      Best Fit: {users[candidates[comparison.winner.candidate_id]?.user_id]?.full_name}
                    </p>
                    <p className="text-sm text-yellow-800">{comparison.winner.justification}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <p className="text-gray-600 text-sm">{comparison.comparison_summary}</p>

            {/* Rankings */}
            <div className="space-y-3">
              {comparison.rankings?.sort((a, b) => a.rank - b.rank).map(ranking => {
                const candidate = candidates[ranking.candidate_id];
                const user = users[candidate?.user_id];
                
                return (
                  <Card key={ranking.candidate_id} className={`border ${getRankBg(ranking.rank)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(ranking.rank)}
                          <span className="text-2xl font-bold text-gray-300">#{ranking.rank}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{user?.full_name}</h3>
                              <p className="text-sm text-gray-500">{candidate?.headline}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-pink-600">{ranking.score}%</span>
                              <p className="text-xs text-gray-500">Match Score</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                              <ul className="space-y-1">
                                {ranking.strengths?.slice(0, 3).map((s, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-red-700 mb-1">Weaknesses</p>
                              <ul className="space-y-1">
                                {ranking.weaknesses?.slice(0, 3).map((w, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                    <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                    {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <p className="text-sm text-gray-700 mt-3 p-2 bg-white/50 rounded-lg">
                            <strong>Recommendation:</strong> {ranking.recommendation}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button variant="outline" onClick={() => setComparison(null)} className="w-full">
              <ArrowRight className="w-4 h-4 mr-2" />
              Compare Different Candidates
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}