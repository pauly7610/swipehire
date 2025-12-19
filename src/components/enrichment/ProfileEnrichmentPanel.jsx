import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Check, X, ArrowRight, Loader2, AlertCircle,
  TrendingUp, Award, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ProfileEnrichmentPanel({ candidate, onEnrichmentAccepted }) {
  const [enrichments, setEnrichments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadEnrichments();
  }, [candidate?.id]);

  const loadEnrichments = async () => {
    if (!candidate?.id) return;
    
    try {
      const pending = await base44.entities.CandidateEnrichment.filter({
        candidate_id: candidate.id,
        status: 'pending'
      });
      setEnrichments(pending);
    } catch (error) {
      console.error('Failed to load enrichments:', error);
    }
    setLoading(false);
  };

  const generateEnrichments = async () => {
    setGenerating(true);
    try {
      const suggestions = [];

      // Title normalization
      if (candidate.headline) {
        const titlePrompt = `Normalize this job title to industry standard: "${candidate.headline}"
        
        Return ONLY the normalized title, nothing else.`;
        
        const normalizedTitle = await base44.integrations.Core.InvokeLLM({
          prompt: titlePrompt
        });

        if (normalizedTitle.trim() !== candidate.headline) {
          suggestions.push({
            candidate_id: candidate.id,
            enrichment_type: 'title_normalization',
            original_value: candidate.headline,
            suggested_value: normalizedTitle.trim(),
            reasoning: 'Industry-standard title format',
            confidence_score: 85,
            field_path: 'headline'
          });
        }
      }

      // Skill inference from experience
      if (candidate.experience?.length > 0) {
        const expText = candidate.experience.map(e => e.description).join(' ');
        const skillPrompt = `Based on this experience, suggest 3-5 skills that should be on this candidate's profile but might be missing:

Experience: ${expText.substring(0, 500)}
Current skills: ${candidate.skills?.join(', ') || 'None listed'}

Return ONLY a comma-separated list of skills.`;

        const inferredSkills = await base44.integrations.Core.InvokeLLM({
          prompt: skillPrompt
        });

        const newSkills = inferredSkills.split(',').map(s => s.trim()).filter(s => 
          s && !candidate.skills?.includes(s)
        );

        if (newSkills.length > 0) {
          suggestions.push({
            candidate_id: candidate.id,
            enrichment_type: 'skill_inference',
            original_value: candidate.skills?.join(', ') || '',
            suggested_value: newSkills.join(', '),
            reasoning: 'Inferred from your experience',
            confidence_score: 75,
            field_path: 'skills'
          });
        }
      }

      // Career level detection
      const yearsExp = candidate.experience_years || 0;
      let suggestedLevel = 'mid';
      if (yearsExp < 2) suggestedLevel = 'entry';
      else if (yearsExp >= 8) suggestedLevel = 'senior';
      else if (yearsExp >= 12) suggestedLevel = 'lead';

      if (candidate.experience_level !== suggestedLevel) {
        suggestions.push({
          candidate_id: candidate.id,
          enrichment_type: 'career_level',
          original_value: candidate.experience_level || 'not set',
          suggested_value: suggestedLevel,
          reasoning: `Based on ${yearsExp} years of experience`,
          confidence_score: 90,
          field_path: 'experience_level'
        });
      }

      // Bulk create suggestions
      if (suggestions.length > 0) {
        await base44.entities.CandidateEnrichment.bulkCreate(suggestions);
        await loadEnrichments();
        toast.success(`Generated ${suggestions.length} improvement suggestions`);
      } else {
        toast.info('Your profile looks complete!');
      }
    } catch (error) {
      console.error('Failed to generate enrichments:', error);
      toast.error('Failed to generate suggestions');
    }
    setGenerating(false);
  };

  const handleAccept = async (enrichment) => {
    setProcessingId(enrichment.id);
    try {
      await base44.entities.CandidateEnrichment.update(enrichment.id, {
        status: 'accepted'
      });

      // Apply the change to candidate profile
      const updateData = {};
      if (enrichment.field_path === 'headline') {
        updateData.headline = enrichment.suggested_value;
      } else if (enrichment.field_path === 'skills') {
        const newSkills = enrichment.suggested_value.split(',').map(s => s.trim());
        updateData.skills = [...(candidate.skills || []), ...newSkills];
      } else if (enrichment.field_path === 'experience_level') {
        updateData.experience_level = enrichment.suggested_value;
      }

      await base44.entities.Candidate.update(candidate.id, updateData);
      
      setEnrichments(enrichments.filter(e => e.id !== enrichment.id));
      if (onEnrichmentAccepted) onEnrichmentAccepted(updateData);
      toast.success('Profile updated!');
    } catch (error) {
      console.error('Failed to accept enrichment:', error);
      toast.error('Failed to update profile');
    }
    setProcessingId(null);
  };

  const handleReject = async (enrichment) => {
    setProcessingId(enrichment.id);
    try {
      await base44.entities.CandidateEnrichment.update(enrichment.id, {
        status: 'rejected'
      });
      setEnrichments(enrichments.filter(e => e.id !== enrichment.id));
      toast.info('Suggestion dismissed');
    } catch (error) {
      console.error('Failed to reject enrichment:', error);
    }
    setProcessingId(null);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'title_normalization': return TrendingUp;
      case 'skill_inference': return Award;
      case 'career_level': return Target;
      default: return Sparkles;
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            Profile Improvements
          </CardTitle>
          {enrichments.length === 0 && (
            <Button
              onClick={generateEnrichments}
              disabled={generating}
              size="sm"
              className="swipe-gradient text-white"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Generate
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {enrichments.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 mb-4">
              {generating ? 'Analyzing your profile...' : 'Get AI-powered suggestions to improve your profile'}
            </p>
            {!generating && (
              <Button onClick={generateEnrichments} className="swipe-gradient text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Profile
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {enrichments.map((enrichment, i) => {
                const Icon = getIcon(enrichment.enrichment_type);
                return (
                  <motion.div
                    key={enrichment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="border border-pink-100 bg-gradient-to-br from-white to-pink-50/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-pink-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-gray-900">
                                {enrichment.enrichment_type.split('_').map(w => 
                                  w.charAt(0).toUpperCase() + w.slice(1)
                                ).join(' ')}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {enrichment.confidence_score}% confident
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{enrichment.reasoning}</p>
                            
                            <div className="bg-white rounded-lg p-3 space-y-2">
                              <div>
                                <span className="text-xs text-gray-500">Current:</span>
                                <p className="text-sm text-gray-700 line-through">
                                  {enrichment.original_value || 'Not set'}
                                </p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-pink-500 mx-auto" />
                              <div>
                                <span className="text-xs text-gray-500">Suggested:</span>
                                <p className="text-sm font-medium text-gray-900">
                                  {enrichment.suggested_value}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAccept(enrichment)}
                            disabled={processingId === enrichment.id}
                            size="sm"
                            className="flex-1 swipe-gradient text-white"
                          >
                            {processingId === enrichment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleReject(enrichment)}
                            disabled={processingId === enrichment.id}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}