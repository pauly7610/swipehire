import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Star, Trophy } from 'lucide-react';
import { calculateLevel, pointsForNextLevel } from './useGamification';
import { motion, AnimatePresence } from 'framer-motion';

export default function PointsDisplay({ userId, compact = false }) {
  const [userPoints, setUserPoints] = useState(null);
  const [showPointsAnim, setShowPointsAnim] = useState(false);
  const [animPoints, setAnimPoints] = useState(0);

  useEffect(() => {
    if (userId) loadPoints();
  }, [userId]);

  const loadPoints = async () => {
    const [points] = await base44.entities.UserPoints.filter({ user_id: userId });
    setUserPoints(points || { total_points: 0, level: 1, streak_days: 0 });
  };

  if (!userPoints) return null;

  const currentLevel = userPoints.level || 1;
  const totalPoints = userPoints.total_points || 0;
  const nextLevelPoints = pointsForNextLevel(currentLevel);
  const prevLevelPoints = pointsForNextLevel(currentLevel - 1);
  const progressPercent = ((totalPoints - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
          <Star className="w-3 h-3 mr-1" />
          {totalPoints.toLocaleString()}
        </Badge>
        {userPoints.streak_days > 0 && (
          <Badge variant="outline" className="border-orange-300 text-orange-600">
            <Flame className="w-3 h-3 mr-1" />
            {userPoints.streak_days}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white/70 text-xs">Level {currentLevel}</p>
              <p className="font-bold text-lg">{totalPoints.toLocaleString()} pts</p>
            </div>
          </div>
          
          {userPoints.streak_days > 0 && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
              <Flame className="w-4 h-4 text-orange-300" />
              <span className="text-sm font-medium">{userPoints.streak_days} day streak</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/70">
            <span>Progress to Level {currentLevel + 1}</span>
            <span>{nextLevelPoints - totalPoints} pts needed</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-white/20" />
        </div>
      </div>

      {/* Points animation */}
      <AnimatePresence>
        {showPointsAnim && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -50 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 text-2xl font-bold text-yellow-300"
          >
            +{animPoints}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}