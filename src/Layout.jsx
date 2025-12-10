import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, Briefcase, Users, Bell, User, MessageCircle, Settings, LogOut, BellRing, Search, Trophy, ArrowLeftRight, Heart, Star, Monitor, Home } from 'lucide-react';
import NotificationBell from '@/components/alerts/NotificationBell';
import { cn } from '@/lib/utils';
import RoleSelectionModal from '@/components/onboarding/RoleSelectionModal';
import { Badge } from '@/components/ui/badge';
import InterviewNotification from '@/components/interview/InterviewNotification';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [isRecruiter, setIsRecruiter] = useState(false); // true if user has company profile
  const [viewMode, setViewMode] = useState(null); // 'employer' or 'candidate'
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isMounted) return;
        
        if (!isAuth) {
          setUser(null);
          setLoading(false);
          return;
        }
        
        const currentUser = await base44.auth.me();
        if (!isMounted) return;
        
        setUser(currentUser);
        
        const [candidates, companies] = await Promise.all([
          base44.entities.Candidate.filter({ user_id: currentUser.id }),
          base44.entities.Company.filter({ user_id: currentUser.id })
        ]);
        
        if (!isMounted) return;

        const hasCompany = companies.length > 0 || currentUser.role === 'admin';
        const hasCandidate = candidates.length > 0;

        setIsRecruiter(hasCompany);

        // Check if user just completed onboarding - give grace period for DB to sync
        const justCompletedOnboarding = localStorage.getItem('swipehire_onboarding_complete');
        
        // If user has profile, clear the onboarding flag
        if (hasCompany || hasCandidate) {
          if (justCompletedOnboarding) {
            localStorage.removeItem('swipehire_onboarding_complete');
          }
        } else if (justCompletedOnboarding) {
          // Profile not found yet, but onboarding was completed - wait for DB sync
          // Don't redirect to onboarding
          return;
        }

        // Only redirect to onboarding if no profile AND not in onboarding flow
        if (!hasCompany && !hasCandidate && currentPageName !== 'Onboarding' && !justCompletedOnboarding) {
          navigate(createPageUrl('Onboarding'), { replace: true });
          return;
        }

        const savedViewMode = localStorage.getItem('swipehire_view_mode');
        if (hasCompany) {
          setUserType(savedViewMode || 'employer');
          setViewMode(savedViewMode || 'employer');
        } else if (hasCandidate) {
          setUserType('candidate');
          setViewMode('candidate');
        }

        const [unreadNotifs, unreadMessages] = await Promise.all([
          base44.entities.Notification.filter({ user_id: currentUser.id, is_read: false }),
          base44.entities.DirectMessage.filter({ receiver_id: currentUser.id, is_read: false })
        ]);
        
        if (!isMounted) return;
        setUnreadInboxCount(unreadNotifs.length + unreadMessages.length);
      } catch (e) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadUser();

    const interval = setInterval(async () => {
      try {
        const currentUser = await base44.auth.me();
        const [unreadNotifs, unreadMessages] = await Promise.all([
          base44.entities.Notification.filter({ user_id: currentUser.id, is_read: false }),
          base44.entities.DirectMessage.filter({ receiver_id: currentUser.id, is_read: false })
        ]);
        if (isMounted) {
          setUnreadInboxCount(unreadNotifs.length + unreadMessages.length);
        }
      } catch (e) {}
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentPageName, navigate]);

  const toggleViewMode = () => {
        const newMode = viewMode === 'employer' ? 'candidate' : 'employer';
        setViewMode(newMode);
        setUserType(newMode);
        localStorage.setItem('swipehire_view_mode', newMode);
        // Navigate to appropriate home page
        navigate(createPageUrl(newMode === 'employer' ? 'EmployerDashboard' : 'SwipeJobs'));
      };

      const handleRoleSelect = (role) => {
        setShowRoleSelection(false);
        // Store the selected role and navigate to onboarding
        localStorage.setItem('swipehire_selected_role', role);
        navigate(createPageUrl('Onboarding'));
      };

  const hideLayout = ['Welcome', 'Onboarding', 'Chat', 'EmployerChat'].includes(currentPageName);
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
              {currentPageName === 'Onboarding' && <RoleSelectionModal open={showRoleSelection} onSelect={handleRoleSelect} />}
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
            <Link to={createPageUrl('Welcome')} className="text-xl font-bold swipe-gradient bg-clip-text text-transparent">
              SwipeHire
            </Link>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => base44.auth.redirectToLogin()}>
                Login
              </Button>
              <Button className="swipe-gradient text-white" onClick={() => base44.auth.redirectToLogin(createPageUrl('Onboarding'))}>
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
              onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
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
            { name: 'Swipe', icon: Briefcase, page: 'SwipeJobs' },
            { name: 'Browse', icon: Search, page: 'BrowseJobs' },
            { name: 'Feed', icon: Home, page: 'VideoFeed' },
            { name: 'Inbox', icon: MessageCircle, page: 'CommunicationHub' },
            { name: 'Network', icon: Users, page: 'Connections' },
            { name: 'Profile', icon: User, page: 'CandidateProfile' },
          ];

  // Only show Admin to the specific admin email
  const isMainAdmin = user?.email === 'xmitchell99@gmail.com';
  
  const employerNav = [
                            { name: 'Dashboard', icon: LayoutDashboard, page: 'EmployerDashboard' },
                            { name: 'Browse', icon: Search, page: 'BrowseCandidates' },
                            { name: 'Swipe', icon: Users, page: 'SwipeCandidates' },
                            { name: 'Feed', icon: Home, page: 'VideoFeed' },
                            { name: 'Jobs', icon: Briefcase, page: 'ManageJobs' },
                            { name: 'ATS', icon: Monitor, page: 'ATS' },
                            { name: 'Profile', icon: User, page: 'RecruiterProfile' },
                            ...(isMainAdmin ? [{ name: 'Admin', icon: Settings, page: 'AdminPanel' }] : []),
                          ];

  const navItems = userType === 'employer' ? employerNav : candidateNav;

  return (
    <div className="min-h-screen bg-gray-50">
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex justify-around items-center h-14 px-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1.5 transition-colors relative",
                currentPageName === item.page 
                  ? "text-transparent" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className="relative">
                <item.icon 
                  className={cn(
                    "w-5 h-5 mb-0.5",
                    currentPageName === item.page && "stroke-[url(#gradient)]"
                  )}
                  style={currentPageName === item.page ? { stroke: '#FF005C' } : {}}
                />
                {item.page === 'CommunicationHub' && unreadInboxCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-pink-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadInboxCount > 9 ? '9+' : unreadInboxCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
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
                      <h1 className="text-2xl font-bold swipe-gradient-text">SwipeHire</h1>
                      <p className="text-xs text-gray-500 mt-1">Swipe. Match. Interview. Hired.</p>
                    </div>
                    <NotificationBell />
                  </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                currentPageName === item.page 
                  ? "swipe-gradient text-white shadow-lg shadow-pink-500/25" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
              {item.page === 'CommunicationHub' && unreadInboxCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
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
            onClick={() => base44.auth.logout()}
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
              </div>
              );
              }