import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Sparkles, MapPin, Briefcase, Building2, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FollowCompanyButton from './FollowCompanyButton';

export default function RecommendedConnections({ candidate, userId, userType = 'candidate' }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (candidate) {
      generateRecommendations();
    }
  }, [candidate]);

  const generateRecommendations = async () => {
    try {
      if (userType === 'candidate') {
        // Recommend companies based on candidate's skills and preferences
        const companies = await base44.entities.Company.list();
        const jobs = await base44.entities.Job.filter({ is_active: true });
        
        const scoredCompanies = companies.map(company => {
          let score = 0;
          const companyJobs = jobs.filter(j => j.company_id === company.id);
          
          // Match skills
          companyJobs.forEach(job => {
            const matchingSkills = (job.skills_required || []).filter(
              skill => candidate.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
            );
            score += matchingSkills.length * 10;
          });

          // Match culture preferences
          const cultureMatch = (company.culture_traits || []).filter(
            trait => candidate.culture_preferences?.includes(trait)
          );
          score += cultureMatch.length * 5;

          // Match location
          if (company.location && candidate.location && 
              company.location.toLowerCase().includes(candidate.location.toLowerCase())) {
            score += 15;
          }

          // Has active jobs
          if (companyJobs.length > 0) {
            score += 10;
          }

          return { ...company, score, jobCount: companyJobs.length, matchingTraits: cultureMatch };
        });

        const topCompanies = scoredCompanies
          .filter(c => c.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        setRecommendations(topCompanies);
      }
    } catch (err) {
      console.error('Error generating recommendations:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Recommended Companies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((company) => (
          <div 
            key={company.id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-pink-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link to={createPageUrl('CompanyProfile') + `?companyId=${company.id}`}>
                <h4 className="font-medium text-gray-900 hover:text-pink-500 transition-colors truncate">
                  {company.name}
                </h4>
              </Link>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {company.location}
                  </span>
                )}
                {company.jobCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {company.jobCount} jobs
                  </span>
                )}
              </div>
              {company.matchingTraits?.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {company.matchingTraits.slice(0, 2).map(trait => (
                    <Badge key={trait} variant="secondary" className="text-xs px-1.5 py-0">
                      {trait}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <FollowCompanyButton 
              companyId={company.id}
              candidateId={candidate?.id}
              userId={userId}
              variant="outline"
              size="sm"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}