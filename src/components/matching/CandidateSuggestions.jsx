import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, User, MapPin, Briefcase, ChevronRight, Loader2, Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAIMatching } from './useAIMatching';

export default function CandidateSuggestions({ job, company }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});
  const { calculateMatchScore } = useAIMatching();

  useEffect(() => {
    if (job && company) {
      loadSuggestions();
    }
  }, [job, company]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const allCandidates = await base44.entities.Candidate.list();
      const allUsers = await base44.entities.User.list();
      
      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);

      // Calculate match scores for all candidates
      const scoredCandidates = allCandidates.map(candidate => {
        const { score, insights } = calculateMatchScore(candidate, job, company);
        return { candidate, user: userMap[candidate.user_id], score, insights };
      });

      // Sort by score and take top 5
      scoredCandidates.sort((a, b) => b.score - a.score);
      setSuggestions(scoredCandidates.slice(0, 5));
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 65) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const getTopInsight = (insights) => {
    const positiveInsight = insights.find(i => i.isPositive && i.type === 'skills');
    return positiveInsight || insights[0];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Top Candidates for This Role
        </CardTitle>
        <Link to={createPageUrl('SwipeCandidates') + `?jobId=${job.id}`}>
          <Button variant="ghost" size="sm" className="text-pink-600">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map(({ candidate, user, score, insights }, index) => {
            const topInsight = getTopInsight(insights);
            return (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {candidate?.photo_url ? (
                  <img src={candidate.photo_url} alt={user?.full_name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-pink-400" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">{user?.full_name || 'Candidate'}</h4>
                    {score >= 85 && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{candidate?.headline || 'Professional'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {candidate?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {candidate.location}
                      </span>
                    )}
                    {candidate?.experience_years && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {candidate.experience_years} yrs exp
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </div>
                  {topInsight && (
                    <span className="text-xs text-gray-400 text-right max-w-[120px] truncate flex items-center gap-1">
                      {topInsight.isPositive && <CheckCircle className="w-3 h-3 text-green-500" />}
                      {topInsight.text}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Skills match summary */}
        {job.skills_required?.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">Looking for candidates with:</p>
            <div className="flex flex-wrap gap-1">
              {job.skills_required.slice(0, 6).map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}