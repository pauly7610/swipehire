import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, MapPin, Globe, Users, Calendar, Briefcase,
  Play, Image, Quote, Heart, ExternalLink, Linkedin, Twitter,
  Loader2, CheckCircle, Star, Sparkles, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import CompanyMediaGallery from '@/components/company/CompanyMediaGallery';
import CompanyTeamSection from '@/components/company/CompanyTeamSection';
import CompanyJobsList from '@/components/company/CompanyJobsList';
import FollowCompanyButton from '@/components/networking/FollowCompanyButton';

export default function CompanyProfile() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('id');
  
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwnCompany, setIsOwnCompany] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Load candidate profile for follow functionality
      const [candidateData] = await base44.entities.Candidate.filter({ user_id: user.id });
      setCandidate(candidateData);
      
      let companyData;
      if (companyId) {
        companyData = await base44.entities.Company.filter({ id: companyId });
        companyData = companyData[0];
      } else {
        const [ownCompany] = await base44.entities.Company.filter({ user_id: user.id });
        companyData = ownCompany;
        setIsOwnCompany(true);
      }

      if (companyData) {
        setCompany(companyData);
        const companyJobs = await base44.entities.Job.filter({ company_id: companyData.id, is_active: true });
        setJobs(companyJobs);
        
        if (companyData.user_id === user.id) {
          setIsOwnCompany(true);
        }
      }
    } catch (error) {
      console.error('Failed to load company:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Building2 className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Company Not Found</h2>
        <p className="text-gray-500 mb-4">This company profile doesn't exist.</p>
        <Link to={createPageUrl('SwipeJobs')}>
          <Button className="swipe-gradient text-white">Browse Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <style>{`
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-pink-500 to-orange-500">
        {company.cover_image_url ? (
          <img src={company.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Company Header */}
        <div className="relative -mt-20 mb-6">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                {/* Logo */}
                <div className="-mt-16 md:-mt-20">
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={company.name} 
                      className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white shadow-lg bg-white"
                    />
                  ) : (
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl swipe-gradient flex items-center justify-center border-4 border-white shadow-lg">
                      <Building2 className="w-14 h-14 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{company.name}</h1>
                      <p className="text-gray-600">{company.industry}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        {company.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {company.location}
                          </span>
                        )}
                        {company.size && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {company.size} employees
                          </span>
                        )}
                        {company.founded_year && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> Founded {company.founded_year}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Globe className="w-4 h-4 mr-1" /> Website
                          </Button>
                        </a>
                      )}
                      {company.linkedin_url && (
                        <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon">
                            <Linkedin className="w-5 h-5 text-blue-600" />
                          </Button>
                        </a>
                      )}
                      {isOwnCompany ? (
                        <Link to={createPageUrl('CompanyBranding')}>
                          <Button className="swipe-gradient text-white">Edit Profile</Button>
                        </Link>
                      ) : candidate && (
                        <FollowCompanyButton 
                          companyId={company.id}
                          candidateId={candidate.id}
                          userId={currentUser?.id}
                          variant="default"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="bg-white rounded-xl p-1 shadow-sm w-full justify-start overflow-x-auto">
            <TabsTrigger value="about" className="data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              About
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Jobs ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="culture" className="data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Culture
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Team
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:swipe-gradient data-[state=active]:text-white rounded-lg">
              Life Here
            </TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            {/* Description */}
            {company.description && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About Us</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{company.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Mission */}
            {company.mission && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-pink-50 to-orange-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-pink-500" /> Our Mission
                  </h3>
                  <p className="text-gray-700 text-lg italic">"{company.mission}"</p>
                </CardContent>
              </Card>
            )}

            {/* Values */}
            {company.values?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Values</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.values.map((value, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-gray-50 rounded-xl"
                      >
                        <h4 className="font-semibold text-gray-900">{value.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{value.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {company.benefits?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-500" /> Benefits & Perks
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {company.benefits.map((benefit, i) => (
                      <Badge key={i} className="bg-green-100 text-green-700 px-3 py-1.5">
                        <CheckCircle className="w-3 h-3 mr-1" /> {benefit}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <CompanyJobsList jobs={jobs} company={company} />
          </TabsContent>

          {/* Culture Tab */}
          <TabsContent value="culture" className="space-y-6">
            {/* Culture Traits */}
            {company.culture_traits?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Culture</h3>
                  <div className="flex flex-wrap gap-2">
                    {company.culture_traits.map((trait, i) => (
                      <Badge key={i} className="swipe-gradient text-white px-4 py-2 text-sm">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Testimonials */}
            {company.testimonials?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Quote className="w-5 h-5 text-pink-500" /> What Our Team Says
                  </h3>
                  <div className="grid gap-4">
                    {company.testimonials.map((testimonial, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-gray-50 rounded-xl"
                      >
                        <p className="text-gray-700 italic mb-3">"{testimonial.quote}"</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-semibold text-sm">
                            {testimonial.author?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{testimonial.author}</p>
                            <p className="text-gray-500 text-xs">{testimonial.role}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Office Perks */}
            {company.office_perks?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Office Perks</h3>
                  <div className="flex flex-wrap gap-2">
                    {company.office_perks.map((perk, i) => (
                      <Badge key={i} variant="outline" className="px-3 py-1.5">
                        {perk}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <CompanyTeamSection team={company.team_members} companyName={company.name} />
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <CompanyMediaGallery media={company.media_gallery} companyName={company.name} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}