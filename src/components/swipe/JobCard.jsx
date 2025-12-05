import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, Briefcase, Building2, Clock, ChevronDown, ChevronUp, ExternalLink, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function JobCard({ job, company, isFlipped, onFlip, matchScore, onQuickApply }) {
  const formatSalary = (min, max, type) => {
    const format = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n;
    if (min && max) {
      return `$${format(min)} - $${format(max)}${type === 'yearly' ? '/yr' : type === 'monthly' ? '/mo' : '/hr'}`;
    }
    return min ? `$${format(min)}+` : 'Competitive';
  };

  return (
    <div className="relative w-full h-full perspective-1000">
      <motion.div
        className="w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* Front of card */}
        <div 
          className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-2xl p-6 flex flex-col backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Match Score Badge */}
          {matchScore && (
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg z-10">
              <span className={`font-bold ${matchScore >= 80 ? 'text-green-500' : matchScore >= 65 ? 'text-amber-500' : 'text-gray-500'}`}>
                {matchScore}%
              </span>
              <span className="text-gray-500 text-sm ml-1">match</span>
            </div>
          )}

          {/* Company Logo */}
          <div className="flex items-start gap-4 mb-6">
            <Link to={createPageUrl('CompanyProfile') + `?id=${company?.id}`}>
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-2xl object-cover hover:ring-2 hover:ring-pink-500 transition-all" />
              ) : (
                <div className="w-16 h-16 rounded-2xl swipe-gradient flex items-center justify-center hover:opacity-90 transition-opacity">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
            </Link>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">{job.title}</h3>
              <Link to={createPageUrl('CompanyProfile') + `?id=${company?.id}`} className="text-gray-600 font-medium hover:text-pink-500 transition-colors">
                {company?.name || 'Company'}
              </Link>
            </div>
          </div>

          {/* Key Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5 text-pink-500" />
              <span>{job.location || 'Remote'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-gray-900">
                {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase className="w-5 h-5 text-orange-500" />
              <span className="capitalize">{job.job_type?.replace('-', ' ') || 'Full-time'}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {job.skills_required?.slice(0, 5).map((skill, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 border-0 px-3 py-1"
              >
                {skill}
              </Badge>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto flex items-center gap-2">
            {onQuickApply && (
              <Button
                onClick={(e) => { e.stopPropagation(); onQuickApply(); }}
                className="flex-1 swipe-gradient text-white"
              >
                <Zap className="w-4 h-4 mr-1" /> Quick Apply
              </Button>
            )}
            <button
              onClick={onFlip}
              className="flex items-center justify-center gap-1 text-gray-500 hover:text-gray-700 transition-colors py-3 px-3"
            >
              <span className="text-sm font-medium">Details</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Back of card */}
        <div 
          className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-2xl p-6 flex flex-col backface-hidden overflow-y-auto"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <h4 className="font-bold text-gray-900 mb-3">About the Role</h4>
          <p className="text-gray-600 text-sm mb-4 line-clamp-4">{job.description}</p>

          {job.responsibilities?.length > 0 && (
            <>
              <h4 className="font-bold text-gray-900 mb-2">Responsibilities</h4>
              <ul className="list-disc list-inside text-gray-600 text-sm mb-4 space-y-1">
                {job.responsibilities.slice(0, 4).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}

          {job.benefits?.length > 0 && (
            <>
              <h4 className="font-bold text-gray-900 mb-2">Benefits</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {job.benefits.slice(0, 6).map((b, i) => (
                  <Badge key={i} variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    {b}
                  </Badge>
                ))}
              </div>
            </>
          )}

          {/* Company Profile Link */}
          <Link to={createPageUrl('CompanyProfile') + `?id=${company?.id}`} className="mb-4">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="w-4 h-4 mr-1" /> View Company Profile
            </Button>
          </Link>

          <button
            onClick={onFlip}
            className="mt-auto flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 transition-colors py-3"
          >
            <ChevronUp className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Overview</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}