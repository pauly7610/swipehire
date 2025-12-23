import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, Briefcase, Shield, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function VideoIntelligenceOverlay({ insights, viewerType, matchScore, onSegmentJump }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

  if (!insights) return null;

  const { skills = [], experience_level, work_type, location, clearance, segments = [] } = insights;

  return (
    <div className="absolute bottom-20 left-4 right-16 z-20 pointer-events-auto">
      <AnimatePresence>
        {!isExpanded ? (
          // Collapsed state - Skill pills
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-2"
          >
            {/* Skills Row */}
            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 4).map((skill, i) => (
                <Badge 
                  key={i}
                  className="bg-black/60 backdrop-blur-md text-white border border-white/20 text-xs px-2 py-0.5 cursor-pointer hover:bg-pink-500 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSkill(skill);
                  }}
                >
                  {skill}
                </Badge>
              ))}
              {skills.length > 4 && (
                <Badge 
                  className="bg-black/60 backdrop-blur-md text-white border border-white/20 text-xs px-2 py-0.5"
                >
                  +{skills.length - 4} more
                </Badge>
              )}
            </div>

            {/* Quick Meta */}
            <div className="flex flex-wrap gap-1.5">
              {experience_level && (
                <Badge className="bg-purple-500/80 backdrop-blur-md text-white border-0 text-xs">
                  <Briefcase className="w-3 h-3 mr-1" /> {experience_level}
                </Badge>
              )}
              {location && (
                <Badge className="bg-blue-500/80 backdrop-blur-md text-white border-0 text-xs">
                  <MapPin className="w-3 h-3 mr-1" /> {location}
                </Badge>
              )}
              {clearance && (
                <Badge className="bg-green-500/80 backdrop-blur-md text-white border-0 text-xs">
                  <Shield className="w-3 h-3 mr-1" /> {clearance}
                </Badge>
              )}
              {work_type && (
                <Badge className="bg-orange-500/80 backdrop-blur-md text-white border-0 text-xs">
                  {work_type}
                </Badge>
              )}
            </div>

            {/* Expand Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-xs flex items-center gap-1 hover:bg-black/80 transition-all"
            >
              <Sparkles className="w-3 h-3" />
              AI Insights
              <ChevronUp className="w-3 h-3" />
            </button>
          </motion.div>
        ) : (
          // Expanded state - Full intelligence panel
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="bg-black/80 backdrop-blur-xl border border-white/20 text-white overflow-hidden">
              <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                {/* Match Score - Recruiter only */}
                {viewerType === 'employer' && matchScore && (
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-medium text-white/80">Match Score</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < Math.round(matchScore/20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold">{matchScore}%</span>
                    </div>
                  </div>
                )}

                {/* All Skills */}
                <div>
                  <p className="text-xs text-white/60 mb-1.5">Skills Detected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, i) => (
                      <Badge 
                        key={i}
                        className="bg-white/10 text-white border border-white/20 text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Video Segments - Timeline */}
                {segments.length > 0 && (
                  <div>
                    <p className="text-xs text-white/60 mb-1.5">Quick Jump</p>
                    <div className="flex flex-wrap gap-1.5">
                      {segments.map((seg, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSegmentJump?.(seg.start);
                          }}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs transition-all"
                        >
                          {seg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collapse Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="w-full py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <ChevronDown className="w-3 h-3" /> Collapse
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}