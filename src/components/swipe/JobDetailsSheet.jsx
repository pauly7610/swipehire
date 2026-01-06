import BottomSheet, { BottomSheetContent, BottomSheetSection } from '../ui/BottomSheet';
import { MapPin, DollarSign, Clock, Users, Briefcase, Heart, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { colors } from '@/lib/design-system';

/**
 * Job Details Bottom Sheet
 * Shows comprehensive job information when card is tapped
 */
export default function JobDetailsSheet({ job, isOpen, onClose, onApply, onPass }) {
  if (!job) return null;

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Competitive';
    const format = (num) => `$${(num / 1000).toFixed(0)}k`;
    if (min && max) return `${format(min)}-${format(max)}`;
    return format(min || max);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.6, 0.95]}
      initialSnap={0}
      title={job.title}
      showClose={true}
      footer={
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onPass?.(job);
              onClose();
            }}
            className="flex-1 py-4 px-6 rounded-full border-2 border-gray-300 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <X className="w-5 h-5" />
              Pass
            </div>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onApply?.(job);
              onClose();
            }}
            className="flex-1 py-4 px-6 rounded-full font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: colors.success.gradient }}
          >
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-5 h-5" />
              Apply Now
            </div>
          </motion.button>
        </div>
      }
    >
      <BottomSheetContent>
        {/* Company */}
        <div className="flex items-center gap-4 mb-6">
          {job.company?.logo ? (
            <img
              src={job.company.logo}
              alt={job.company.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: colors.primary.DEFAULT }}>
                {job.company?.name?.charAt(0) || 'C'}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {job.company?.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {job.company?.industry || 'Technology'}
            </p>
          </div>
        </div>

        {/* Match Score */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Match Score
              </span>
            </div>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {job.matchScore || 95}%
            </span>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
            Based on your skills, experience, and preferences
          </p>
        </div>

        {/* Key Details */}
        <BottomSheetSection title="Job Details">
          <div className="space-y-3">
            <DetailItem
              icon={<MapPin className="w-5 h-5" />}
              label="Location"
              value={job.remote ? 'Remote' : job.location || 'Not specified'}
            />
            <DetailItem
              icon={<DollarSign className="w-5 h-5" />}
              label="Salary"
              value={formatSalary(job.salaryMin, job.salaryMax)}
            />
            <DetailItem
              icon={<Briefcase className="w-5 h-5" />}
              label="Experience"
              value={job.experienceLevel || 'Mid-Senior level'}
            />
            <DetailItem
              icon={<Users className="w-5 h-5" />}
              label="Job Type"
              value={job.type || 'Full-time'}
            />
            <DetailItem
              icon={<Clock className="w-5 h-5" />}
              label="Posted"
              value={getTimeAgo(job.postedAt || new Date())}
            />
          </div>
        </BottomSheetSection>

        {/* Description */}
        {job.description && (
          <BottomSheetSection title="About the Role">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {job.description}
            </p>
          </BottomSheetSection>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <BottomSheetSection title="Requirements">
            <ul className="space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-primary mt-1">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </BottomSheetSection>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <BottomSheetSection title="Required Skills">
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </BottomSheetSection>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <BottomSheetSection title="Benefits">
            <ul className="space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </BottomSheetSection>
        )}

        {/* Company Info */}
        {job.company?.description && (
          <BottomSheetSection title="About the Company">
            <p className="text-gray-700 dark:text-gray-300">
              {job.company.description}
            </p>
            {job.company.size && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Company Size: {job.company.size}
              </p>
            )}
          </BottomSheetSection>
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}

// Helper component for detail items
function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-500 dark:text-gray-400">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// Helper function
function getTimeAgo(date) {
  const now = new Date();
  const posted = new Date(date);
  const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} weeks ago`;
}
