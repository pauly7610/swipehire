import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Users, Briefcase, Star, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function EnhancedCompanyCard({ company, jobCount, matchScore }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-r from-pink-500 to-orange-500">
          {company.cover_image_url ? (
            <img src={company.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500" />
          )}
          
          {matchScore && (
            <div className="absolute top-3 right-3">
              <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
                <span className="text-sm font-bold text-pink-600">{matchScore}% Match</span>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Logo & Name */}
          <div className="flex items-start gap-3 -mt-8 mb-3">
            <div className="relative">
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt={company.name}
                  className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-lg bg-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center border-4 border-white shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 mt-8">
              <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{company.name}</h3>
              <p className="text-sm text-gray-500">{company.industry}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <Briefcase className="w-4 h-4 mx-auto text-pink-500 mb-1" />
              <p className="text-xs font-bold text-gray-900">{jobCount || 0}</p>
              <p className="text-[10px] text-gray-500">Jobs</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <Users className="w-4 h-4 mx-auto text-blue-500 mb-1" />
              <p className="text-xs font-bold text-gray-900">{company.size || 'N/A'}</p>
              <p className="text-[10px] text-gray-500">Size</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <MapPin className="w-4 h-4 mx-auto text-green-500 mb-1" />
              <p className="text-xs font-bold text-gray-900 truncate">{company.location?.split(',')[0] || 'Remote'}</p>
              <p className="text-[10px] text-gray-500">Location</p>
            </div>
          </div>

          {/* Culture Traits */}
          {company.culture_traits?.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {company.culture_traits.slice(0, 3).map((trait, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
                {company.culture_traits.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{company.culture_traits.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {company.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{company.description}</p>
          )}

          {/* CTA */}
          <Link to={createPageUrl('CompanyProfile') + `?id=${company.id}`}>
            <Button className="w-full swipe-gradient text-white">
              View Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}