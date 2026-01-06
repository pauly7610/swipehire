import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, Briefcase, Users, Bell, User, MessageCircle, Settings, LogOut, BellRing, Search, Trophy, ArrowLeftRight, Heart, Star, Monitor, Home, TrendingUp, UserPlus, Sparkles, FileText } from 'lucide-react';
import NotificationBell from '@/components/alerts/NotificationBell';
import { cn } from '@/lib/utils';
import RoleSelectionModal from '@/components/onboarding/RoleSelectionModal';
import { Badge } from '@/components/ui/badge';
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

            export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [isRecruiter, setIsRecruiter] = useState(false); // true if user has company profile
  const [viewMode, setViewMode] = useState(null); // 'employer' or 'candidate'
  const [showRoleSelection, setShowRoleSelection] = useState(false);
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

  useEffect(() => {
    let isMounted = true;
    let notificationInterval = null;

    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isMounted) return;

        if (!isAuth) {
          console.log('[Layout] Not authenticated');
          setUser(null);
          setLoading(false);
          return;
        }

        const currentUser = await base44.auth.me();
        if (!isMounted) return;

        console.log('[Layout] User loaded:', currentUser.email);
        setUser(currentUser);

        const [candidates, companies] = await Promise.all([
          base44.entities.Candidate.filter({ user_id: currentUser.id }),
          base44.entities.Company.filter({ user_id: currentUser.id })
        ]);

        if (!isMounted) return;

        const hasCompany = companies.length > 0 || currentUser.role === 'admin';
        const hasCandidate = candidates.length > 0;

        setIsRecruiter(hasCompany);

        const savedViewMode = localStorage.getItem('swipehire_view_mode');
        if (hasCompany) {
          setUserType(savedViewMode || 'employer');
          setViewMode(savedViewMode || 'employer');
        } else if (hasCandidate) {
          setUserType('candidate');
          setViewMode('candidate');
        }

        // Only redirect if no profile exists and not already on onboarding or welcome
        if (!hasCompany && !hasCandidate && !['Onboarding', 'Welcome', 'OnboardingWizard'].includes(currentPageName)) {
          navigate(createPageUrl('Onboarding'), { replace: true });
          return;
        }

        try {
          const [unreadNotifs, unreadMessages] = await Promise.all([
            base44.entities.Notification.filter({ user_id: currentUser.id, is_read: false }),
            base44.entities.DirectMessage.filter({ receiver_id: currentUser.id, is_read: false })
          ]);

          if (!isMounted) return;
          setUnreadInboxCount(unreadNotifs.length + unreadMessages.length);
        } catch (notifError) {
          console.error('[Layout] Error loading notifications:', notifError);
        }
      } catch (e) {
        console.error('[Layout] Auth error:', e);
        
        // CRITICAL: Only clear session on explicit 401/403 auth failures
        // Network errors, timeouts, 500s should NOT log user out
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          console.warn('[Layout] Explicit auth failure - clearing user');
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        } else {
          // Keep user logged in for network/server errors
          console.log('[Layout] Temporary error, preserving session');
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    // Start periodic notification checks only after user is loaded
    const startNotificationPolling = (userId) => {
      notificationInterval = setInterval(async () => {
        try {
          const [unreadNotifs, unreadMessages] = await Promise.all([
            base44.entities.Notification.filter({ user_id: userId, is_read: false }),
            base44.entities.DirectMessage.filter({ receiver_id: userId, is_read: false })
          ]);
          if (isMounted) {
            setUnreadInboxCount(unreadNotifs.length + unreadMessages.length);
          }
        } catch (e) {
          // Silently fail for notification polling
        }
      }, 30000); // Reduced to 30 seconds
    };

    loadUser().then(() => {
      if (isMounted && user?.id) {
        startNotificationPolling(user.id);
      }
    });

    return () => {
      isMounted = false;
      if (notificationInterval) {
        clearInterval(notificationInterval);
      }
    };
  }, [currentPageName, navigate]);

  const toggleViewMode = async () => {
      const newMode = viewMode === 'employer' ? 'candidate' : 'employer';

      // Check if user has the required profile for the new mode
      if (newMode === 'candidate') {
        const candidates = await base44.entities.Candidate.filter({ user_id: user.id });
        if (candidates.length === 0) {
          // User doesn't have a candidate profile, redirect to onboarding
          localStorage.setItem('swipehire_selected_role', 'candidate');
          navigate(createPageUrl('Onboarding'));
          return;
        }
      }

      setViewMode(newMode);
      setUserType(newMode);
      localStorage.setItem('swipehire_view_mode', newMode);
      navigate(createPageUrl(newMode === 'employer' ? 'EmployerDashboard' : 'SwipeJobs'));
    };

      const handleRoleSelect = (role) => {
        setShowRoleSelection(false);
        // Store the selected role and navigate to onboarding
        localStorage.setItem('swipehire_selected_role', role);
        navigate(createPageUrl('Onboarding'));
      };

  const hideLayout = ['Welcome', 'Onboarding', 'OnboardingWizard', 'Chat', 'EmployerChat'].includes(currentPageName);
  const publicPages = ['Welcome', 'Onboarding', 'BrowseJobs', 'PublicJobView', 'CompanyProfile', 'VideoFeed', 'BrowseCandidates', 'ViewCandidateProfile'];

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 animate-pulse" />
      </div>
    );
  }

  if (hideLayout) {
          return (
            <>
              {children}
              {(currentPageName === 'Onboarding' || currentPageName === 'OnboardingWizard') && <RoleSelectionModal open={showRoleSelection} onSelect={handleRoleSelect} />}
            </>
          );
        }

  // For public pages, show simplified navigation without login
  if (!user && publicPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <style>{`
          .swipe-gradient {
            background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          }
        `}</style>

        {/* Simple header for public pages */}
        <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to={createPageUrl('Welcome')}>
              <Logo size="sm" />
            </Link>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => {
                try {
                  base44.auth.redirectToLogin(window.location.pathname);
                } catch (err) {
                  window.location.href = '/api/auth/login';
                }
              }}>
                Login
              </Button>
              <Button className="swipe-gradient text-white" onClick={() => {
                try {
                  base44.auth.redirectToLogin(createPageUrl('Onboarding'));
                } catch (err) {
                  window.location.href = '/api/auth/login?next=' + encodeURIComponent(createPageUrl('Onboarding'));
                }
              }}>
                Sign Up
              </Button>
            </div>
          </div>
        </header>

        <main className="pt-16">
          {children}
        </main>
      </div>
    );
  }

  // Show login prompt for protected pages
  if (!user && !publicPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 mx-auto mb-4 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to access this feature</p>
            <Button 
              onClick={() => {
                try {
                  const nextUrl = window.location.pathname + window.location.search;
                  base44.auth.redirectToLogin(nextUrl);
                } catch (err) {
                  console.error('Login redirect failed:', err);
                  window.location.href = '/api/auth/login?next=' + encodeURIComponent(window.location.pathname);
                }
              }}
              className="w-full swipe-gradient text-white"
            >
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const candidateNav = [
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
  const candidateNav = [
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
  const candidateNav = [
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
  const candidateNav = [
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
  const candidateNav = [
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
  const candidateNav = [
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
  const candidateNav = [
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
  const candidateNav = [
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
  const candidateNav = [
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

  const employerNav = [
                                    { name: 'Dashboard', icon: LayoutDashboard, page: 'EmployerDashboard', mobile: true },
                                    { name: 'Browse', icon: Search, page: 'BrowseCandidates', mobile: false },
                                    { name: 'Swipe', icon: Users, page: 'SwipeCandidates', mobile: true },
                                    { name: 'Feed', icon: Home, page: 'VideoFeed', mobile: false },
                                    { name: 'Inbox', icon: MessageCircle, page: 'CommunicationHub', mobile: true },
                                    { name: 'Network', icon: Users, page: 'Connections', mobile: false },
                                    { name: 'Jobs', icon: Briefcase, page: 'ManageJobs', mobile: false },
                                    { name: 'ATS', icon: Monitor, page: 'ATS', mobile: true },
                                    { name: 'Profile', icon: User, page: 'RecruiterProfile', mobile: true },
                                    ...(user?.role === 'admin' ? [{ name: 'Admin', icon: Settings, page: 'AdminPanel', mobile: false }] : []),
                                  ];

  const navItems = userType === 'employer' ? employerNav : candidateNav;

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
          {/* View Mode Toggle - Only for recruiters */}
          {isRecruiter && (
            <button
              onClick={toggleViewMode}
              className="flex items-center gap-3 px-4 py-3 w-full mb-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-all"
            >
              <ArrowLeftRight className="w-5 h-5 text-purple-500" />
              <div className="flex-1 text-left">
                <span className="font-medium text-gray-700">Switch to {viewMode === 'employer' ? 'Candidate' : 'Recruiter'}</span>
                <p className="text-xs text-gray-500">Currently: {viewMode === 'employer' ? 'Recruiter' : 'Candidate'} View</p>
              </div>
            </button>
          )}
          
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
            onClick={() => {
              try {
                localStorage.removeItem('swipehire_user');
                localStorage.removeItem('swipehire_view_mode');
                base44.auth.logout(createPageUrl('Welcome'));
              } catch (err) {
                console.error('Logout failed:', err);
                localStorage.clear();
                window.location.href = '/';
              }
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

              {/* Role Selection Modal for new users */}
              <RoleSelectionModal open={showRoleSelection} onSelect={handleRoleSelect} />

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