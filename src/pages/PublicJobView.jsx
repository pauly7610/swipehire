import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, MapPin, DollarSign, Clock, Building2, 
  Users, Globe, CheckCircle2, Loader2, Share2, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import QuickApplyModal from '@/components/candidate/QuickApplyModal';
import CompanyInsightCard from '@/components/insights/CompanyInsightCard';
import DayInLifePreview from '@/components/readiness/DayInLifePreview';
import FitConfidenceScore from '@/components/confidence/FitConfidenceScore';

export default function PublicJobView() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('id');
  
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    loadJob();
    checkAuth();
  }, [jobId]);

  const checkAuth = async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
        setCandidate(candidateData);
      }
    } catch (e) {
      setIsAuthenticated(false);
    }
  };

  const loadJob = async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    
    try {
      const [jobData] = await base44.entities.Job.filter({ id: jobId });
      setJob(jobData);
      
      if (jobData?.company_id) {
        const [companyData] = await base44.entities.Company.filter({ id: jobData.company_id });
        setCompany(companyData);
      }
    } catch (error) {
      console.error('Failed to load job:', error);
    }
    setLoading(false);
  };

  const handleApply = () => {
    if (isAuthenticated) {
      setShowApplyModal(true);
    } else {
      // Redirect to login with return URL
      base44.auth.redirectToLogin(`/PublicJobView?id=${jobId}`);
    }
  };

  const formatSalary = (min, max, type) => {
    if (!min && !max) return null;
    const format = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`;
    const typeLabel = type === 'yearly' ? '/year' : type === 'monthly' ? '/month' : '/hour';
    if (min && max) return `${format(min)} - ${format(max)}${typeLabel}`;
    if (min) return `From ${format(min)}${typeLabel}`;
    return `Up to ${format(max)}${typeLabel}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50">
        <Card className="p-8 text-center max-w-md">
          <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-500 mb-4">This job posting may have been removed or is no longer available.</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="swipe-gradient text-white">
            Browse All Jobs
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 dark:from-slate-950 dark:to-slate-900">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold swipe-gradient-text">SwipeHire</h1>
          {!isAuthenticated && (
            <Button variant="outline" onClick={() => base44.auth.redirectToLogin()}>
              Sign In
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Company Header */}
          <Card className="border-0 shadow-lg mb-6 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <div className="h-32 swipe-gradient" />
            <CardContent className="relative pt-0 pb-6">
              <div className="flex items-end gap-4 -mt-12">
                {company?.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt={company.name}
                    className="w-24 h-24 rounded-xl border-4 border-white shadow-lg object-cover bg-white"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl border-4 border-white shadow-lg bg-white flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 pb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300">{company?.name || 'Company'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Details */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Quick Info */}
              <Card className="border-0 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-4">
                    {job.location && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-5 h-5 text-pink-500" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.job_type && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-5 h-5 text-pink-500" />
                        <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                      </div>
                    )}
                    {formatSalary(job.salary_min, job.salary_max, job.salary_type) && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-5 h-5 text-pink-500" />
                        <span>{formatSalary(job.salary_min, job.salary_max, job.salary_type)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="border-0 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About the Role</h2>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{job.description}</p>
                </CardContent>
              </Card>

              {/* Responsibilities */}
              {job.responsibilities?.length > 0 && (
                <Card className="border-0 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Responsibilities</h2>
                    <ul className="space-y-2">
                      {job.responsibilities.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {job.requirements?.length > 0 && (
                <Card className="border-0 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requirements</h2>
                    <ul className="space-y-2">
                      {job.requirements.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600">
                          <CheckCircle2 className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {job.skills_required?.length > 0 && (
                <Card className="border-0 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills Required</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_required.map((skill, i) => (
                        <Badge key={i} className="bg-pink-100 text-pink-700">{skill}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Card */}
              <Card className="border-0 shadow-lg sticky top-4 dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-6">
                  <Button 
                    onClick={handleApply}
                    className="w-full swipe-gradient text-white text-lg py-6 mb-4"
                  >
                    {isAuthenticated ? 'Apply Now' : 'Sign Up to Apply'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  {!isAuthenticated && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                      Create a free account to apply for this job and discover more opportunities.
                    </p>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share Job
                  </Button>
                </CardContent>
              </Card>

              {/* Company Info */}
              {company && (
                <Card className="border-0 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">About {company.name}</h3>
                    {company.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{company.description}</p>
                    )}
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {company.industry && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span>{company.industry}</span>
                        </div>
                      )}
                      {company.size && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{company.size} employees</span>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-pink-600 dark:text-pink-400 hover:underline">
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              {job.benefits?.length > 0 && (
                <Card className="border-0 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Benefits</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.benefits.map((benefit, i) => (
                        <Badge key={i} variant="secondary">{benefit}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fit Confidence - Only for authenticated candidates */}
              {isAuthenticated && candidate && (
                <FitConfidenceScore candidate={candidate} job={job} />
              )}

              {/* Day in Life Preview */}
              <DayInLifePreview job={job} company={company} />

              {/* Company Insights */}
              <CompanyInsightCard companyId={company?.id} jobId={job.id} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <QuickApplyModal
          open={showApplyModal}
          onOpenChange={setShowApplyModal}
          job={job}
          company={company}
          candidate={candidate}
          user={user}
          onApply={async () => {
            setShowApplyModal(false);
            alert('Application submitted successfully!');
          }}
        />
      )}
    </div>
  );
}