import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  TrendingUp, CheckCircle, AlertTriangle, XCircle, 
  ChevronDown, ChevronUp, Edit2, Save, X 
} from 'lucide-react';

const fitRangeConfig = {
  core_fit: {
    label: 'Core Fit',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle
  },
  adjacent_fit: {
    label: 'Adjacent Fit',
    color: 'bg-blue-100 text-blue-700',
    icon: TrendingUp
  },
  stretch_fit: {
    label: 'Stretch Fit',
    color: 'bg-yellow-100 text-yellow-700',
    icon: AlertTriangle
  },
  misaligned: {
    label: 'Misaligned',
    color: 'bg-red-100 text-red-700',
    icon: XCircle
  }
};

export default function EvaluationCard({ evaluation, rank, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(evaluation.recruiter_notes || '');

  const config = fitRangeConfig[evaluation.fit_range] || fitRangeConfig.misaligned;
  const Icon = config.icon;

  const getScoreColor = (score) => {
    if (score >= 8.5) return 'text-green-600';
    if (score >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSaveNotes = async () => {
    try {
      await base44.entities.CandidateEvaluation.update(evaluation.id, {
        recruiter_notes: notes,
        overridden_by: evaluation.overridden_by || 'current_user'
      });
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {rank && (
                <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold">
                  #{rank}
                </Badge>
              )}
              <div className={`text-3xl font-bold ${getScoreColor(evaluation.score)}`}>
                {evaluation.score.toFixed(1)}
              </div>
              <Badge className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{evaluation.verdict}</p>
            <p className="text-xs text-gray-400 mt-1">
              AI-assisted recruiter evaluation • {new Date(evaluation.generated_at).toLocaleDateString()}
            </p>
          </div>
          <Button variant="ghost" size="sm">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* Alignment Highlights */}
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Alignment Highlights
            </h4>
            <ul className="space-y-1">
              {evaluation.alignment_highlights?.map((highlight, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
              {(!evaluation.alignment_highlights || evaluation.alignment_highlights.length === 0) && (
                <p className="text-sm text-gray-400">No highlights identified</p>
              )}
            </ul>
          </div>

          {/* Gaps & Concerns */}
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Gaps & Concerns
            </h4>
            <ul className="space-y-1">
              {evaluation.gaps_concerns?.map((gap, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
              {(!evaluation.gaps_concerns || evaluation.gaps_concerns.length === 0) && (
                <p className="text-sm text-green-600">No major gaps identified</p>
              )}
            </ul>
          </div>

          {/* Recruiter Override */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Recruiter Notes</h4>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="w-3 h-3 mr-1" /> Add Notes
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                  <Button size="sm" onClick={handleSaveNotes} className="swipe-gradient text-white">
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                </div>
              )}
            </div>
            {editing ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes or override the AI evaluation..."
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-600">
                {evaluation.recruiter_notes || 'No notes added'}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}