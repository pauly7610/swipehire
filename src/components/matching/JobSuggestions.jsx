import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Briefcase, MapPin, DollarSign, ChevronRight, Loader2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAIMatching } from './useAIMatching';

export default function JobSuggestions({ candidate }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState({});
  const { calculateMatchScore } = useAIMatching();

  useEffect(() => {
    if (candidate) {
      loadSuggestions();
    }
  }, [candidate]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const allJobs = await base44.entities.Job.filter({ is_active: true });
      const allCompanies = await base44.entities.Company.list();
      
      const companyMap = {};
      allCompanies.forEach(c => { companyMap[c.id] = c; });
      setCompanies(companyMap);

      // Calculate match scores for all jobs
      const scoredJobs = allJobs.map(job => {
        const company = companyMap[job.company_id];
        const { score, insights } = calculateMatchScore(candidate, job, company);
        return { job, company, score, insights };
      });

      // Sort by score and take top 5
      scoredJobs.sort((a, b) => b.score - a.score);
      setSuggestions(scoredJobs.slice(0, 5));
      setJobs(allJobs);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
    setLoading(false);
  };

  const formatSalary = (min, max) => {
    if (min && max) return `$${(min/1000).toFixed(0)}k - $${(max/1000).toFixed(0)}k`;
    if (min) return `$${(min/1000).toFixed(0)}k+`;
    return 'Competitive';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 65) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Suggested Jobs for You
        </CardTitle>
        <Link to={createPageUrl('SwipeJobs')}>
          <Button variant="ghost" size="sm" className="text-pink-600">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map(({ job, company, score, insights }, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl swipe-gradient flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{job.title}</h4>
                <p className="text-sm text-gray-500 truncate">{company?.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> {formatSalary(job.salary_min, job.salary_max)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getScoreColor(score)}`}>
                  {score}%
                </div>
                {insights[0] && (
                  <span className="text-xs text-gray-400 text-right max-w-[100px] truncate">
                    {insights[0].text}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>
    </Card>
  );
}