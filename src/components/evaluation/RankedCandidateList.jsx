import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, Users, Zap } from 'lucide-react';
import EvaluationCard from './EvaluationCard';
import CandidateEvaluator, { evaluateCandidate, rankApplicationsForJob } from './CandidateEvaluator';

export default function RankedCandidateList({ job, showAll = false }) {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [rankings, setRankings] = useState([]);
  const [evaluatingAll, setEvaluatingAll] = useState(false);
  const [viewMode, setViewMode] = useState('top'); // 'top' or 'all'

  useEffect(() => {
    loadData();
  }, [job.id]);

  const loadData = async () => {
    try {
      const [apps, evals, ranks] = await Promise.all([
        base44.entities.Application.filter({ job_id: job.id }),
        base44.entities.CandidateEvaluation.filter({ job_id: job.id }),
        base44.entities.ApplicationRanking.filter({ job_id: job.id })
      ]);

      // Get all candidates
      const candidateIds = [...new Set(apps.map(a => a.candidate_id))];
      const candidatesList = await Promise.all(
        candidateIds.map(id => base44.entities.Candidate.filter({ id }))
      );
      
      const candidatesMap = {};
      candidatesList.forEach(cList => {
        if (cList[0]) candidatesMap[cList[0].id] = cList[0];
      });

      // Create evaluation map
      const evalsMap = {};
      evals.forEach(e => {
        evalsMap[e.application_id] = e;
      });

      setApplications(apps);
      setCandidates(candidatesMap);
      setEvaluations(evalsMap);
      setRankings(ranks.sort((a, b) => a.rank - b.rank));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleEvaluateAll = async () => {
    setEvaluatingAll(true);

    try {
      // Evaluate unevaluated applications
      const unevaluated = applications.filter(app => !evaluations[app.id]);
      
      for (const app of unevaluated) {
        const candidate = candidates[app.candidate_id];
        if (candidate) {
          await evaluateCandidate(app, candidate, job);
        }
      }

      // Re-rank all
      await rankApplicationsForJob(job.id);
      await loadData();
    } catch (error) {
      console.error('Bulk evaluation failed:', error);
    }

    setEvaluatingAll(false);
  };

  const rankedApplications = rankings.map(rank => {
    const app = applications.find(a => a.id === rank.application_id);
    return {
      app,
      candidate: candidates[app?.candidate_id],
      evaluation: evaluations[app?.id],
      rank: rank.rank
    };
  }).filter(item => item.app && item.candidate);

  const topCandidates = rankedApplications.filter(item => 
    item.evaluation?.score >= 8.5 || item.evaluation?.fit_range === 'core_fit'
  );

  const unevaluatedApplications = applications
    .filter(app => !evaluations[app.id])
    .map(app => ({
      app,
      candidate: candidates[app.candidate_id]
    }))
    .filter(item => item.candidate);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{applications.length}</p>
            <p className="text-xs text-gray-500">Total Applicants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{topCandidates.length}</p>
            <p className="text-xs text-gray-500">Top Candidates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">{unevaluatedApplications.length}</p>
            <p className="text-xs text-gray-500">Unevaluated</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {unevaluatedApplications.length > 0 && (
        <Card className="border-pink-200 bg-pink-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">
                  {unevaluatedApplications.length} candidates need evaluation
                </p>
                <p className="text-xs text-gray-600">
                  Run AI evaluation to rank all applicants
                </p>
              </div>
              <Button
                onClick={handleEvaluateAll}
                disabled={evaluatingAll}
                className="swipe-gradient text-white"
              >
                {evaluatingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Evaluate All
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList className="w-full">
          <TabsTrigger value="top" className="flex-1">
            Top Candidates ({topCandidates.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1">
            All Applicants ({rankedApplications.length})
          </TabsTrigger>
          {unevaluatedApplications.length > 0 && (
            <TabsTrigger value="unevaluated" className="flex-1">
              Unevaluated ({unevaluatedApplications.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="top" className="space-y-3">
          {topCandidates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No top candidates yet. Evaluate applications to see rankings.</p>
              </CardContent>
            </Card>
          ) : (
            topCandidates.map(item => (
              <div key={item.app.id}>
                <EvaluationCard
                  evaluation={item.evaluation}
                  rank={item.rank}
                  onUpdate={loadData}
                />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {rankedApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No evaluated applicants yet.</p>
              </CardContent>
            </Card>
          ) : (
            rankedApplications.map(item => (
              <div key={item.app.id}>
                <EvaluationCard
                  evaluation={item.evaluation}
                  rank={item.rank}
                  onUpdate={loadData}
                />
              </div>
            ))
          )}
        </TabsContent>

        {unevaluatedApplications.length > 0 && (
          <TabsContent value="unevaluated" className="space-y-3">
            {unevaluatedApplications.map(item => (
              <Card key={item.app.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {item.candidate.headline || 'No title'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CandidateEvaluator
                    application={item.app}
                    candidate={item.candidate}
                    job={job}
                    onEvaluated={loadData}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}