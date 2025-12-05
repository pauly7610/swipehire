import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Users, Zap, ChevronRight } from 'lucide-react';
import SplashScreen from '@/components/splash/SplashScreen';

export default function Welcome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Check splash and auth on mount
  useEffect(() => {
    const init = async () => {
      // Check if splash was already seen this session
      const splashSeen = sessionStorage.getItem('swipehire_splash_seen');
      
      if (!splashSeen) {
        // Show splash first
        setShowSplash(true);
        setLoading(false);
        return;
      }

      // Splash was seen, check auth status
      setShowSplash(false);
      
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (authenticated) {
          const user = await base44.auth.me();
          const [candidates, companies] = await Promise.all([
            base44.entities.Candidate.filter({ user_id: user.id }),
            base44.entities.Company.filter({ user_id: user.id })
          ]);
          
          if (companies.length > 0) {
            navigate(createPageUrl('EmployerDashboard'), { replace: true });
          } else if (candidates.length > 0) {
            navigate(createPageUrl('SwipeJobs'), { replace: true });
          } else {
            navigate(createPageUrl('Onboarding'), { replace: true });
          }
          return;
        }
      } catch (e) {
        // Not authenticated, continue to show welcome
      }
      setLoading(false);
    };
    
    init();
  }, [navigate]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('swipehire_splash_seen', 'true');
    // Go directly to login/onboarding
    base44.auth.redirectToLogin(createPageUrl('Onboarding'));
  };

  // Show splash FIRST if not seen yet
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 rounded-full swipe-gradient animate-pulse" />
      </div>
    );
  }

  // If splash was already seen, redirect to login
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>
      <div className="w-16 h-16 rounded-full swipe-gradient animate-pulse" />
    </div>
  );
}