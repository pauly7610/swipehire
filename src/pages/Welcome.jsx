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
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!mounted) return;
        
        if (isAuth) {
          const user = await base44.auth.me();
          if (!mounted) return;
          
          const [candidates, companies] = await Promise.all([
            base44.entities.Candidate.filter({ user_id: user.id }),
            base44.entities.Company.filter({ user_id: user.id })
          ]);
          
          if (!mounted) return;
          
          if (candidates.length > 0 || companies.length > 0) {
            const viewMode = companies.length > 0 ? 'employer' : 'candidate';
            localStorage.setItem('swipehire_view_mode', viewMode);
            navigate(createPageUrl(viewMode === 'employer' ? 'EmployerDashboard' : 'SwipeJobs'), { replace: true });
          } else {
            navigate(createPageUrl('Onboarding'), { replace: true });
          }
          return;
        }
      } catch (e) {
        console.error('Auth check error:', e);
      }
      
      if (mounted) {
        const splashSeen = sessionStorage.getItem('swipehire_splash_seen');
        setShowSplash(!splashSeen);
        setLoading(false);
      }
    };
    
    checkAuth();
    
    return () => {
      mounted = false;
    };
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

  // Sign In page
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 flex items-center justify-center p-4">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-center mb-4"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-2xl">
              <span className="text-white font-bold text-5xl">S</span>
            </div>
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-bold swipe-gradient-text mb-2"
          >
            SwipeHire
          </motion.h1>
          <p className="text-gray-600">Welcome back! Let's find your next opportunity.</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
          
          <div className="space-y-4">
            <Button
              onClick={async () => {
                try {
                  const nextUrl = window.location.origin;
                  await base44.auth.redirectToLogin(nextUrl);
                } catch (err) {
                  console.error('Login redirect failed:', err);
                  // Fallback to direct redirect
                  window.location.href = `/api/auth/login?next=${encodeURIComponent(window.location.origin)}`;
                }
              }}
              className="w-full swipe-gradient text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Continue with Email
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Button
              onClick={async () => {
                try {
                  const nextUrl = window.location.origin;
                  await base44.auth.redirectToLogin(nextUrl);
                } catch (err) {
                  console.error('Google login redirect failed:', err);
                  // Fallback to direct redirect
                  window.location.href = `/api/auth/login?next=${encodeURIComponent(window.location.origin)}`;
                }
              }}
              variant="outline"
              className="w-full py-6 text-lg font-semibold rounded-xl border-2 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            New to SwipeHire?{' '}
            <button
              onClick={async () => {
                try {
                  const nextUrl = createPageUrl('Onboarding');
                  await base44.auth.redirectToLogin(nextUrl);
                } catch (err) {
                  console.error('Signup redirect failed:', err);
                  window.location.href = `/api/auth/login?next=${encodeURIComponent(createPageUrl('Onboarding'))}`;
                }
              }}
              className="font-semibold swipe-gradient-text hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to SwipeHire's Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}