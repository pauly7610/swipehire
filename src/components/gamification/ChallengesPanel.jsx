import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CHALLENGE_TEMPLATES } from './useGamification';
import { Target, Clock, CheckCircle2, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChallengesPanel({ userId }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    if (userId) loadChallenges();
  }, [userId]);

  const loadChallenges = async () => {
    const userChallenges = await base44.entities.Challenge.filter({ user_id: userId });
    setChallenges(userChallenges);
    
    // Check if we need to generate new challenges
    const today = new Date().toISOString().split('T')[0];
    const hasTodayDaily = userChallenges.some(c => 
      c.challenge_type === 'daily' && c.created_date?.startsWith(today)
    );
    
    if (!hasTodayDaily) {
      await generateDailyChallenges(userId);
      const refreshed = await base44.entities.Challenge.filter({ user_id: userId });
      setChallenges(refreshed);
    }
    
    setLoading(false);
  };

  const generateDailyChallenges = async (userId) => {
    // Pick 3 random daily challenges
    const dailyTemplates = [...CHALLENGE_TEMPLATES.daily];
    const selected = [];
    for (let i = 0; i < 3 && dailyTemplates.length > 0; i++) {
      const idx = Math.floor(Math.random() * dailyTemplates.length);
      selected.push(dailyTemplates.splice(idx, 1)[0]);
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    for (const template of selected) {
      await base44.entities.Challenge.create({
        user_id: userId,
        challenge_type: 'daily',
        challenge_id: template.id,
        title: template.title,
        description: template.description,
        target: template.target,
        progress: 0,
        reward_points: template.reward_points,
        status: 'active',
        expires_at: tomorrow.toISOString(),
        action_type: template.action_type
      });
    }
  };

  const filteredChallenges = challenges.filter(c => c.challenge_type === activeTab);
  const activeChallenges = filteredChallenges.filter(c => c.status === 'active');
  const completedChallenges = filteredChallenges.filter(c => c.status === 'completed');

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return '';
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h left`;
    return `${Math.floor(hours / 24)}d left`;
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={activeTab === 'daily' ? 'default' : 'outline'}
          onClick={() => setActiveTab('daily')}
          className={activeTab === 'daily' ? 'bg-gradient-to-r from-pink-500 to-orange-500' : ''}
        >
          <Zap className="w-4 h-4 mr-1" />
          Daily
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'weekly' ? 'default' : 'outline'}
          onClick={() => setActiveTab('weekly')}
          className={activeTab === 'weekly' ? 'bg-gradient-to-r from-pink-500 to-orange-500' : ''}
        >
          <Target className="w-4 h-4 mr-1" />
          Weekly
        </Button>
      </div>

      {/* Active Challenges */}
      <div className="space-y-3">
        <AnimatePresence>
          {activeChallenges.map((challenge, idx) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          +{challenge.reward_points} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{challenge.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {getTimeRemaining(challenge.expires_at)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-700">
                        {challenge.progress || 0} / {challenge.target}
                      </span>
                    </div>
                    <Progress 
                      value={((challenge.progress || 0) / challenge.target) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {activeChallenges.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No active {activeTab} challenges</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={loadChallenges}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Completed ({completedChallenges.length})
          </h4>
          {completedChallenges.slice(0, 3).map(challenge => (
            <div key={challenge.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-green-700">{challenge.title}</span>
              <Badge className="bg-green-100 text-green-700 border-0">
                +{challenge.reward_points} pts
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}