import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, BarChart3 } from 'lucide-react';
import HiringMetrics from '@/components/analytics/HiringMetrics';
import JobPerformanceChart from '@/components/analytics/JobPerformanceChart';
import TopJobsTable from '@/components/analytics/TopJobsTable';
import AIRecommendations from '@/components/analytics/AIRecommendations';

export default function EmployerAnalytics() {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [swipes, setSwipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [companyData] = await base44.entities.Company.filter({ user_id: user.id });
      
      if (companyData) {
        setCompany(companyData);
        
        const [companyJobs, companyMatches, companyInterviews, allSwipes] = await Promise.all([
          base44.entities.Job.filter({ company_id: companyData.id }),
          base44.entities.Match.filter({ company_id: companyData.id }),
          base44.entities.Interview.filter({ company_id: companyData.id }),
          base44.entities.Swipe.filter({ swiper_type: 'employer' })
        ]);
        
        setJobs(companyJobs);
        setMatches(companyMatches);
        setInterviews(companyInterviews);
        setSwipes(allSwipes.filter(s => companyJobs.some(j => j.id === s.job_id)));
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-pink-500" />
              Hiring Analytics
            </h1>
            <p className="text-gray-500 mt-1">Track performance and get AI-powered insights</p>
          </div>
        </div>

        {/* Key Metrics */}
        <HiringMetrics jobs={jobs} matches={matches} interviews={interviews} />

        {/* Charts */}
        <JobPerformanceChart jobs={jobs} matches={matches} swipes={swipes} />

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <TopJobsTable jobs={jobs} matches={matches} />
          <AIRecommendations company={company} jobs={jobs} matches={matches} interviews={interviews} />
        </div>
      </div>
    </div>
  );
}