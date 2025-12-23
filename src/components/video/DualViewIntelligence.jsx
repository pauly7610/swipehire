import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, Star, CheckCircle2, XCircle, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Dual-View Intelligence
 * Same video, different data layers for candidates vs recruiters
 */
export default function DualViewIntelligence({ videoPost, candidate, job, viewerType, viewerId }) {
  const [intelligence, setIntelligence] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (viewerType && videoPost?.id) {
      loadIntelligence();
    }
  }, [videoPost, viewerType, viewerId]);

  const loadIntelligence = async () => {
    try {
      // Check if intelligence already exists
      const existing = await base44.entities.VideoIntelligence.filter({ video_post_id: videoPost.id });
      
      if (existing.length > 0) {
        setIntelligence(existing[0]);
      } else {
        // Generate new intelligence
        await generateIntelligence();
      }
    } catch (error) {
      console.error('Failed to load intelligence:', error);
    }
  };

  const generateIntelligence = async () => {
    setGenerating(true);
    try {
      const prompt = `Analyze this ${videoPost.type} video and generate hiring intelligence.
      
      Video context:
      - Caption: ${videoPost.caption}
      - Tags: ${videoPost.tags?.join(', ')}
      - Type: ${videoPost.type}
      ${candidate ? `- Candidate: ${candidate.headline}, Skills: ${candidate.skills?.join(', ')}` : ''}
      ${job ? `- Job: ${job.title}, Requirements: ${job.skills_required?.join(', ')}` : ''}
      
      Generate:
      1. Match score (0-100) if viewer is a recruiter
      2. Why this matches the viewer's needs
      3. Why recruiters swipe right (for candidates)
      4. Skill confidence index
      5. Risk flags if any (job hopping, gaps, low signal)
      
      Return as structured JSON.`;

      const aiData = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            match_score: { type: "number" },
            why_match: { type: "string" },
            why_recruiters_swipe: { type: "string" },
            skill_confidence: {
              type: "object",
              properties: {
                skills: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      skill: { type: "string" },
                      confidence: { type: "number" }
                    }
                  }
                }
              }
            },
            risk_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  flag: { type: "string" },
                  severity: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });

      const newIntelligence = await base44.entities.VideoIntelligence.create({
        video_post_id: videoPost.id,
        candidate_id: candidate?.id,
        job_id: job?.id,
        match_score_for_viewer: aiData.match_score,
        why_match: aiData.why_match,
        why_recruiters_swipe: aiData.why_recruiters_swipe,
        skill_confidence_index: aiData.skill_confidence,
        risk_flags: aiData.risk_flags || [],
        generated_at: new Date().toISOString()
      });

      setIntelligence(newIntelligence);
    } catch (error) {
      console.error('Failed to generate intelligence:', error);
    }
    setGenerating(false);
  };

  if (generating) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="px-4 py-2 bg-black/80 backdrop-blur-md rounded-full text-white text-xs flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Analyzing...
        </div>
      </div>
    );
  }

  if (!intelligence) return null;

  return (
    <div className="fixed right-4 bottom-20 z-15 pointer-events-auto w-64 hidden md:block">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card className="bg-black/90 backdrop-blur-xl border border-white/30 text-white shadow-2xl">
          <div className="p-2.5 space-y-1.5">
            {/* Candidate View */}
            {viewerType === 'candidate' && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-green-400">Why recruiters swipe right:</p>
                    <p className="text-xs text-white/90 leading-relaxed">{intelligence.why_recruiters_swipe}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recruiter View */}
            {viewerType === 'employer' && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-yellow-400">Why this matches:</p>
                    <p className="text-xs text-white/90 leading-relaxed">{intelligence.why_match}</p>
                  </div>
                </div>

                {/* Skill Confidence */}
                {intelligence.skill_confidence_index?.skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-blue-400 mb-1">Skill Confidence</p>
                    <div className="space-y-1">
                      {intelligence.skill_confidence_index.skills.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-white/80 flex-1">{item.skill}</span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, idx) => (
                              <div 
                                key={idx}
                                className={`w-1.5 h-3 rounded-sm ${idx < Math.round(item.confidence/20) ? 'bg-blue-400' : 'bg-white/20'}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Flags */}
                {intelligence.risk_flags?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-orange-400 mb-1">Risk Flags</p>
                    <div className="space-y-1">
                      {intelligence.risk_flags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${
                            flag.severity === 'high' ? 'text-red-400' :
                            flag.severity === 'medium' ? 'text-orange-400' : 'text-yellow-400'
                          }`} />
                          <div>
                            <p className="text-xs font-medium text-white/90">{flag.flag}</p>
                            <p className="text-[10px] text-white/60">{flag.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}