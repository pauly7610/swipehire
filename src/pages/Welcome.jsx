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
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          const [candidates, companies] = await Promise.all([
            base44.entities.Candidate.filter({ user_id: user.id }),
            base44.entities.Company.filter({ user_id: user.id })
          ]);
          
          const hasProfile = candidates.length > 0 || companies.length > 0;
          if (hasProfile) {
            const viewMode = companies.length > 0 ? 'employer' : 'candidate';
            navigate(createPageUrl(viewMode === 'employer' ? 'EmployerDashboard' : 'SwipeJobs'), { replace: true });
            return;
          } else {
            navigate(createPageUrl('Onboarding'), { replace: true });
            return;
          }
        }
      } catch (e) {
        // Not logged in, continue to welcome
      }
      
      // Check if splash was already seen
      const splashSeen = sessionStorage.getItem('swipehire_splash_seen');
      setShowSplash(!splashSeen);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('swipehire_splash_seen', 'true');
    setShowSplash(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 animate-pulse" />
      </div>
    );
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-2xl font-bold swipe-gradient bg-clip-text text-transparent">SwipeHire</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => base44.auth.redirectToLogin()}>
              Login
            </Button>
            <Button className="swipe-gradient text-white" onClick={() => base44.auth.redirectToLogin(createPageUrl('Onboarding'))}>
              Sign Up
            </Button>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl swipe-gradient flex items-center justify-center">
                <span className="text-white font-bold text-2xl">SH</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold swipe-gradient bg-clip-text text-transparent">
                SwipeHire
              </h2>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your Dream Job With a Swipe
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The modern way to match with opportunities. Swipe right on jobs you love, get matched with companies, and land interviews faster.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                className="swipe-gradient text-white px-8 py-6 text-lg"
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Onboarding'))}
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl swipe-gradient flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Matching</h3>
            <p className="text-gray-600">Swipe right on jobs you like. When companies swipe back, it's an instant match!</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl swipe-gradient flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thousands of Jobs</h3>
            <p className="text-gray-600">Browse opportunities from startups to Fortune 500 companies, all in one place.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-2xl shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl swipe-gradient flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Video Profiles</h3>
            <p className="text-gray-600">Stand out with video introductions and show your personality beyond the resume.</p>
          </motion.div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl mx-auto"
          >
            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-gray-600 mb-6">Join thousands of job seekers finding their perfect match</p>
            <Button 
              className="swipe-gradient text-white px-8 py-6 text-lg"
              onClick={() => base44.auth.redirectToLogin(createPageUrl('Onboarding'))}
            >
              Create Free Account <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}