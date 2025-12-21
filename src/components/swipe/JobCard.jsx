import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, DollarSign, Briefcase, Building2, Clock, ChevronDown, ChevronUp, ExternalLink, Zap, TrendingUp, Users, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function JobCard({ job, company, isFlipped, onFlip, matchScore, onQuickApply, onRefer, isDragging, onDragStart, onDragEnd, exitX }) {
  const [showInsights, setShowInsights] = useState(false);
  
  // Drag motion values
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-300, 0, 300], [-25, 0, 25]);
  const dragOpacity = useTransform(dragX, [-300, -150, 0, 150, 300], [0.5, 0.8, 1, 0.8, 0.5]);
  
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
    <motion.div 
      className="relative w-full h-full"
      drag={!isFlipped ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragStart={onDragStart}
      onDrag={(e, info) => dragX.set(info.offset.x)}
      onDragEnd={(e, info) => {
        dragX.set(0);
        onDragEnd(e, info);
      }}
      animate={exitX !== 0 ? { 
        x: exitX,
        opacity: 0,
        scale: 0.85,
        rotate: exitX > 0 ? 25 : -25,
        transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
      } : { 
        x: 0, 
        opacity: 1, 
        scale: 1, 
        rotate: 0 
      }}
      style={{ 
        x: dragX,
        rotate: dragRotate,
        opacity: dragOpacity,
        cursor: !isFlipped ? 'grab' : 'default',
        touchAction: 'pan-y',
        userSelect: 'none'
      }}
      whileDrag={{
        cursor: 'grabbing',
        scale: 1.05,
        transition: { duration: 0 }
      }}
    >
      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.div
            key="front"
            initial={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden flex flex-col backdrop-blur-xl pointer-events-none"
            style={{ 
              boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Hero Section with Company Branding */}
            <div className="relative h-32 bg-gradient-to-br from-pink-500/5 via-orange-500/5 to-purple-500/5 dark:from-pink-500/10 dark:via-orange-500/10 dark:to-purple-500/10 flex items-center px-5 border-b border-gray-100 dark:border-slate-700">
              {/* AI Intelligence Signals - Top Right */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {/* Fit Confidence Meter */}
                {matchScore && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-sm border border-gray-200 dark:border-slate-700"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      matchScore >= 80 ? 'bg-green-500' : matchScore >= 65 ? 'bg-amber-500' : 'bg-gray-400'
                    } animate-pulse`} />
                    <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                      {matchScore >= 80 ? 'Strong Fit' : matchScore >= 65 ? 'Good Fit' : 'Potential'}
                    </span>
                  </motion.div>
                )}
                
                {/* Role Readiness Indicator */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="w-8 h-8 rounded-lg bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-sm border border-gray-200 dark:border-slate-700 flex items-center justify-center"
                  title={`Role readiness: ${roleReadiness}`}
                >
                  <TrendingUp className={`w-4 h-4 ${
                    roleReadiness === 'high' ? 'text-green-600' : 
                    roleReadiness === 'medium' ? 'text-amber-600' : 'text-gray-400'
                  }`} />
                </motion.div>
              </div>

              {company?.id && (
                <Link 
                  to={createPageUrl('CompanyProfile') + `?id=${company.id}`} 
                  className="relative z-20 pointer-events-auto"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  {company.logo_url ? (
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    src={company.logo_url} 
                    alt={company.name} 
                    className="w-16 h-16 rounded-2xl object-cover shadow-xl border-4 border-white"
                  />
                ) : (
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-xl border-4 border-white"
                  >
                    <Building2 className="w-8 h-8 text-white" />
                  </motion.div>
                  )}
                </Link>
              )}
              {!company?.id && (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-xl border-4 border-white">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
              
              <div className="absolute bottom-3 left-5 right-5">
                <motion.h3 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-bold text-gray-900 dark:text-white mb-0.5 line-clamp-1"
                >
                  {job.title}
                </motion.h3>
                <Link 
                  to={company?.id ? createPageUrl('CompanyProfile') + `?id=${company.id}` : '#'}
                  className="pointer-events-auto"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <motion.span 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-sm text-gray-600 dark:text-gray-400 font-medium hover:text-pink-500 dark:hover:text-pink-400 transition-colors inline-flex items-center gap-1"
                  >
                    {company?.name || 'Company'}
                    {company?.id && <ExternalLink className="w-3 h-3" />}
                  </motion.span>
                </Link>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 px-5 py-3 overflow-y-auto"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#FF005C20 transparent'
              }}
            >

              {/* Quick Info Cards */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-gray-200/60 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Salary</span>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-[11px] leading-tight">
                    {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-gray-200/60 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <Briefcase className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Type</span>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-[11px] capitalize leading-tight">
                    {job.job_type?.replace('-', ' ') || 'Full-time'}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-gray-200/60 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3 text-pink-600 dark:text-pink-400" />
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Location</span>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-[11px] leading-tight truncate">{job.location || 'Remote'}</p>
                </motion.div>
              </div>

              {/* Required Skills */}
              <div className="mb-3">
                <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Key Skills</h4>
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
                <div className="mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Action Bar - Thumb Reachable */}
            <div className="px-5 py-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 pointer-events-auto">
              <div className="flex items-center gap-2">
                {onQuickApply && (
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={(e) => { e.stopPropagation(); onQuickApply(); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-slate-500 transition-all shadow-sm"
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
            className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
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
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Briefcase className="w-3 h-3 text-pink-500" />
                    </div>
                    About the Role
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{job.description}</p>
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
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onFlip}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Overview</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}