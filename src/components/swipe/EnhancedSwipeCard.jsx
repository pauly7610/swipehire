import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Briefcase, Clock, TrendingUp, Sparkles, X, Heart } from 'lucide-react';

export default function EnhancedSwipeCard({ 
  job, 
  company, 
  matchScore, 
  matchReasons = [], 
  onSwipe,
  onReject 
}) {
  const formatSalary = (min, max, type) => {
    const format = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n;
    if (min && max) return `$${format(min)} - $${format(max)}`;
    return min ? `$${format(min)}+` : 'Competitive';
  };

  return (
    <div className="relative w-full max-w-md mx-auto h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-48 bg-gradient-to-br from-pink-500/10 via-orange-500/10 to-purple-500/10 dark:from-pink-500/20 dark:via-orange-500/20 dark:to-purple-500/20 flex flex-col justify-end p-6 border-b border-gray-100 dark:border-slate-700">
        {/* Match Score Badge */}
        {matchScore && (
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg border border-gray-200 dark:border-slate-700 flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${
                matchScore >= 80 ? 'text-green-500' : matchScore >= 65 ? 'text-amber-500' : 'text-gray-400'
              }`} />
              <span className="text-sm font-bold text-gray-900 dark:text-white">{matchScore}%</span>
            </div>
          </div>
        )}

        {/* Company Logo */}
        {company?.logo_url && (
          <img 
            src={company.logo_url} 
            alt={company.name} 
            className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg object-cover mb-3"
          />
        )}

        {/* Job Title & Company */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
          {job.title}
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
          {company?.name || 'Company'}
        </p>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Salary</span>
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">
              {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-pink-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Location</span>
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
              {job.location || 'Remote'}
            </p>
          </div>
        </div>

        {/* Why This Matches - AI Insight */}
        {matchReasons?.length > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Why This Matches</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              {matchReasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-pink-500 mt-2 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills - Mobile Optimized Chips */}
        {job.skills_required?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Skills Required
            </h4>
            <div className="flex flex-wrap gap-2">
              {job.skills_required.slice(0, 10).map((skill, i) => (
                <Badge 
                  key={i}
                  className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-3 py-1.5 text-xs font-medium"
                  style={{ minHeight: '32px', minWidth: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {skill}
                </Badge>
              ))}
              {job.skills_required.length > 10 && (
                <Badge variant="outline" className="border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 text-xs min-h-[32px]">
                  +{job.skills_required.length - 10}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Job Description Preview */}
        {job.description && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              About the Role
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed">
              {job.description}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons - Thumb Zone */}
      <div className="px-6 py-5 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700">
        <div className="flex gap-3">
          {onReject && (
            <Button
              onClick={() => onReject()}
              variant="outline"
              className="flex-1 h-14 border-2 border-gray-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
          )}
          <Button
            onClick={() => onSwipe('interested')}
            className="flex-1 h-14 bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            <Heart className="w-5 h-5 mr-2" />
            Interested
          </Button>
        </div>
      </div>
    </div>
  );
}