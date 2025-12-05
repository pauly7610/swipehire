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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(() => {
    // Check if user has seen splash before in this session
    const hasSeenSplash = sessionStorage.getItem('swipehire_splash_seen');
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('swipehire_splash_seen', 'true');
    setShowSplash(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (authenticated) {
          const user = await base44.auth.me();
          // Check if user has completed onboarding
          const candidates = await base44.entities.Candidate.filter({ user_id: user.id });
          const companies = await base44.entities.Company.filter({ user_id: user.id });
          
          if (companies.length > 0) {
            navigate(createPageUrl('EmployerDashboard'));
          } else if (candidates.length > 0) {
            navigate(createPageUrl('SwipeJobs'));
          } else {
            navigate(createPageUrl('Onboarding'));
          }
        }
        setIsAuthenticated(authenticated);
      } catch (e) {
        console.log('Not authenticated');
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl('Onboarding'));
  };

  // Show splash first, before anything else
  if (showSplash) {
    return (
      <AnimatePresence>
        <SplashScreen onComplete={handleSplashComplete} />
      </AnimatePresence>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 rounded-full swipe-gradient animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-100 to-orange-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-100 to-pink-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2" />

        {/* Header */}
        <header className="relative z-10 p-6 md:p-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold swipe-gradient-text"
          >
            SwipeHire
          </motion.h1>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            {/* Animated Card Stack */}
            <div className="relative w-64 h-80 mx-auto mb-12">
              <motion.div
                animate={{ rotate: [-5, 5, -5], x: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-gray-100 -rotate-6 scale-95"
              />
              <motion.div
                animate={{ rotate: [3, -3, 3], x: [5, -5, 5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-gray-100 rotate-3 scale-97"
              />
              <div className="absolute inset-0 swipe-gradient rounded-3xl shadow-2xl flex flex-col items-center justify-center text-white p-6">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <Briefcase className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-2">Dream Job</h3>
                <p className="text-white/80 text-sm">Senior Developer • Remote</p>
                <p className="text-white/80 text-sm">$120k - $180k</p>
              </div>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-4"
          >
            Swipe Into Your
            <br />
            <span className="swipe-gradient-text">Next Opportunity</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-600 mb-8 max-w-md"
          >
            Jobs, People, Growth.
            <br />
            <span className="font-semibold text-gray-800">Swipe. Match. Interview. Hired.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={handleGetStarted}
              className="swipe-gradient text-white text-lg px-8 py-6 rounded-2xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all hover:scale-105"
            >
              Get Started
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-3 gap-8 mt-16 max-w-2xl"
          >
            {[
              { icon: Briefcase, label: 'Find Jobs', desc: 'Swipe through opportunities' },
              { icon: Users, label: 'Connect', desc: 'Match with employers' },
              { icon: Zap, label: 'Get Hired', desc: 'Land your dream role' },
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center mb-3">
                  <feature.icon className="w-7 h-7 text-pink-500" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{feature.label}</h4>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </main>
      </div>
    </div>
  );
}