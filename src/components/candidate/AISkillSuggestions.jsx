import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, X, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AISkillSuggestions({ candidate, headline, resumeUrl, onSkillsAdded }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [approvedSkills, setApprovedSkills] = useState(new Set());
  const [rejectedSkills, setRejectedSkills] = useState(new Set());

  useEffect(() => {
    if (headline || resumeUrl) {
      generateSuggestions();
    }
  }, [headline, resumeUrl]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const prompt = `Based on the following candidate information, suggest 8-10 highly relevant professional skills:

Job Title: ${headline || 'Professional'}
${resumeUrl ? 'Resume: Available' : ''}

Current Skills: ${candidate?.skills?.join(', ') || 'None listed'}

Requirements:
- Only suggest skills NOT already in their profile
- Focus on in-demand, marketable skills
- Include both technical and soft skills where appropriate
- Be specific (e.g., "React" not "frontend")
- Return ONLY a JSON array of skill strings, nothing else

Format: ["Skill 1", "Skill 2", ...]`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            skills: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      const skillsToSuggest = response.skills || [];
      const uniqueSkills = skillsToSuggest.filter(s => 
        !candidate?.skills?.includes(s) &&
        !approvedSkills.has(s) &&
        !rejectedSkills.has(s)
      );

      setSuggestions(uniqueSkills);
    } catch (error) {
      console.error('Failed to generate skill suggestions:', error);
      setSuggestions([]);
    }
    setLoading(false);
  };

  const approveSkill = (skill) => {
    const newApproved = new Set(approvedSkills);
    newApproved.add(skill);
    setApprovedSkills(newApproved);
    setSuggestions(suggestions.filter(s => s !== skill));
  };

  const rejectSkill = (skill) => {
    const newRejected = new Set(rejectedSkills);
    newRejected.add(skill);
    setRejectedSkills(newRejected);
    setSuggestions(suggestions.filter(s => s !== skill));
  };

  const applySkills = () => {
    if (approvedSkills.size > 0 && onSkillsAdded) {
      onSkillsAdded(Array.from(approvedSkills));
      setApprovedSkills(new Set());
    }
  };

  if (loading) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-800">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-blue-500 animate-spin" />
          <p className="text-sm text-blue-900 dark:text-blue-300 font-medium">
            Analyzing your profile for relevant skills...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0 && approvedSkills.size === 0) {
    return null;
  }

  return (
    <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 dark:border-pink-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">AI Skill Suggestions</h3>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          Review and approve skills that match your experience. Only approved skills will be added to your profile.
        </p>

        {/* Suggested Skills */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Review Suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((skill) => (
                <div key={skill} className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
                  <span className="text-sm text-gray-900 dark:text-white">{skill}</span>
                  <button
                    onClick={() => approveSkill(skill)}
                    className="ml-1 p-1 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                    title="Approve skill"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </button>
                  <button
                    onClick={() => rejectSkill(skill)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Reject skill"
                  >
                    <X className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Skills */}
        {approvedSkills.size > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">
              Approved Skills ({approvedSkills.size})
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {Array.from(approvedSkills).map((skill) => (
                <Badge 
                  key={skill}
                  className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {skill}
                  <button
                    onClick={() => {
                      const newApproved = new Set(approvedSkills);
                      newApproved.delete(skill);
                      setApprovedSkills(newApproved);
                    }}
                    className="ml-2"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <Button
              onClick={applySkills}
              className="w-full swipe-gradient text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {approvedSkills.size} Skill{approvedSkills.size !== 1 ? 's' : ''} to Profile
            </Button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Note:</strong> Only skills you approve will be added to your profile. AI suggestions are never automatically applied.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}