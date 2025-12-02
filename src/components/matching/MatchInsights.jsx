import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, Star, Briefcase, MapPin, DollarSign, 
  Users, Sparkles, AlertTriangle, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MatchInsights({ insights, score }) {
  if (!insights) return null;

  const getInsightIcon = (type) => {
    const icons = {
      skills: CheckCircle2,
      experience: Briefcase,
      culture: Users,
      location: MapPin,
      salary: DollarSign,
      highlight: Star,
      warning: AlertTriangle
    };
    return icons[type] || Sparkles;
  };

  const getInsightColor = (type, isPositive) => {
    if (type === 'warning') return 'text-amber-500 bg-amber-50';
    if (!isPositive) return 'text-gray-500 bg-gray-50';
    const colors = {
      skills: 'text-green-600 bg-green-50',
      experience: 'text-blue-600 bg-blue-50',
      culture: 'text-purple-600 bg-purple-50',
      location: 'text-teal-600 bg-teal-50',
      salary: 'text-emerald-600 bg-emerald-50',
      highlight: 'text-pink-600 bg-pink-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" />
          Why This Candidate?
        </h4>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="font-bold text-green-600">{score}%</span>
        </div>
      </div>

      <div className="space-y-2">
        {insights.map((insight, index) => {
          const Icon = getInsightIcon(insight.type);
          const colorClass = getInsightColor(insight.type, insight.isPositive !== false);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-2 p-2 rounded-lg ${colorClass.split(' ')[1]}`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass.split(' ')[0]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{insight.text}</p>
                {insight.details && (
                  <p className="text-xs text-gray-500 mt-0.5">{insight.details}</p>
                )}
              </div>
              {insight.score && (
                <Badge variant="secondary" className="text-xs">
                  +{insight.score}%
                </Badge>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}