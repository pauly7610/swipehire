import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, CheckCircle, Info, ArrowRight, 
  Loader2, AlertTriangle, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

export default function ApplicationReadinessGate({ 
  candidate, 
  job, 
  onProceed, 
  onCancel 
}) {
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateReadiness();
  }, [candidate?.id, job?.id]);

  const calculateReadiness = async () => {
    if (!candidate || !job) return;
    
    try {
      const missingItems = [];
      let score = 100;

      // Check critical items
      if (!candidate.resume_url) {
        missingItems.push({
          item: 'Resume/CV',
          importance: 'critical',
          suggestion: 'Upload your resume to increase your chances'
        });
        score -= 25;
      }

      if (!candidate.headline) {
        missingItems.push({
          item: 'Professional headline',
          importance: 'critical',
          suggestion: 'Add a clear headline describing your role'
        });
        score -= 20;
      }

      // Check recommended items
      if (!candidate.skills || candidate.skills.length < 3) {
        missingItems.push({
          item: 'Skills list',
          importance: 'recommended',
          suggestion: 'Add at least 5 relevant skills'
        });
        score -= 15;
      }

      if (!candidate.experience || candidate.experience.length === 0) {
        missingItems.push({
          item: 'Work experience',
          importance: 'recommended',
          suggestion: 'Add your work history'
        });
        score -= 15;
      }

      // Nice to have
      if (!candidate.portfolio_projects || candidate.portfolio_projects.length === 0) {
        missingItems.push({
          item: 'Portfolio/Projects',
          importance: 'nice-to-have',
          suggestion: 'Showcase your work with examples'
        });
        score -= 10;
      }

      if (!candidate.video_intro_url) {
        missingItems.push({
          item: 'Video introduction',
          importance: 'nice-to-have',
          suggestion: 'Stand out with a 30-second intro'
        });
        score -= 10;
      }

      // Profile completeness
      const profileFields = ['headline', 'bio', 'location', 'skills', 'experience', 'education'];
      const completedFields = profileFields.filter(field => {
        const value = candidate[field];
        return value && (Array.isArray(value) ? value.length > 0 : true);
      });
      const completeness = Math.round((completedFields.length / profileFields.length) * 100);

      const readinessData = await base44.entities.ApplicationReadiness.create({
        candidate_id: candidate.id,
        job_id: job.id,
        readiness_score: Math.max(0, score),
        missing_items: missingItems,
        profile_completeness: completeness,
        responsiveness_likelihood: 'medium',
        interview_readiness: score >= 75 ? 'ready' : score >= 50 ? 'partially_ready' : 'not_ready',
        career_stability_signal: 'medium'
      });

      setReadiness(readinessData);
    } catch (error) {
      console.error('Failed to calculate readiness:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  if (!readiness) return null;

  const criticalMissing = readiness.missing_items?.filter(i => i.importance === 'critical') || [];
  const recommendedMissing = readiness.missing_items?.filter(i => i.importance === 'recommended') || [];
  const niceToHave = readiness.missing_items?.filter(i => i.importance === 'nice-to-have') || [];

  const canProceed = criticalMissing.length === 0;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          Application Readiness Check
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Overall Score */}
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-2">Readiness Score</p>
          <p className="text-4xl font-bold text-purple-600 mb-2">
            {readiness.readiness_score}%
          </p>
          <Progress value={readiness.readiness_score} className="h-2 mb-2" />
          <Badge 
            className={
              readiness.readiness_score >= 75 ? 'bg-green-500' :
              readiness.readiness_score >= 50 ? 'bg-amber-500' :
              'bg-red-500'
            }
          >
            {readiness.interview_readiness.replace('_', ' ')}
          </Badge>
        </div>

        {/* Critical Missing Items */}
        {criticalMissing.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Critical Requirements ({criticalMissing.length})
            </h4>
            <AnimatePresence>
              {criticalMissing.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-red-900">{item.item}</p>
                      <p className="text-xs text-red-700 mt-1">{item.suggestion}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Recommended Items */}
        {recommendedMissing.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Recommended ({recommendedMissing.length})
            </h4>
            {recommendedMissing.map((item, i) => (
              <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-amber-900">{item.item}</p>
                    <p className="text-xs text-amber-700 mt-1">{item.suggestion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nice to Have */}
        {niceToHave.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-600 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Nice to Have ({niceToHave.length})
            </h4>
            {niceToHave.map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-700">{item.item}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.suggestion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Completeness */}
        <div className="p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Profile Completeness</span>
            <span className="text-lg font-bold text-blue-600">{readiness.profile_completeness}%</span>
          </div>
          <Progress value={readiness.profile_completeness} className="h-2" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Complete Profile First
            </Button>
          )}
          <Button
            onClick={onProceed}
            disabled={!canProceed}
            className={`flex-1 ${canProceed ? 'swipe-gradient text-white' : 'bg-gray-200'}`}
          >
            {canProceed ? (
              <>
                Proceed to Apply
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              'Complete Critical Items'
            )}
          </Button>
        </div>

        {!canProceed && (
          <p className="text-xs text-center text-red-600">
            You must complete all critical requirements before applying
          </p>
        )}
      </CardContent>
    </Card>
  );
}