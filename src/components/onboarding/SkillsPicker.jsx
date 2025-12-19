import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Common skills taxonomy with synonyms
const SKILLS_TAXONOMY = {
  'JavaScript': ['js', 'javascript', 'ecmascript'],
  'TypeScript': ['ts', 'typescript'],
  'React': ['reactjs', 'react.js'],
  'Vue': ['vuejs', 'vue.js'],
  'Angular': ['angularjs'],
  'Node.js': ['nodejs', 'node'],
  'Python': ['py'],
  'Java': [],
  'C++': ['cpp', 'c plus plus'],
  'C#': ['csharp', 'c sharp'],
  'SQL': ['mysql', 'postgresql', 'sql server'],
  'MongoDB': ['mongo'],
  'AWS': ['amazon web services'],
  'Azure': ['microsoft azure'],
  'Docker': [],
  'Kubernetes': ['k8s'],
  'React Native': [],
  'Swift': [],
  'Kotlin': [],
  'Go': ['golang'],
  'Rust': [],
  'Ruby': [],
  'PHP': [],
  'HTML': ['html5'],
  'CSS': ['css3'],
  'Git': [],
  'Figma': [],
  'Adobe XD': [],
  'Photoshop': [],
  'Illustrator': [],
  'Project Management': [],
  'Agile': ['scrum'],
  'Leadership': [],
  'Communication': [],
  'Problem Solving': [],
};

const POPULAR_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 
  'SQL', 'AWS', 'Docker', 'Git', 'Agile'
];

export default function SkillsPicker({ skills = [], onChange, showProficiency = false }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const normalizeSkill = (skill) => {
    const lower = skill.toLowerCase().trim();
    
    // Check if it's a canonical skill or synonym
    for (const [canonical, synonyms] of Object.entries(SKILLS_TAXONOMY)) {
      if (canonical.toLowerCase() === lower || synonyms.includes(lower)) {
        return canonical;
      }
    }
    
    // Return capitalized version
    return skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
  };

  const handleInputChange = (value) => {
    setInput(value);
    
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    
    const lower = value.toLowerCase();
    const matches = Object.keys(SKILLS_TAXONOMY).filter(skill => 
      skill.toLowerCase().includes(lower)
    ).slice(0, 5);
    
    setSuggestions(matches);
  };

  const addSkill = (skillName) => {
    const normalized = normalizeSkill(skillName);
    
    if (!normalized) return;
    
    // Check for duplicates
    if (skills.some(s => s.skill?.toLowerCase() === normalized.toLowerCase())) {
      return;
    }
    
    onChange([...skills, { skill: normalized, proficiency: 'intermediate' }]);
    setInput('');
    setSuggestions([]);
  };

  const removeSkill = (index) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const updateProficiency = (index, proficiency) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], proficiency };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <div>
        <Label>Search and add skills</Label>
        <div className="relative mt-2">
          <Input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (input.trim()) {
                  addSkill(input);
                }
              }
            }}
            placeholder="Type a skill (e.g., JavaScript, Python...)"
            className="pr-12"
          />
          {input && (
            <Button
              type="button"
              size="sm"
              onClick={() => addSkill(input)}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 swipe-gradient text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular Skills */}
      {skills.length === 0 && (
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Popular Skills
          </Label>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SKILLS.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="text-sm px-3 py-1.5 bg-gradient-to-r from-pink-50 to-orange-50 hover:from-pink-100 hover:to-orange-100 text-pink-700 rounded-lg transition-colors border border-pink-200"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Skills */}
      {skills.length > 0 && (
        <div>
          <Label>Your skills ({skills.length})</Label>
          <div className="mt-2 space-y-2">
            {skills.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg border border-pink-100"
              >
                <span className="flex-1 font-medium text-gray-900">{item.skill}</span>
                
                {showProficiency && (
                  <select
                    value={item.proficiency}
                    onChange={(e) => updateProficiency(index, e.target.value)}
                    className="px-3 py-1 bg-white border border-gray-200 rounded text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                )}
                
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="p-1 hover:bg-red-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Add at least 3 skills to improve your profile visibility
        </p>
      )}
    </div>
  );
}