import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Briefcase, DollarSign, TrendingUp, Eye, 
  CheckCircle2, Clock, X, Gift, FileText, Loader2, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Referrals() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [receivedReferrals, setReceivedReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, hired: 0, pending: 0, earnings: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Determine user type
      const [candidates, companies] = await Promise.all([
        base44.entities.Candidate.filter({ user_id: currentUser.id }),
        base44.entities.Company.filter({ user_id: currentUser.id })
      ]);

      const isRecruiter = companies.length > 0;
      setUserType(isRecruiter ? 'recruiter' : 'candidate');

      // Load referrals made by this user
      const myReferrals = await base44.entities.Referral.filter({ referrer_id: currentUser.id }, '-created_date');
      
      // Load jobs and companies for context
      const jobIds = [...new Set(myReferrals.map(r => r.job_id))];
      const companyIds = [...new Set(myReferrals.map(r => r.company_id))];
      
      const [jobs, companiesData] = await Promise.all([
        Promise.all(jobIds.map(id => base44.entities.Job.filter({ id }).then(j => j[0]))),
        Promise.all(companyIds.map(id => base44.entities.Company.filter({ id }).then(c => c[0])))
      ]);

      const jobsMap = {};
      jobs.forEach(j => { if (j) jobsMap[j.id] = j; });
      
      const companiesMap = {};
      companiesData.forEach(c => { if (c) companiesMap[c.id] = c; });

      const referralsWithContext = myReferrals.map(r => ({
        ...r,
        job: jobsMap[r.job_id],
        company: companiesMap[r.company_id]
      }));

      setReferrals(referralsWithContext);

      // Calculate stats
      const hired = referralsWithContext.filter(r => r.status === 'hired').length;
      const pending = referralsWithContext.filter(r => r.status === 'pending').length;
      const earnings = referralsWithContext
        .filter(r => r.reward_status === 'paid')
        .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

      setStats({
        total: referralsWithContext.length,
        hired,
        pending,
        earnings
      });

      // If recruiter, load referrals for their company
      if (isRecruiter && companies[0]) {
        const companyReferrals = await base44.entities.Referral.filter(
          { company_id: companies[0].id },
          '-created_date'
        );

        const referralJobIds = [...new Set(companyReferrals.map(r => r.job_id))];
        const referralJobs = await Promise.all(
          referralJobIds.map(id => base44.entities.Job.filter({ id }).then(j => j[0]))
        );

        const referralJobsMap = {};
        referralJobs.forEach(j => { if (j) referralJobsMap[j.id] = j; });

        const received = companyReferrals.map(r => ({
          ...r,
          job: referralJobsMap[r.job_id]
        }));

        setReceivedReferrals(received);
      }
    } catch (error) {
      console.error('Failed to load referrals:', error);
    }
    setLoading(false);
  };

  const updateReferralStatus = async (referralId, status) => {
    try {
      await base44.entities.Referral.update(referralId, { status });
      
      // If hired, mark reward as eligible
      if (status === 'hired') {
        await base44.entities.Referral.update(referralId, { reward_status: 'eligible' });
      }
      
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      reviewed: 'bg-blue-100 text-blue-700',
      interviewing: 'bg-purple-100 text-purple-700',
      hired: 'bg-green-100 text-green-700',
      rejected: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 pt-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="text-sm text-gray-600">Earn rewards</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Total Referrals</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Hired</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">{stats.hired}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Pending</p>
                  <p className="text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Earnings</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">${stats.earnings}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-referrals" className="space-y-4">
          <TabsList className="w-full md:w-auto bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="my-referrals" className="flex-1 md:flex-none text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
              My Referrals
            </TabsTrigger>
            {userType === 'recruiter' && (
              <TabsTrigger value="received" className="flex-1 md:flex-none text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF005C] data-[state=active]:to-[#FF7B00] data-[state=active]:text-white rounded-lg">
                Received ({receivedReferrals.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* My Referrals */}
          <TabsContent value="my-referrals" className="space-y-3 md:space-y-4">
            {referrals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">No referrals yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Start referring candidates to earn rewards!</p>
                  <Link to={createPageUrl('BrowseJobs')}>
                    <Button className="swipe-gradient text-white">
                      Browse Jobs to Refer
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              referrals.map((referral) => (
                <Card key={referral.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-base md:text-lg text-gray-900">
                              {referral.candidate_name}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500">{referral.candidate_email}</p>
                          </div>
                          <Badge className={getStatusColor(referral.status)}>
                            {referral.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {referral.job?.title} at {referral.company?.name}
                          </span>
                        </div>

                        {referral.message && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-gray-600 italic">"{referral.message}"</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {referral.resume_url && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" /> Resume attached
                            </Badge>
                          )}
                          {referral.reward_amount > 0 && (
                            <Badge className={
                              referral.reward_status === 'paid' ? 'bg-green-100 text-green-700' :
                              referral.reward_status === 'eligible' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              <Gift className="w-3 h-3 mr-1" />
                              ${referral.reward_amount} {referral.reward_status === 'paid' ? 'Paid' : referral.reward_status === 'eligible' ? 'Eligible' : 'Pending'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Received Referrals (Recruiter Only) */}
          {userType === 'recruiter' && (
            <TabsContent value="received" className="space-y-3 md:space-y-4">
              {receivedReferrals.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Mail className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No referrals received yet</p>
                  </CardContent>
                </Card>
              ) : (
                receivedReferrals.map((referral) => (
                  <Card key={referral.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-base md:text-lg text-gray-900">
                                {referral.candidate_name}
                              </h3>
                              <p className="text-xs md:text-sm text-gray-500">{referral.candidate_email}</p>
                            </div>
                            <Badge className={getStatusColor(referral.status)}>
                              {referral.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{referral.job?.title}</span>
                          </div>

                          {referral.message && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-600 italic">"{referral.message}"</p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mb-3">
                            {referral.resume_url && (
                              <a href={referral.resume_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  <FileText className="w-4 h-4 mr-1" /> View Resume
                                </Button>
                              </a>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {referral.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateReferralStatus(referral.id, 'reviewed')}
                                className="swipe-gradient text-white"
                              >
                                <Eye className="w-4 h-4 mr-1" /> Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateReferralStatus(referral.id, 'rejected')}
                              >
                                <X className="w-4 h-4 mr-1" /> Not a fit
                              </Button>
                            </div>
                          )}
                          {referral.status === 'reviewed' && (
                            <Button
                              size="sm"
                              onClick={() => updateReferralStatus(referral.id, 'interviewing')}
                              className="swipe-gradient text-white"
                            >
                              Move to Interview
                            </Button>
                          )}
                          {referral.status === 'interviewing' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateReferralStatus(referral.id, 'hired')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Hire
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateReferralStatus(referral.id, 'rejected')}
                              >
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}