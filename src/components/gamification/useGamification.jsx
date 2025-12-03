import { base44 } from '@/api/base44Client';

// Point values for different actions
export const POINT_VALUES = {
  swipe: 2,
  apply: 10,
  match: 25,
  interview_scheduled: 50,
  interview_completed: 75,
  hire: 200,
  post_job: 30,
  complete_profile: 100,
  video_post: 20,
  daily_login: 5,
  streak_bonus: 10, // per day of streak
  connection: 15,
  referral: 100
};

// Badge definitions
export const BADGES = {
  // Profile badges
  profile_complete: { id: 'profile_complete', name: 'Profile Pro', icon: '👤', description: 'Completed your profile 100%', category: 'profile' },
  video_star: { id: 'video_star', name: 'Video Star', icon: '🎬', description: 'Posted your first video', category: 'engagement' },
  
  // Activity badges
  first_swipe: { id: 'first_swipe', name: 'First Impression', icon: '👆', description: 'Made your first swipe', category: 'activity' },
  swipe_master: { id: 'swipe_master', name: 'Swipe Master', icon: '🔥', description: 'Swiped 100 times', category: 'activity' },
  swipe_legend: { id: 'swipe_legend', name: 'Swipe Legend', icon: '⚡', description: 'Swiped 500 times', category: 'activity' },
  
  // Match badges
  first_match: { id: 'first_match', name: 'First Match', icon: '💕', description: 'Got your first match', category: 'matching' },
  match_maker: { id: 'match_maker', name: 'Match Maker', icon: '💘', description: 'Got 10 matches', category: 'matching' },
  
  // Hiring badges (for recruiters)
  first_hire: { id: 'first_hire', name: 'Talent Scout', icon: '🎯', description: 'Made your first hire', category: 'hiring' },
  hiring_hero: { id: 'hiring_hero', name: 'Hiring Hero', icon: '🏆', description: 'Made 10 hires', category: 'hiring' },
  job_poster: { id: 'job_poster', name: 'Job Poster', icon: '📋', description: 'Posted your first job', category: 'hiring' },
  
  // Streak badges
  streak_3: { id: 'streak_3', name: 'Getting Started', icon: '🔥', description: '3-day login streak', category: 'streak' },
  streak_7: { id: 'streak_7', name: 'On Fire', icon: '🔥🔥', description: '7-day login streak', category: 'streak' },
  streak_30: { id: 'streak_30', name: 'Unstoppable', icon: '💎', description: '30-day login streak', category: 'streak' },
  
  // Challenge badges
  challenge_champ: { id: 'challenge_champ', name: 'Challenge Champ', icon: '🏅', description: 'Completed 10 challenges', category: 'challenges' },
  
  // Level badges
  level_5: { id: 'level_5', name: 'Rising Star', icon: '⭐', description: 'Reached level 5', category: 'level' },
  level_10: { id: 'level_10', name: 'Pro User', icon: '🌟', description: 'Reached level 10', category: 'level' },
  level_25: { id: 'level_25', name: 'Elite', icon: '👑', description: 'Reached level 25', category: 'level' }
};

// Challenge templates
export const CHALLENGE_TEMPLATES = {
  daily: [
    { id: 'daily_swipe_10', title: 'Quick Swiper', description: 'Swipe on 10 profiles today', target: 10, reward_points: 20, action_type: 'swipe' },
    { id: 'daily_swipe_25', title: 'Swipe Surge', description: 'Swipe on 25 profiles today', target: 25, reward_points: 40, action_type: 'swipe' },
    { id: 'daily_swipe_50', title: 'Swipe Marathon', description: 'Swipe on 50 profiles today', target: 50, reward_points: 75, action_type: 'swipe' },
    { id: 'daily_apply_3', title: 'Job Hunter', description: 'Apply to 3 jobs today', target: 3, reward_points: 30, action_type: 'apply' },
    { id: 'daily_connect_5', title: 'Networker', description: 'Send 5 connection requests', target: 5, reward_points: 25, action_type: 'connection' }
  ],
  weekly: [
    { id: 'weekly_swipe_100', title: 'Weekly Warrior', description: 'Swipe on 100 profiles this week', target: 100, reward_points: 100, action_type: 'swipe' },
    { id: 'weekly_apply_10', title: 'Application Ace', description: 'Apply to 10 jobs this week', target: 10, reward_points: 80, action_type: 'apply' },
    { id: 'weekly_post_job', title: 'Job Creator', description: 'Post a new job this week', target: 1, reward_points: 50, action_type: 'post_job' },
    { id: 'weekly_interview_3', title: 'Interview Pro', description: 'Complete 3 interviews this week', target: 3, reward_points: 150, action_type: 'interview' },
    { id: 'weekly_video', title: 'Content Creator', description: 'Post a video this week', target: 1, reward_points: 40, action_type: 'video_post' }
  ]
};

// Calculate level from points
export const calculateLevel = (points) => {
  // Level formula: level = floor(sqrt(points / 100)) + 1
  return Math.floor(Math.sqrt(points / 100)) + 1;
};

// Points needed for next level
export const pointsForNextLevel = (currentLevel) => {
  return Math.pow(currentLevel, 2) * 100;
};

// Award points to user
export const awardPoints = async (userId, action, multiplier = 1) => {
  const points = (POINT_VALUES[action] || 0) * multiplier;
  if (points === 0) return null;

  let userPoints = await base44.entities.UserPoints.filter({ user_id: userId });
  
  if (userPoints.length === 0) {
    // Create new points record
    userPoints = await base44.entities.UserPoints.create({
      user_id: userId,
      total_points: points,
      weekly_points: points,
      level: 1,
      streak_days: 1,
      last_active_date: new Date().toISOString().split('T')[0],
      badges: []
    });
  } else {
    const current = userPoints[0];
    const newTotal = (current.total_points || 0) + points;
    const newLevel = calculateLevel(newTotal);
    
    await base44.entities.UserPoints.update(current.id, {
      total_points: newTotal,
      weekly_points: (current.weekly_points || 0) + points,
      level: newLevel
    });
    
    userPoints = { ...current, total_points: newTotal, level: newLevel };
  }

  return { points, userPoints };
};

// Check and award badges
export const checkAndAwardBadges = async (userId, stats) => {
  const [userPointsData] = await base44.entities.UserPoints.filter({ user_id: userId });
  if (!userPointsData) return [];

  const currentBadges = userPointsData.badges || [];
  const currentBadgeIds = new Set(currentBadges.map(b => b.id));
  const newBadges = [];

  // Check each badge condition
  if (!currentBadgeIds.has('first_swipe') && stats.totalSwipes >= 1) {
    newBadges.push(BADGES.first_swipe);
  }
  if (!currentBadgeIds.has('swipe_master') && stats.totalSwipes >= 100) {
    newBadges.push(BADGES.swipe_master);
  }
  if (!currentBadgeIds.has('swipe_legend') && stats.totalSwipes >= 500) {
    newBadges.push(BADGES.swipe_legend);
  }
  if (!currentBadgeIds.has('first_match') && stats.totalMatches >= 1) {
    newBadges.push(BADGES.first_match);
  }
  if (!currentBadgeIds.has('match_maker') && stats.totalMatches >= 10) {
    newBadges.push(BADGES.match_maker);
  }
  if (!currentBadgeIds.has('first_hire') && stats.totalHires >= 1) {
    newBadges.push(BADGES.first_hire);
  }
  if (!currentBadgeIds.has('hiring_hero') && stats.totalHires >= 10) {
    newBadges.push(BADGES.hiring_hero);
  }
  if (!currentBadgeIds.has('streak_3') && userPointsData.streak_days >= 3) {
    newBadges.push(BADGES.streak_3);
  }
  if (!currentBadgeIds.has('streak_7') && userPointsData.streak_days >= 7) {
    newBadges.push(BADGES.streak_7);
  }
  if (!currentBadgeIds.has('streak_30') && userPointsData.streak_days >= 30) {
    newBadges.push(BADGES.streak_30);
  }
  if (!currentBadgeIds.has('level_5') && userPointsData.level >= 5) {
    newBadges.push(BADGES.level_5);
  }
  if (!currentBadgeIds.has('level_10') && userPointsData.level >= 10) {
    newBadges.push(BADGES.level_10);
  }
  if (!currentBadgeIds.has('level_25') && userPointsData.level >= 25) {
    newBadges.push(BADGES.level_25);
  }

  // Award new badges
  if (newBadges.length > 0) {
    const updatedBadges = [
      ...currentBadges,
      ...newBadges.map(b => ({ id: b.id, name: b.name, earned_date: new Date().toISOString() }))
    ];
    await base44.entities.UserPoints.update(userPointsData.id, { badges: updatedBadges });
  }

  return newBadges;
};

// Update challenge progress
export const updateChallengeProgress = async (userId, actionType, count = 1) => {
  const activeChallenges = await base44.entities.Challenge.filter({
    user_id: userId,
    action_type: actionType,
    status: 'active'
  });

  const completedChallenges = [];

  for (const challenge of activeChallenges) {
    const newProgress = (challenge.progress || 0) + count;
    const isComplete = newProgress >= challenge.target;

    await base44.entities.Challenge.update(challenge.id, {
      progress: newProgress,
      status: isComplete ? 'completed' : 'active'
    });

    if (isComplete) {
      // Award points for completing challenge
      await awardPoints(userId, 'challenge_complete', challenge.reward_points / 10);
      completedChallenges.push(challenge);
    }
  }

  return completedChallenges;
};

// Update daily streak
export const updateStreak = async (userId) => {
  const [userPoints] = await base44.entities.UserPoints.filter({ user_id: userId });
  const today = new Date().toISOString().split('T')[0];

  if (!userPoints) {
    return await base44.entities.UserPoints.create({
      user_id: userId,
      total_points: POINT_VALUES.daily_login,
      weekly_points: POINT_VALUES.daily_login,
      level: 1,
      streak_days: 1,
      last_active_date: today,
      badges: []
    });
  }

  const lastActive = userPoints.last_active_date;
  if (lastActive === today) return userPoints; // Already logged in today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  let bonusPoints = POINT_VALUES.daily_login;

  if (lastActive === yesterdayStr) {
    // Consecutive day - increase streak
    newStreak = (userPoints.streak_days || 0) + 1;
    bonusPoints += POINT_VALUES.streak_bonus * Math.min(newStreak, 7); // Cap streak bonus at 7 days
  }

  await base44.entities.UserPoints.update(userPoints.id, {
    streak_days: newStreak,
    last_active_date: today,
    total_points: (userPoints.total_points || 0) + bonusPoints,
    weekly_points: (userPoints.weekly_points || 0) + bonusPoints
  });

  return { ...userPoints, streak_days: newStreak };
};