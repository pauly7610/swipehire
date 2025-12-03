import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Crown, TrendingUp, Users, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Leaderboard({ currentUserId }) {
  const [leaderboardData, setLeaderboardData] = useState({ candidates: [], recruiters: [] });
  const [users, setUsers] = useState({});
  const [candidates, setCandidates] = useState({});
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('weekly');

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    setLoading(true);
    
    const [allPoints, allUsers, allCandidates, allCompanies] = await Promise.all([
      base44.entities.UserPoints.list('-total_points', 100),
      base44.entities.User.list(),
      base44.entities.Candidate.list(),
      base44.entities.Company.list()
    ]);

    const userMap = {};
    allUsers.forEach(u => { userMap[u.id] = u; });
    setUsers(userMap);

    const candidateMap = {};
    allCandidates.forEach(c => { candidateMap[c.user_id] = c; });
    setCandidates(candidateMap);

    const companyMap = {};
    allCompanies.forEach(c => { companyMap[c.user_id] = c; });
    setCompanies(companyMap);

    // Separate into candidates and recruiters
    const candidateLeaders = [];
    const recruiterLeaders = [];

    allPoints.forEach(points => {
      const isRecruiter = companyMap[points.user_id];
      const isCandidate = candidateMap[points.user_id];
      
      const score = timeframe === 'weekly' ? (points.weekly_points || 0) : (points.total_points || 0);
      
      if (isRecruiter) {
        recruiterLeaders.push({ ...points, score });
      } else if (isCandidate) {
        candidateLeaders.push({ ...points, score });
      }
    });

    // Sort by score
    candidateLeaders.sort((a, b) => b.score - a.score);
    recruiterLeaders.sort((a, b) => b.score - a.score);

    setLeaderboardData({
      candidates: candidateLeaders.slice(0, 10),
      recruiters: recruiterLeaders.slice(0, 10)
    });
    
    setLoading(false);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</span>;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
    return 'bg-white border-gray-100';
  };

  const LeaderboardList = ({ data, type }) => {
    const currentUserRank = data.findIndex(d => d.user_id === currentUserId) + 1;
    
    return (
      <div className="space-y-2">
        {data.map((entry, idx) => {
          const rank = idx + 1;
          const user = users[entry.user_id];
          const candidate = candidates[entry.user_id];
          const company = companies[entry.user_id];
          const isCurrentUser = entry.user_id === currentUserId;
          
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl border ${getRankBg(rank)} ${
                isCurrentUser ? 'ring-2 ring-pink-500' : ''
              }`}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(rank)}
              </div>
              
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                {(candidate?.photo_url || company?.logo_url) ? (
                  <img 
                    src={candidate?.photo_url || company?.logo_url} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="font-bold text-pink-500">
                    {user?.full_name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user?.full_name || 'User'}
                  {isCurrentUser && <span className="text-pink-500 ml-1">(You)</span>}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {type === 'candidates' ? candidate?.headline : company?.name}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-gray-900">{entry.score.toLocaleString()}</p>
                <p className="text-xs text-gray-500">pts</p>
              </div>
              
              <Badge variant="outline" className="text-xs">
                Lvl {entry.level || 1}
              </Badge>
            </motion.div>
          );
        })}

        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No data yet</p>
          </div>
        )}

        {currentUserRank === 0 && currentUserId && data.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-sm text-gray-500">You're not on this leaderboard yet</p>
            <p className="text-xs text-gray-400">Start earning points to climb the ranks!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="font-bold text-gray-900">Leaderboard</h2>
        </div>
        <div className="flex gap-1">
          <Badge 
            variant={timeframe === 'weekly' ? 'default' : 'outline'}
            className={`cursor-pointer ${timeframe === 'weekly' ? 'bg-pink-500' : ''}`}
            onClick={() => setTimeframe('weekly')}
          >
            Weekly
          </Badge>
          <Badge 
            variant={timeframe === 'alltime' ? 'default' : 'outline'}
            className={`cursor-pointer ${timeframe === 'alltime' ? 'bg-pink-500' : ''}`}
            onClick={() => setTimeframe('alltime')}
          >
            All Time
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="candidates">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="candidates" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Candidates
          </TabsTrigger>
          <TabsTrigger value="recruiters" className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            Recruiters
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="candidates" className="mt-4">
          <LeaderboardList data={leaderboardData.candidates} type="candidates" />
        </TabsContent>
        
        <TabsContent value="recruiters" className="mt-4">
          <LeaderboardList data={leaderboardData.recruiters} type="recruiters" />
        </TabsContent>
      </Tabs>
    </div>
  );
}