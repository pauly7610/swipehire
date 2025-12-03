import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, Target, TrendingUp } from 'lucide-react';
import PointsDisplay from '@/components/gamification/PointsDisplay';
import BadgesGrid from '@/components/gamification/BadgesGrid';
import ChallengesPanel from '@/components/gamification/ChallengesPanel';
import Leaderboard from '@/components/gamification/Leaderboard';
import { updateStreak } from '@/components/gamification/useGamification';
import { Loader2 } from 'lucide-react';

export default function Gamification() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    // Update streak on page load
    await updateStreak(currentUser.id);
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
          <p className="text-gray-500">Track your progress and earn rewards</p>
        </div>

        {/* Points Display */}
        <PointsDisplay userId={user?.id} />

        {/* Main Content */}
        <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="challenges" className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges">
            <ChallengesPanel userId={user?.id} />
          </TabsContent>

          <TabsContent value="badges">
            <BadgesGrid userId={user?.id} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard currentUserId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}