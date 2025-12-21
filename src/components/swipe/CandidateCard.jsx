import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Briefcase, User, Star, Video, ChevronDown, ChevronUp, GraduationCap, Award, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CandidateCard({ candidate, user, isFlipped, onFlip, matchScore, dragControls, isDragging, onDragStart, onDragEnd, exitX }) {
  return (
    <motion.div 
      className="relative w-full h-full"
      drag={!isFlipped}
      dragControls={dragControls}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      animate={exitX !== 0 ? { 
        x: exitX,
        opacity: 0,
        scale: 0.8,
        rotate: exitX > 0 ? 20 : -20,
        transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
      } : { 
        x: 0, 
        opacity: 1, 
        scale: 1, 
        rotate: 0 
      }}
      style={{ 
        x: 0,
        rotate: 0,
        cursor: !isFlipped ? 'grab' : 'default',
        touchAction: 'none',
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
            className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-none"
          >
            {/* Hero Photo Section */}
            <div className="relative h-64 bg-gradient-to-br from-pink-500/10 via-orange-500/10 to-purple-500/10">
              {candidate?.photo_url ? (
                <img 
                  src={candidate.photo_url} 
                  alt={user?.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-24 h-24 text-pink-300" />
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Match Score */}
              {matchScore && (
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="absolute top-4 right-4 z-10"
                >
                  <div className="px-3 py-1.5 rounded-full shadow-lg bg-pink-500/90 backdrop-blur-md">
                    <span className="font-bold text-white text-sm">{matchScore}%</span>
                  </div>
                </motion.div>
              )}

              {/* Video Indicator */}
              {candidate?.video_intro_url && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-1.5"
                >
                  <Video className="w-4 h-4 text-pink-500" />
                  <span className="text-xs font-medium text-gray-700">Video Intro</span>
                </motion.div>
              )}

              {/* Name & Title Overlay */}
              <div className="absolute bottom-3 left-4 right-4">
                <motion.h3 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-bold text-white mb-0.5 drop-shadow-lg line-clamp-1"
                >
                  {user?.full_name || 'Candidate'}
                </motion.h3>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm text-white/90 font-medium drop-shadow-lg line-clamp-1"
                >
                  {candidate?.headline || 'Professional'}
                </motion.p>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 px-5 py-3 overflow-y-auto"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#FF005C20 transparent'
              }}
            >
              {/* Location & Experience */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {candidate?.location && (
                  <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl p-2.5 border border-pink-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-pink-600" />
                      <span className="text-[10px] text-pink-600 font-medium">Location</span>
                    </div>
                    <p className="font-bold text-gray-900 text-xs leading-tight truncate">{candidate.location}</p>
                  </div>
                )}
                
                {candidate?.experience_years && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-2.5 border border-blue-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[10px] text-blue-600 font-medium">Experience</span>
                    </div>
                    <p className="font-bold text-gray-900 text-xs leading-tight">{candidate.experience_years} yrs</p>
                  </div>
                )}
              </div>

              {/* Bio */}
              {candidate?.bio && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                    {candidate.bio}
                  </p>
                </div>
              )}

              {/* Top Skills */}
              <div className="mb-3">
                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Top Skills</h4>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {candidate?.skills?.slice(0, 6).map((skill, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 text-white border-0 px-2.5 py-1 shadow-sm text-[10px]">
                        {skill}
                      </Badge>
                    </motion.div>
                  ))}
                  {candidate?.skills?.length > 6 && (
                    <Badge variant="outline" className="border-pink-200 text-pink-600 text-[10px]">
                      +{candidate.skills.length - 6}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Recent Experience Preview */}
              {candidate?.experience?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Recent Experience</h4>
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700"
                  >
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{candidate.experience[0].title}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{candidate.experience[0].company}</p>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Bottom Action Bar - 44px Min */}
            <div className="px-5 py-3 bg-gradient-to-t from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border-t border-gray-100 dark:border-slate-700 pointer-events-auto">
              <button
                onClick={onFlip}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-slate-800 transition-colors shadow-sm min-h-[44px]"
              >
                <span className="text-sm font-medium">Full Profile</span>
                <ChevronDown className="w-4 h-4" />
              </button>
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
              <h4 className="font-bold text-lg">{user?.full_name || 'Candidate'}</h4>
              <p className="text-white/90 text-sm">{candidate?.headline || 'Professional'}</p>
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
                      <User className="w-3 h-3 text-pink-500" />
                    </div>
                    About
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {candidate?.bio || 'No bio provided'}
                  </p>
                </div>

                {candidate?.experience?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Briefcase className="w-3 h-3 text-blue-500" />
                      </div>
                      Work Experience
                    </h4>
                    <div className="space-y-3">
                      {candidate.experience.map((exp, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ scale: 1.01 }}
                          className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700"
                          >
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{exp.title}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{exp.company}</p>
                          {exp.description && (
                            <p className="text-gray-600 dark:text-gray-300 text-xs line-clamp-2">{exp.description}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {candidate?.education?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                        <GraduationCap className="w-3 h-3 text-purple-500" />
                      </div>
                      Education
                    </h4>
                    <div className="space-y-2">
                      {candidate.education.map((edu, i) => (
                        <div key={i} className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-900/40">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{edu.degree}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{edu.university}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {candidate?.skills?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Award className="w-3 h-3 text-orange-500" />
                      </div>
                      All Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, i) => (
                        <Badge key={i} className="bg-gray-100 text-gray-700 border border-gray-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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