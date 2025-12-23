import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPageParams } from '@/components/utils/linkBuilder';

/**
 * Handles navigation from notification deep links
 * Place this component in Layout or top-level pages
 */
export default function NotificationHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = getPageParams();
    
    // Handle various deep link scenarios
    if (params.matchId && !window.location.pathname.includes('chat')) {
      // Navigate to appropriate chat based on user type
      const viewMode = localStorage.getItem('swipehire_view_mode');
      const chatPage = viewMode === 'employer' ? 'EmployerChat' : 'Chat';
      navigate(`/${chatPage.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}?matchId=${params.matchId}`, { replace: true });
    } else if (params.jobId && window.location.pathname === '/swipe-jobs') {
      // Let SwipeJobs page handle jobId param
      return;
    } else if (params.candidateId && window.location.pathname.includes('view-candidate-profile')) {
      // Let ViewCandidateProfile page handle candidateId
      return;
    }
  }, [navigate]);

  return null;
}