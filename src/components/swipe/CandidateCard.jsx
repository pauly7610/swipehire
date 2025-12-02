import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, User, Star, Video, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CandidateCard({ candidate, user, isFlipped, onFlip, matchScore }) {
  return (
    <div className="relative w-full h-full perspective-1000">
      <motion.div
        className="w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* Front of card */}
        <div 
          className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-2xl p-6 flex flex-col backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Photo */}
          <div className="relative mb-4">
            {candidate?.photo_url ? (
              <img 
                src={candidate.photo_url} 
                alt={user?.full_name}
                className="w-full h-48 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                <User className="w-20 h-20 text-pink-300" />
              </div>
            )}
            
            {/* Match Score */}
            {matchScore && (
              <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                <span className="font-bold text-pink-500">{matchScore}%</span>
                <span className="text-gray-500 text-sm ml-1">match</span>
              </div>
            )}

            {/* Video indicator */}
            {candidate?.video_intro_url && (
              <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <Video className="w-5 h-5 text-pink-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">{user?.full_name || 'Candidate'}</h3>
            <p className="text-gray-600 font-medium">{candidate?.headline || 'Professional'}</p>

            {candidate?.location && (
              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{candidate.location}</span>
              </div>
            )}

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {candidate?.skills?.slice(0, 4).map((skill, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 border-0"
                >
                  {skill}
                </Badge>
              ))}
              {candidate?.skills?.length > 4 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                  +{candidate.skills.length - 4}
                </Badge>
              )}
            </div>
          </div>

          {/* Flip Button */}
          <button
            onClick={onFlip}
            className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 transition-colors py-3 mt-4"
          >
            <span className="text-sm font-medium">View Profile</span>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Back of card */}
        <div 
          className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-2xl p-6 flex flex-col backface-hidden overflow-y-auto"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <h4 className="font-bold text-gray-900 mb-3">About</h4>
          <p className="text-gray-600 text-sm mb-4">
            {candidate?.bio || 'No bio provided'}
          </p>

          {candidate?.experience?.length > 0 && (
            <>
              <h4 className="font-bold text-gray-900 mb-3">Experience</h4>
              <div className="space-y-3 mb-4">
                {candidate.experience.slice(0, 3).map((exp, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-pink-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{exp.title}</p>
                      <p className="text-gray-500 text-xs">{exp.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {candidate?.skills?.length > 0 && (
            <>
              <h4 className="font-bold text-gray-900 mb-2">All Skills</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {candidate.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </>
          )}

          <button
            onClick={onFlip}
            className="mt-auto flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 transition-colors py-3"
          >
            <ChevronUp className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}