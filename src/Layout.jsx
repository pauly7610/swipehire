import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';

import { Briefcase, User, MessageCircle, LogOut, Search, Home, TrendingUp, UserPlus, Sparkles, FileText } from 'lucide-react';
import NotificationBell from '@/components/alerts/NotificationBell';
import { cn } from '@/lib/utils';
import InterviewNotification from '@/components/interview/InterviewNotification';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shared/Logo';
import { usePageTracking } from '@/components/analytics/Analytics';
import EmailScheduler from '@/components/email/EmailScheduler';
import NotificationHandler from '@/components/alerts/NotificationHandler';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import ThemeToggle from '@/components/theme/ThemeToggle';
import audioFeedback from '@/components/shared/AudioFeedback';
import ErrorLogger from '@/components/debugging/ErrorLogger';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';
import { useClerkAuth } from '@/components/auth/ClerkAuthProvider';

          export default function Layout({ children, currentPageName }) {
  const { user, isLoadingAuth, logout } = useClerkAuth();
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const navigate = useNavigate();

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = () => {
      audioFeedback.init();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const hideLayout = ['Welcome', 'Onboarding', 'OnboardingWizard', 'Chat'].includes(currentPageName);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 animate-pulse" />
      </div>
    );
  }

  if (hideLayout) {
    return children;
  }

  if (!user && currentPageName !== 'Welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 mx-auto mb-4 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to continue</p>
            <Button 
              onClick={() => navigate(createPageUrl('Welcome'))}
              className="w-full swipe-gradient text-white"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems = [
    { name: 'Discover', icon: Sparkles, page: 'MinimalSwipeJobs', mobile: true },
    { name: 'Swipe', icon: Briefcase, page: 'SwipeJobs', mobile: false },
    { name: 'Browse', icon: Search, page: 'BrowseJobs', mobile: false },
    { name: 'Applications', icon: FileText, page: 'ApplicationDashboard', mobile: true },
    { name: 'Feed', icon: Home, page: 'VideoFeed', mobile: true },
    { name: 'Network', icon: UserPlus, page: 'Connections', mobile: false },
    { name: 'Prep', icon: TrendingUp, page: 'InterviewPrep', mobile: false },
    { name: 'Inbox', icon: MessageCircle, page: 'CommunicationHub', mobile: true },
    { name: 'Profile', icon: User, page: 'CandidateProfile', mobile: true },
  ];

  return (
    <ThemeProvider>
    <ErrorLogger />
    <AuthErrorBoundary>
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <style>{`
        :root {
                        --swipe-gradient: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
                        --swipe-pink: #FF005C;
                        --swipe-orange: #FF7B00;
                      }
                      .swipe-gradient {
                        background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
                      }
                      .swipe-gradient-text {
                        background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                      }
                      button:active:not(:disabled), 
                      .btn-active:active:not(:disabled) {
                        background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%) !important;
                        color: white !important;
                      }
      `}</style>
      
      {/* Main Content */}
      <main className="pb-20 md:pb-0 md:ml-64">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 md:hidden z-50 shadow-lg">
        <div className="flex justify-around items-center h-16 px-1">
          {navItems.filter(item => item.mobile !== false).map((item) => (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200 relative rounded-lg active:scale-95",
                currentPageName === item.page 
                  ? "text-transparent scale-110" 
                  : "text-gray-400 hover:text-gray-600 active:bg-gray-100"
              )}
            >
              <div className="relative">
                <item.icon 
                  className={cn(
                    "w-6 h-6 mb-1 transition-transform",
                    currentPageName === item.page && "stroke-[url(#gradient)]"
                  )}
                  style={currentPageName === item.page ? { stroke: '#FF005C' } : {}}
                />
                {item.page === 'CommunicationHub' && unreadInboxCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-pink-500 text-white text-[10px] rounded-full flex items-center justify-center animate-bounce">
                    {unreadInboxCount > 9 ? '9+' : unreadInboxCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-semibold",
                currentPageName === item.page && "swipe-gradient-text"
              )}>
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex-col z-50">
        <div className="p-6 flex items-center justify-between">
                    <div>
                      <Logo size="md" />
                      <p className="text-xs text-gray-500 mt-2">Swipe. Match. Hired.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <NotificationBell />
                    </div>
                  </div>
        
        <nav className="flex-1 px-4 space-y-1.5 py-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                currentPageName === item.page 
                  ? "swipe-gradient text-white shadow-lg shadow-pink-500/30 scale-[1.02]" 
                  : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.name}</span>
              {item.page === 'CommunicationHub' && unreadInboxCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadInboxCount > 9 ? '9+' : unreadInboxCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {user && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full swipe-gradient flex items-center justify-center text-white font-semibold">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={async () => {
              try {
                localStorage.removeItem('onboarding_draft_v2');
                await logout();
                navigate('/sign-in');
              } catch (err) {
                console.error('Logout failed:', err);
              }
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

              {/* Interview Notifications */}
              {!hideLayout && <InterviewNotification />}

              {/* Email Scheduler - runs in background */}
              {!hideLayout && user && <EmailScheduler />}

              {/* Notification Deep Link Handler */}
              <NotificationHandler />
              </div>
              </AuthErrorBoundary>
              </ThemeProvider>
              );
              }