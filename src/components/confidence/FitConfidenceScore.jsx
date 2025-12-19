import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Award, Target, Zap, ChevronDown, ChevronUp, 
  CheckCircle, AlertCircle, Info, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

export default function FitConfidenceScore({ candidate, job, compact = false }) {
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadConfidence();
  }, [candidate?.id, job?.id]);

  const loadConfidence = async () => {
    if (!candidate?.id || !job?.id) return;
    
    try {
      const [existing] = await base44.entities.FitConfidence.filter({
        candidate_id: candidate.id,
        job_id: job.id
      });

      if (existing) {
        setConfidence(existing);
      } else {
        await calculateConfidence();
      }
    } catch (error) {
      console.error('Failed to load confidence:', error);
    }
    setLoading(false);
  };

  const calculateConfidence = async () => {
    setCalculating(true);
    try {
      // Skills match
      const candidateSkills = candidate.skills || [];
      const requiredSkills = job.skills_required || [];
      const matchingSkills = candidateSkills.filter(s => 
        requiredSkills.some(r => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase()))
      );
      const skillsScore = requiredSkills.length > 0 
        ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
        : 50;

      // Experience level
      const expYears = candidate.experience_years || 0;
      const minYears = job.experience_years_min || 0;
      const maxYears = job.experience_years_max || 100;
      let experienceScore = 0;
      if (expYears >= minYears && expYears <= maxYears) {
        experienceScore = 100;
      } else if (expYears < minYears) {
        experienceScore = Math.max(0, 100 - ((minYears - expYears) * 15));
      } else {
        experienceScore = 80;
      }

      // Career trajectory
      const trajectoryScore = candidate.experience?.length > 0 ? 85 : 60;

      // Role readiness (based on profile completeness)
      let readinessScore = 60;
      if (candidate.resume_url) readinessScore += 15;
      if (candidate.video_intro_url) readinessScore += 10;
      if (candidate.portfolio_projects?.length > 0) readinessScore += 15;

      // Interview preparedness
      const sessions = await base44.entities.InterviewSession.filter({
        candidate_id: candidate.id,
        completion_status: 'completed'
      });
      const prepScore = sessions.length > 0 ? Math.min(100, 60 + (sessions.length * 20)) : 40;

      // Overall calculation
      const overallScore = Math.round(
        (skillsScore * 0.35) +
        (experienceScore * 0.25) +
        (trajectoryScore * 0.15) +
        (readinessScore * 0.15) +
        (prepScore * 0.10)
      );

      const confidenceLevel = overallScore >= 75 ? 'high' : overallScore >= 55 ? 'medium' : 'low';

      // Generate explainer
      const prompt = `Explain this job fit score in 1-2 sentences for a candidate:
      
      Score: ${overallScore}/100
      Skills Match: ${skillsScore}%
      Experience Match: ${experienceScore}%
      
      Job: ${job.title}
      Candidate Level: ${candidate.experience_level || 'mid'}
      
      Be encouraging but honest.`;

      const explainer = await base44.integrations.Core.InvokeLLM({ prompt });

      const newConfidence = await base44.entities.FitConfidence.create({
        candidate_id: candidate.id,
        job_id: job.id,
        confidence_level: confidenceLevel,
        confidence_score: overallScore,
        factors: {
          skills_match: {
            score: skillsScore,
            explanation: `${matchingSkills.length} of ${requiredSkills.length} required skills`
          },
          experience_level: {
            score: experienceScore,
            explanation: `${expYears} years experience (${minYears}-${maxYears} preferred)`
          },
          career_trajectory: {
            score: trajectoryScore,
            explanation: 'Career progression analysis'
          },
          role_readiness: {
            score: readinessScore,
            explanation: 'Profile completeness and presentation'
          },
          interview_preparedness: {
            score: prepScore,
            explanation: `Completed ${sessions.length} practice session${sessions.length !== 1 ? 's' : ''}`
          }
        },
        explainer: explainer.trim()
      });

      setConfidence(newConfidence);
    } catch (error) {
      console.error('Failed to calculate confidence:', error);
    }
    setCalculating(false);
  };

  if (loading || calculating) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  if (!confidence) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <Button onClick={calculateConfidence} className="w-full swipe-gradient text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Calculate Fit Confidence
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getColorClass = () => {
    switch (confidence.confidence_level) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getIcon = () => {
    switch (confidence.confidence_level) {
      case 'high': return CheckCircle;
      case 'medium': return AlertCircle;
      case 'low': return Info;
      default: return Info;
    }
  };

  const Icon = getIcon();

  return (
    <Card className={`border-2 ${getColorClass()} overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-5 h-5" />
              <h3 className="font-bold text-lg capitalize">{confidence.confidence_level} Fit Confidence</h3>
            </div>
            <p className="text-sm opacity-80">{confidence.explainer}</p>
          </div>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Score</span>
            <span className="text-2xl font-bold">{confidence.confidence_score}%</span>
          </div>
          <Progress 
            value={confidence.confidence_score} 
            className="h-3"
          />
        </div>

        <AnimatePresence>
          {expanded && confidence.factors && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 mt-4 pt-4 border-t"
            >
              {Object.entries(confidence.factors).map(([key, factor]) => {
                const icons = {
                  skills_match: Award,
                  experience_level: Target,
                  career_trajectory: TrendingUp,
                  role_readiness: CheckCircle,
                  interview_preparedness: Zap
                };
                const FactorIcon = icons[key] || Info;
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <FactorIcon className="w-4 h-4" />
                        {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                      <Badge variant="secondary">{factor.score}%</Badge>
                    </div>
                    <p className="text-xs opacity-70">{factor.explanation}</p>
                    <Progress value={factor.score} className="h-2" />
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}