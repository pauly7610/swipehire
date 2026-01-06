import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Eye,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Download
} from 'lucide-react';
import { getCandidateApplications } from '@/components/lib/auto-apply';
import { colors, springs } from '@/components/lib/design-system';
import BottomSheet, { BottomSheetContent, BottomSheetSection } from '@/components/ui/BottomSheet';

// Helper function
function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
}

/**
 * Application Dashboard
 * Track all auto-applied jobs with status updates
 */
export default function ApplicationDashboard({ candidateId }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, viewed, responded

  useEffect(() => {
    loadApplications();
  }, [candidateId]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const apps = await getCandidateApplications(candidateId);
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: applications.length,
    viewed: applications.filter(a => a.viewed).length,
    responded: applications.filter(a => a.hasResponse).length,
    viewRate: applications.length > 0
      ? Math.round((applications.filter(a => a.viewed).length / applications.length) * 100)
      : 0
  };

  // Filter applications
  const filteredApps = applications.filter(app => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !app.viewed;
    if (filter === 'viewed') return app.viewed && !app.hasResponse;
    if (filter === 'responded') return app.hasResponse;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          My Applications
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your auto-applied jobs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Applied"
          value={stats.total}
          color={colors.primary.DEFAULT}
        />
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          label="Viewed"
          value={stats.viewed}
          color={colors.success.DEFAULT}
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Responses"
          value={stats.responded}
          color="#6366F1"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="View Rate"
          value={`${stats.viewRate}%`}
          color="#8B5CF6"
        />
      </div>

      {/* Filters */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="All"
            count={applications.length}
          />
          <FilterButton
            active={filter === 'pending'}
            onClick={() => setFilter('pending')}
            label="Pending"
            count={applications.length - stats.viewed}
          />
          <FilterButton
            active={filter === 'viewed'}
            onClick={() => setFilter('viewed')}
            label="Viewed"
            count={stats.viewed - stats.responded}
          />
          <FilterButton
            active={filter === 'responded'}
            onClick={() => setFilter('responded')}
            label="Responded"
            count={stats.responded}
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="px-6 space-y-3">
        {loading ? (
          <LoadingState />
        ) : filteredApps.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filteredApps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, ...springs.smooth }}
            >
              <ApplicationCard
                application={app}
                onClick={() => setSelectedApp(app)}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Application Details Sheet */}
      {selectedApp && (
        <ApplicationDetailsSheet
          application={selectedApp}
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );
}

// Filter Button
function FilterButton({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
        active
          ? 'bg-primary text-white'
          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
      }`}
    >
      {label} {count > 0 && `(${count})`}
    </button>
  );
}

// Application Card
function ApplicationCard({ application, onClick }) {
  const getStatusIcon = () => {
    if (application.hasResponse) {
      return <MessageSquare className="w-5 h-5 text-blue-500" />;
    }
    if (application.viewed) {
      return <Eye className="w-5 h-5 text-green-500" />;
    }
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (application.hasResponse) return 'Response received';
    if (application.viewed) return 'Viewed by employer';
    return 'Awaiting review';
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 text-left hover:border-primary transition-colors"
    >
      <div className="flex gap-4">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {application.job?.company?.logo ? (
            <img
              src={application.job.company.logo}
              alt={application.job.company.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
              <span className="text-lg font-bold" style={{ color: colors.primary.DEFAULT }}>
                {application.job?.company?.name?.charAt(0) || 'J'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
            {application.job?.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {application.job?.company?.name}
          </p>

          {/* Status */}
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {getStatusText()}
            </span>
          </div>

          {/* Time */}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Applied {getTimeAgo(application.appliedAt)}
          </p>
        </div>

        {/* Badge */}
        {application.hasResponse && (
          <div className="flex-shrink-0">
            <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
              New
            </span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// Application Details Sheet
function ApplicationDetailsSheet({ application, isOpen, onClose }) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Application Details"
      snapPoints={[0.7, 0.95]}
    >
      <BottomSheetContent>
        {/* Job Info */}
        <BottomSheetSection title="Job">
          <div className="flex gap-4 mb-4">
            {application.job?.company?.logo && (
              <img
                src={application.job.company.logo}
                alt={application.job.company.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {application.job?.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {application.job?.company?.name}
              </p>
            </div>
          </div>
        </BottomSheetSection>

        {/* Timeline */}
        <BottomSheetSection title="Application Timeline">
          <div className="space-y-4">
            <TimelineItem
              icon={<CheckCircle className="w-5 h-5 text-green-500" />}
              title="Application Submitted"
              time={application.appliedAt}
              completed
            />
            {application.viewed && (
              <TimelineItem
                icon={<Eye className="w-5 h-5 text-blue-500" />}
                title="Viewed by Employer"
                time={application.viewedAt}
                completed
              />
            )}
            {application.hasResponse && (
              <TimelineItem
                icon={<MessageSquare className="w-5 h-5 text-purple-500" />}
                title="Response Received"
                time={new Date()}
                completed
              />
            )}
            <TimelineItem
              icon={<Calendar className="w-5 h-5 text-gray-400" />}
              title="Interview"
              completed={false}
            />
          </div>
        </BottomSheetSection>

        {/* Materials Submitted */}
        <BottomSheetSection title="Materials Submitted">
          <div className="space-y-2">
            <MaterialItem
              icon={<FileText className="w-5 h-5" />}
              label="Customized Resume"
              hasContent={!!application.customizedResume}
            />
            <MaterialItem
              icon={<FileText className="w-5 h-5" />}
              label="Cover Letter"
              hasContent={!!application.coverLetter}
            />
          </div>
        </BottomSheetSection>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button className="w-full py-3 px-4 rounded-xl bg-primary text-white font-medium">
            View Resume Sent
          </button>
          <button className="w-full py-3 px-4 rounded-xl border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium">
            Withdraw Application
          </button>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

// Timeline Item
function TimelineItem({ icon, title, time, completed }) {
  return (
    <div className="flex gap-3">
      <div className={`flex-shrink-0 ${completed ? '' : 'opacity-50'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${completed ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
          {title}
        </p>
        {time && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getTimeAgo(time)}
          </p>
        )}
      </div>
    </div>
  );
}

// Material Item
function MaterialItem({ icon, label, hasContent }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <div className="text-gray-600 dark:text-gray-400">{icon}</div>
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
      </div>
      {hasContent && (
        <button className="text-primary text-sm font-medium">
          View
        </button>
      )}
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="h-24 bg-white dark:bg-gray-900 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
}

// Empty State
function EmptyState({ filter }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📭</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No applications {filter !== 'all' ? `(${filter})` : 'yet'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Start swiping to apply to jobs!
      </p>
    </div>
  );
}