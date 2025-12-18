import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, DollarSign, Briefcase, Building2, Clock, ChevronDown, ChevronUp, ExternalLink, Zap, TrendingUp, Users } from 'lucide-react';
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
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.div
            key="front"
            initial={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-white via-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Hero Section with Company Branding */}
            <div className="relative h-32 bg-gradient-to-br from-pink-500/10 via-orange-500/10 to-purple-500/10 flex items-center px-6">
              {/* Match Score Badge */}
              {matchScore && (
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="absolute top-4 right-4 z-10"
                >
                  <div className={`px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md ${
                    matchScore >= 80 ? 'bg-green-500/90' : matchScore >= 65 ? 'bg-amber-500/90' : 'bg-gray-500/90'
                  }`}>
                    <span className="font-bold text-white text-sm">
                      {matchScore}%
                    </span>
                  </div>
                </motion.div>
              )}

              <Link to={createPageUrl('CompanyProfile') + `?id=${company?.id}`} className="relative z-20">
                {company?.logo_url ? (
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    src={company.logo_url} 
                    alt={company.name} 
                    className="w-20 h-20 rounded-2xl object-cover shadow-xl border-4 border-white"
                  />
                ) : (
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-xl border-4 border-white"
                  >
                    <Building2 className="w-10 h-10 text-white" />
                  </motion.div>
                )}
              </Link>
              
              <div className="absolute bottom-4 left-6 right-6">
                <motion.h3 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold text-gray-900 mb-1"
                >
                  {job.title}
                </motion.h3>
                <Link to={createPageUrl('CompanyProfile') + `?id=${company?.id}`}>
                  <motion.span 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-gray-600 font-medium hover:text-pink-500 transition-colors inline-flex items-center gap-1"
                  >
                    {company?.name || 'Company'}
                    <ExternalLink className="w-3 h-3" />
                  </motion.span>
                </Link>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 px-6 py-4 overflow-y-auto"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#FF005C20 transparent'
              }}
            >

              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-3 border border-green-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Salary</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">
                    {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 border border-blue-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-blue-600 font-medium">Type</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm capitalize">
                    {job.job_type?.replace('-', ' ') || 'Full-time'}
                  </p>
                </motion.div>
              </div>

              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-3 border border-pink-100 mb-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-pink-600" />
                  <span className="text-xs text-pink-600 font-medium">Location</span>
                </div>
                <p className="font-bold text-gray-900 text-sm">{job.location || 'Remote'}</p>
              </motion.div>

              {/* Required Skills */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required?.slice(0, 6).map((skill, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <Badge 
                        className="bg-gradient-to-r from-pink-500 to-orange-500 text-white border-0 px-3 py-1.5 shadow-sm"
                      >
                        {skill}
                      </Badge>
                    </motion.div>
                  ))}
                  {job.skills_required?.length > 6 && (
                    <Badge variant="outline" className="border-pink-200 text-pink-600">
                      +{job.skills_required.length - 6}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Job Description Preview */}
              {job.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="px-6 py-4 bg-gradient-to-t from-gray-50 to-white border-t border-gray-100">
              <div className="flex items-center gap-3">
                {onQuickApply && (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={(e) => { e.stopPropagation(); onQuickApply(); }}
                      className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all"
                    >
                      <Zap className="w-4 h-4 mr-2" /> Quick Apply
                    </Button>
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onFlip}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span className="text-sm font-medium">Full Details</span>
                  <ChevronDown className="w-4 h-4" />
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

                <Link to={createPageUrl('CompanyProfile') + `?id=${company?.id}`}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" size="sm" className="w-full border-pink-200 text-pink-600 hover:bg-pink-50">
                      <Building2 className="w-4 h-4 mr-2" /> View Company Profile
                    </Button>
                  </motion.div>
                </Link>
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