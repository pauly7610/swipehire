import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BADGES } from './useGamification';
import { motion } from 'framer-motion';
import { Lock, Award } from 'lucide-react';

export default function BadgesGrid({ userId }) {
  const [userPoints, setUserPoints] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    if (userId) loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    const [points] = await base44.entities.UserPoints.filter({ user_id: userId });
    setUserPoints(points);
  };

  const earnedBadgeIds = new Set((userPoints?.badges || []).map(b => b.id));
  const allBadges = Object.values(BADGES);

  const categories = {
    activity: 'Activity',
    matching: 'Matching',
    hiring: 'Hiring',
    streak: 'Streaks',
    level: 'Levels',
    profile: 'Profile',
    engagement: 'Engagement',
    challenges: 'Challenges'
  };

  const badgesByCategory = {};
  allBadges.forEach(badge => {
    if (!badgesByCategory[badge.category]) {
      badgesByCategory[badge.category] = [];
    }
    badgesByCategory[badge.category].push(badge);
  });

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{earnedBadgeIds.size}</p>
            <p className="text-sm text-gray-500">Badges Earned</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-700">{allBadges.length - earnedBadgeIds.size}</p>
          <p className="text-sm text-gray-500">Left to unlock</p>
        </div>
      </div>

      {/* Badges by category */}
      {Object.entries(badgesByCategory).map(([category, badges]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {categories[category]}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              return (
                <motion.button
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedBadge(badge)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all ${
                    isEarned 
                      ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300' 
                      : 'bg-gray-100 border-2 border-gray-200'
                  }`}
                >
                  <span className={`text-2xl ${!isEarned && 'grayscale opacity-40'}`}>
                    {badge.icon}
                  </span>
                  {!isEarned && (
                    <Lock className="absolute top-1 right-1 w-3 h-3 text-gray-400" />
                  )}
                  <p className={`text-[10px] text-center mt-1 font-medium truncate w-full ${
                    isEarned ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {badge.name}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Badge detail modal */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 ${
              earnedBadgeIds.has(selectedBadge.id)
                ? 'bg-gradient-to-br from-yellow-100 to-orange-100'
                : 'bg-gray-100 grayscale'
            }`}>
              {selectedBadge.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedBadge.name}</h3>
            <p className="text-gray-500 mb-4">{selectedBadge.description}</p>
            {earnedBadgeIds.has(selectedBadge.id) ? (
              <Badge className="bg-green-100 text-green-700">✓ Earned</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">🔒 Locked</Badge>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}