import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Home, Briefcase, Users, Bell, User, MessageCircle, Settings, LogOut, BellRing } from 'lucide-react';
import NotificationBell from '@/components/alerts/NotificationBell';
import { cn } from '@/lib/utils';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // Check if user has a candidate or company profile
        const candidates = await base44.entities.Candidate.filter({ user_id: currentUser.id });
        const companies = await base44.entities.Company.filter({ user_id: currentUser.id });
        if (companies.length > 0) {
          setUserType('employer');
        } else if (candidates.length > 0) {
          setUserType('candidate');
        }
      } catch (e) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const hideLayout = ['Welcome', 'Onboarding', 'Chat', 'EmployerChat'].includes(currentPageName);

  if (hideLayout) {
    return <>{children}</>;
  }

  const candidateNav = [
        { name: 'Jobs', icon: Briefcase, page: 'SwipeJobs' },
        { name: 'Matches', icon: MessageCircle, page: 'Matches' },
        { name: 'Tests', icon: Users, page: 'SkillTests' },
        { name: 'Profile', icon: User, page: 'CandidateProfile' },
      ];

  const employerNav = [
        { name: 'Dashboard', icon: Home, page: 'EmployerDashboard' },
        { name: 'Candidates', icon: Users, page: 'SwipeCandidates' },
        { name: 'Jobs', icon: Briefcase, page: 'ManageJobs' },
        { name: 'Matches', icon: MessageCircle, page: 'EmployerMatches' },
        { name: 'Branding', icon: User, page: 'CompanyBranding' },
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
      `}</style>
      
      {/* Main Content */}
      <main className="pb-20 md:pb-0 md:ml-64">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 transition-colors",
                currentPageName === item.page 
                  ? "text-transparent" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon 
                className={cn(
                  "w-6 h-6 mb-1",
                  currentPageName === item.page && "stroke-[url(#gradient)]"
                )}
                style={currentPageName === item.page ? { stroke: '#FF005C' } : {}}
              />
              <span className={cn(
                "text-xs font-medium",
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
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}