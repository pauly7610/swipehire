import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ApplicationDashboard from '@/components/applications/ApplicationDashboard';

/**
 * Application Dashboard Page
 * Wrapper page for the ApplicationDashboard component
 */
export default function ApplicationDashboardPage() {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCandidate();
  }, []);

  const loadCandidate = async () => {
    try {
      const user = await base44.auth.me();
      const [candidateData] = await base44.entities.Candidate.filter({ user_id: user.id });

      if (!candidateData) {
        navigate(createPageUrl('Onboarding'), { replace: true });
        return;
      }

      setCandidate(candidateData);
    } catch (error) {
      console.error('Failed to load candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 animate-pulse" />
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  return <ApplicationDashboard candidateId={candidate.id} />;
}