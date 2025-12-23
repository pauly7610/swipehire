import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, Briefcase, MapPin, Clock, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function IntelligenceTray({ 
  post, 
  candidate, 
  job, 
  company,
  matchScore,
  aiInsights,
  viewerType,
  onAction
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getWorkType = () => {
    if (job?.work_type) return job.work_type;
    if (post?.caption) {
      const caption = post.caption.toLowerCase();
      if (caption.includes('remote')) return 'Remote';
      if (caption.includes('hybrid')) return 'Hybrid';
      if (caption.includes('contract')) return 'Contract';
      return 'Full-time';
    }
    return 'Full-time';
  };

  const role = candidate?.headline || job?.title || 'Role';
  const location = candidate?.location || company?.location || job?.location || 'Location';
  const workType = getWorkType();
  const skills = post?.tags || candidate?.skills?.slice(0, 3) || [];

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/90 to-transparent backdrop-blur-xl z-20"
      initial={false}
      animate={{ 
        height: isExpanded ? '60vh' : '140px',
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      {/* Drag Handle */}
      <div 
        className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      />

      <div className="h-full overflow-y-auto p-4 pt-6">
        {/* Collapsed View - Always Visible */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">{role}</h3>
              <div className="flex flex-wrap items-center gap-2 text-white/70 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {location}
                </span>
                <span>•</span>
                <Badge variant="outline" className="border-white/20 text-white text-xs">
                  {workType}
                </Badge>
              </div>
            </div>
            {matchScore && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{matchScore}%</div>
                <div className="text-[10px] text-white/50">MATCH</div>
              </div>
            )}
          </div>

          {/* Key Skills - Always Visible */}
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 3).map((skill, i) => (
              <Badge 
                key={i} 
                className="bg-white/10 text-white border-0 backdrop-blur-sm"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 space-y-4 pb-20"
            >
              {/* AI Summary */}
              {aiInsights?.summary && (
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-semibold text-sm">What Matters Here</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{aiInsights.summary}</p>
                </div>
              )}

              {/* Timeline Jumps */}
              {aiInsights?.segments && (
                <div className="space-y-2">
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Jump To</p>
                  <div className="grid grid-cols-2 gap-2">
                    {aiInsights.segments.map((segment, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        onClick={() => onAction?.('jump', segment.start)}
                      >
                        {segment.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Proof of Work */}
              {aiInsights?.proofLinks && (
                <div className="space-y-2">
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Proof of Work</p>
                  {aiInsights.proofLinks.map((link, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
                      onClick={() => onAction?.('openLink', link.url)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                      {link.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Reality Indicators */}
              {post?.reality_tags && (
                <div className="space-y-2">
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Reality Check</p>
                  <div className="flex flex-wrap gap-2">
                    {post.reality_tags.map((tag, i) => (
                      <Badge key={i} className="bg-blue-500/20 text-blue-300 border-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button
                  className="bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold"
                  onClick={() => onAction?.('primary')}
                >
                  {viewerType === 'employer' ? 'Interview' : 'Apply Now'}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white"
                  onClick={() => onAction?.('secondary')}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand Indicator */}
        {!isExpanded && (
          <div 
            className="flex justify-center mt-3 cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <ChevronUp className="w-5 h-5 text-white/50 animate-bounce" />
          </div>
        )}
      </div>
    </motion.div>
  );
}