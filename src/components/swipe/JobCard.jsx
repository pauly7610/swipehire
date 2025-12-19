import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, DollarSign, Briefcase, Building2, Clock, ChevronDown, ChevronUp, ExternalLink, Zap, TrendingUp, Users, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function JobCard({ job, company, isFlipped, onFlip, matchScore, onQuickApply, onRefer }) {
  const formatSalary = (min, max, type) => {
    const format = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n;
    if (min && max) {
      return `$${format(min)} - $${format(max)}${type === 'yearly' ? '/yr' : type === 'monthly' ? '/mo' : '/hr'}`;
    }
    return min ? `$${format(min)}+` : 'Competitive';
  };

  // Intelligence signals
  const roleReadiness = matchScore >= 85 ? 'high' : matchScore >= 70 ? 'medium' : 'low';
  const companySignal = company?.size ? 'verified' : 'standard';

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.div
            key="front"
            initial={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col backdrop-blur-xl"
            style={{ 
              boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Hero Section with Company Branding */}
            <div className="relative h-36 md:h-32 bg-gradient-to-br from-pink-500/5 via-orange-500/5 to-purple-500/5 flex items-center px-4 md:px-6 border-b border-gray-100">
              {/* AI Intelligence Signals - Top Right */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {/* Fit Confidence Meter */}
                {matchScore && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 backdrop-blur-md shadow-sm border border-gray-200"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      matchScore >= 80 ? 'bg-green-500' : matchScore >= 65 ? 'bg-amber-500' : 'bg-gray-400'
                    } animate-pulse`} />
                    <span className="text-[10px] font-semibold text-gray-600">
                      {matchScore >= 80 ? 'Strong Fit' : matchScore >= 65 ? 'Good Fit' : 'Potential'}
                    </span>
                  </motion.div>
                )}
                
                {/* Role Readiness Indicator */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-md shadow-sm border border-gray-200 flex items-center justify-center"
                  title={`Role readiness: ${roleReadiness}`}
                >
                  <TrendingUp className={`w-4 h-4 ${
                    roleReadiness === 'high' ? 'text-green-600' : 
                    roleReadiness === 'medium' ? 'text-amber-600' : 'text-gray-400'
                  }`} />
                </motion.div>
              </div>

              {company?.id && (
                <Link to={createPageUrl('CompanyProfile') + `?id=${company.id}`} className="relative z-20">
                  {company.logo_url ? (
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    src={company.logo_url} 
                    alt={company.name} 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-xl border-3 md:border-4 border-white"
                  />
                ) : (
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-xl border-3 md:border-4 border-white"
                  >
                    <Building2 className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </motion.div>
                  )}
                </Link>
              )}
              {!company?.id && (
                <div className="relative z-20">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-xl border-3 md:border-4 border-white">
                    <Building2 className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-3 md:bottom-4 left-4 md:left-6 right-4 md:right-6">
                <motion.h3 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5 md:mb-1 line-clamp-1"
                >
                  {job.title}
                </motion.h3>
                {company?.id ? (
                  <Link to={createPageUrl('CompanyProfile') + `?id=${company.id}`}>
                    <motion.span 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-sm md:text-base text-gray-600 font-medium hover:text-pink-500 transition-colors inline-flex items-center gap-1"
                  >
                      {company.name || 'Company'}
                      <ExternalLink className="w-3 h-3" />
                    </motion.span>
                  </Link>
                ) : (
                  <motion.span 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-sm md:text-base text-gray-600 font-medium"
                  >
                    Company
                  </motion.span>
                )}
              </div>
            </div>

            {/* AI Insight Label */}
            <div className="px-4 md:px-6 pt-3 pb-0">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                <Zap className="w-3 h-3" />
                <span>AI-POWERED MATCH</span>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 px-4 md:px-6 py-2 md:py-3 overflow-y-auto"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#FF005C20 transparent'
              }}
            >

              {/* Quick Info Cards - Refined Layout */}
              <div className="grid grid-cols-3 gap-2 mb-3 md:mb-4">
                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="bg-white rounded-xl p-2.5 border border-gray-200/60 shadow-sm"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Salary</span>
                  </div>
                  <p className="font-bold text-gray-900 text-[11px] leading-tight">
                    {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="bg-white rounded-xl p-2.5 border border-gray-200/60 shadow-sm"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <Briefcase className="w-3 h-3 text-blue-600" />
                    <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Type</span>
                  </div>
                  <p className="font-bold text-gray-900 text-[11px] capitalize leading-tight">
                    {job.job_type?.replace('-', ' ') || 'Full-time'}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="bg-white rounded-xl p-2.5 border border-gray-200/60 shadow-sm"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3 text-pink-600" />
                    <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Location</span>
                  </div>
                  <p className="font-bold text-gray-900 text-[11px] leading-tight truncate">{job.location || 'Remote'}</p>
                </motion.div>
              </div>

              {/* Required Skills */}
              <div className="mb-3 md:mb-4">
                <h4 className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills_required?.slice(0, 6).map((skill, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.03 * i, type: "spring", stiffness: 400 }}
                    >
                      <Badge 
                        className="bg-gradient-to-r from-pink-500 to-orange-500 text-white border-0 px-2.5 py-1 shadow-sm text-[10px] font-semibold"
                      >
                        {skill}
                      </Badge>
                    </motion.div>
                  ))}
                  {job.skills_required?.length > 6 && (
                    <Badge variant="outline" className="border-gray-300 text-gray-600 text-[10px]">
                      +{job.skills_required.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Job Description Preview */}
              {job.description && (
                <div className="mb-3 md:mb-4">
                  <p className="text-xs md:text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Action Bar - Enhanced */}
            <div className="px-4 md:px-6 py-3 md:py-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2">
                {onQuickApply && (
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={(e) => { e.stopPropagation(); onQuickApply(); }}
                      className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md hover:shadow-lg transition-all h-10 text-sm font-semibold"
                    >
                      <Zap className="w-4 h-4 mr-2" /> Quick Apply
                    </Button>
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onFlip}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 hover:border-gray-400 transition-all shadow-sm"
                >
                  <span className="text-xs font-semibold">More</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (

          <motion.div
            key="back"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeIn" }}
            className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-orange-500 px-6 py-4 text-white">
              <h4 className="font-bold text-lg">{job.title}</h4>
              <p className="text-white/90 text-sm">{company?.name}</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 px-6 py-4 overflow-y-auto"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#FF005C20 transparent'
              }}
            >
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Briefcase className="w-3 h-3 text-pink-500" />
                    </div>
                    About the Role
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>
                </div>

                {job.responsibilities?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-blue-500" />
                      </div>
                      Responsibilities
                    </h4>
                    <ul className="space-y-2">
                      {job.responsibilities.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5 flex-shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.requirements?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Users className="w-3 h-3 text-orange-500" />
                      </div>
                      Requirements
                    </h4>
                    <ul className="space-y-2">
                      {job.requirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.benefits?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-green-500" />
                      </div>
                      Benefits & Perks
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {job.benefits.map((b, i) => (
                        <Badge key={i} className="bg-green-50 text-green-700 border border-green-200">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {company?.id && (
                    <Link to={createPageUrl('CompanyProfile') + `?id=${company.id}`}>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button variant="outline" size="sm" className="w-full border-pink-200 text-pink-600 hover:bg-pink-50">
                          <Building2 className="w-4 h-4 mr-2" /> View Company Profile
                        </Button>
                      </motion.div>
                    </Link>
                  )}
                  
                  {onRefer && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={(e) => { e.stopPropagation(); onRefer(); }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Refer a Candidate
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onFlip}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Overview</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}