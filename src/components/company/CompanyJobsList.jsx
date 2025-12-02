import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, DollarSign, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function CompanyJobsList({ jobs, company }) {
  const formatSalary = (min, max, type) => {
    if (!min && !max) return null;
    const format = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`;
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `From ${format(min)}`;
    return `Up to ${format(max)}`;
  };

  if (!jobs || jobs.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Open Positions</h3>
          <p className="text-gray-500">{company?.name} doesn't have any open positions right now.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{jobs.length} Open Position{jobs.length !== 1 ? 's' : ''}</h3>
      </div>

      {jobs.map((job, i) => (
        <motion.div
          key={job.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {job.location}
                      </span>
                    )}
                    {job.job_type && (
                      <Badge variant="secondary" className="capitalize">
                        {job.job_type.replace('-', ' ')}
                      </Badge>
                    )}
                    {formatSalary(job.salary_min, job.salary_max, job.salary_type) && (
                      <span className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-4 h-4" />
                        {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                      </span>
                    )}
                  </div>
                  
                  {job.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{job.description}</p>
                  )}

                  {job.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.skills_required.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.skills_required.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.skills_required.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <Link to={createPageUrl('SwipeJobs')}>
                  <Button className="swipe-gradient text-white">
                    Apply <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Posted {formatDistanceToNow(new Date(job.created_date), { addSuffix: true })}
                </span>
                {job.experience_level_required && (
                  <span className="capitalize">{job.experience_level_required} level</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}