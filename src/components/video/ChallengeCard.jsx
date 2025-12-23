import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Zap, Clock, Users, Video, Play, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ChallengeCard({ challenge, company, job, onRespond, userHasResponded }) {
  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const loadResponses = async () => {
    if (responses.length > 0) {
      setShowResponses(!showResponses);
      return;
    }
    
    setLoadingResponses(true);
    try {
      const data = await base44.entities.ChallengeResponse.filter({ challenge_id: challenge.id });
      setResponses(data);
      setShowResponses(true);
    } catch (error) {
      console.error('Failed to load responses:', error);
    }
    setLoadingResponses(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="mb-3"
    >
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-300/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Challenge from {company?.name}</CardTitle>
                {job && <p className="text-xs text-gray-600">{job.title}</p>}
              </div>
            </div>
            <Badge className="bg-purple-500 text-white text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {challenge.max_duration_seconds}s
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold">Prompt:</span> {challenge.prompt}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {challenge.response_count || 0} responses
              </span>
            </div>
            
            {userHasResponded ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Submitted
              </Badge>
            ) : (
              <Button 
                size="sm" 
                onClick={() => onRespond?.(challenge)}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Video className="w-3 h-3 mr-1" />
                Respond
              </Button>
            )}
          </div>

          {/* View Responses */}
          {challenge.response_count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={loadResponses}
              disabled={loadingResponses}
              className="w-full text-purple-600 hover:text-purple-700"
            >
              <Play className="w-3 h-3 mr-1" />
              {showResponses ? 'Hide' : 'View'} Responses
            </Button>
          )}

          {showResponses && (
            <div className="pt-2 border-t border-purple-200 space-y-2">
              {responses.map((response) => (
                <div key={response.id} className="flex items-center gap-2 p-2 bg-white/50 rounded-lg">
                  <Video className="w-4 h-4 text-purple-500" />
                  <div className="flex-1 text-xs">
                    <p className="font-medium">Response</p>
                    {response.ai_evaluation && (
                      <p className="text-gray-600">Score: {response.ai_evaluation.overall_score}/100</p>
                    )}
                  </div>
                  <a 
                    href={response.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-500 hover:text-purple-700"
                  >
                    <Play className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}