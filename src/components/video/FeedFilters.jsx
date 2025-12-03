import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Filter, X, Briefcase, User, MapPin, Sparkles, 
  Building2, Video, Lightbulb, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CONTENT_TYPES = [
  { value: 'job_post', label: 'Job Openings', icon: Briefcase },
  { value: 'intro', label: 'Introductions', icon: User },
  { value: 'tips', label: 'Career Tips', icon: Lightbulb },
  { value: 'company_culture', label: 'Company Culture', icon: Building2 },
  { value: 'day_in_life', label: 'Day in Life', icon: Video },
];

const USER_TYPES = [
  { value: 'candidate', label: 'Candidates', icon: User },
  { value: 'employer', label: 'Employers', icon: Building2 },
];

const POPULAR_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS',
  'Marketing', 'Sales', 'Design', 'Data Analysis', 'Project Management',
  'Communication', 'Leadership', 'Problem Solving'
];

export default function FeedFilters({ filters, onFiltersChange, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [skillInput, setSkillInput] = useState('');

  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key, value) => {
    setLocalFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const addSkill = (skill) => {
    if (skill && !(localFilters.skills || []).includes(skill)) {
      toggleArrayFilter('skills', skill);
    }
    setSkillInput('');
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const clearFilters = () => {
    const cleared = { contentTypes: [], userTypes: [], location: '', skills: [] };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const activeCount = [
    ...(localFilters.contentTypes || []),
    ...(localFilters.userTypes || []),
    ...(localFilters.skills || []),
    localFilters.location ? 1 : 0
  ].flat().length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-pink-500" />
          <span className="font-semibold text-white">Filters</span>
          {activeCount > 0 && (
            <Badge className="bg-pink-500 text-white text-xs">{activeCount}</Badge>
          )}
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Type */}
      <div className="mb-4">
        <p className="text-white/70 text-sm mb-2">Content Type</p>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map(type => {
            const isActive = (localFilters.contentTypes || []).includes(type.value);
            return (
              <button
                key={type.value}
                onClick={() => toggleArrayFilter('contentTypes', type.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                  isActive 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <type.icon className="w-3.5 h-3.5" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Type */}
      <div className="mb-4">
        <p className="text-white/70 text-sm mb-2">Posted By</p>
        <div className="flex flex-wrap gap-2">
          {USER_TYPES.map(type => {
            const isActive = (localFilters.userTypes || []).includes(type.value);
            return (
              <button
                key={type.value}
                onClick={() => toggleArrayFilter('userTypes', type.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                  isActive 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <type.icon className="w-3.5 h-3.5" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div className="mb-4">
        <p className="text-white/70 text-sm mb-2">Location</p>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            placeholder="City, State, or Remote..."
            value={localFilters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="pl-9 bg-white/10 border-white/20 text-white placeholder-white/50 h-9"
          />
        </div>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <p className="text-white/70 text-sm mb-2">Skills</p>
        <div className="relative mb-2">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            placeholder="Add a skill..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSkill(skillInput)}
            className="pl-9 bg-white/10 border-white/20 text-white placeholder-white/50 h-9"
          />
        </div>
        
        {/* Selected Skills */}
        {(localFilters.skills || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {localFilters.skills.map(skill => (
              <Badge 
                key={skill} 
                className="bg-pink-500/20 text-pink-300 border border-pink-500/30 cursor-pointer hover:bg-pink-500/30"
                onClick={() => toggleArrayFilter('skills', skill)}
              >
                {skill} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}

        {/* Popular Skills */}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SKILLS.filter(s => !(localFilters.skills || []).includes(s)).slice(0, 8).map(skill => (
            <button
              key={skill}
              onClick={() => addSkill(skill)}
              className="px-2 py-1 rounded-full text-xs bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
            >
              + {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/10">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
        >
          Clear All
        </Button>
        <Button 
          size="sm" 
          onClick={applyFilters}
          className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
        >
          Apply Filters
        </Button>
      </div>
    </motion.div>
  );
}