import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, Coffee, Laptop, Users, Calendar, Zap, 
  Loader2, Info, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DayInLifePreview({ job, company }) {
  const [dayInLife, setDayInLife] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateDayInLife();
  }, [job?.id]);

  const generateDayInLife = async () => {
    if (!job) return;
    
    try {
      const prompt = `Generate a realistic "Day in the Life" summary for this role:
      
      Role: ${job.title}
      Company: ${company?.name || 'the company'}
      Industry: ${company?.industry || 'the industry'}
      Job Type: ${job.job_type}
      Location: ${job.location}
      
      Description: ${job.description?.substring(0, 300)}
      
      Create a brief, honest preview covering:
      1. Typical daily activities (3-4 bullet points)
      2. Work environment and pace
      3. Team interaction level
      4. Key challenges
      5. What makes a good day vs bad day
      
      Be realistic and specific. This helps candidates self-select.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            daily_activities: {
              type: "array",
              items: { type: "string" }
            },
            work_environment: { type: "string" },
            team_interaction: { type: "string" },
            key_challenges: { type: "string" },
            good_day: { type: "string" },
            bad_day: { type: "string" }
          }
        }
      });

      setDayInLife(result);
    } catch (error) {
      console.error('Failed to generate day in life:', error);
    }
    setLoading(false);
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

  if (!dayInLife) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-lg flex items-center gap-2">
          <Coffee className="w-5 h-5 text-blue-500" />
          Day in the Life
        </CardTitle>
        <p className="text-sm text-gray-600">Reality check before you apply</p>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <Info className="w-3 h-3" />
          <span>AI-generated based on role description and industry norms</span>
        </div>

        <div>
          <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Your Typical Day
          </h4>
          <ul className="space-y-2">
            {dayInLife.daily_activities?.map((activity, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span>{activity}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <h4 className="font-semibold text-sm text-purple-900 mb-2 flex items-center gap-2">
              <Laptop className="w-4 h-4" />
              Work Environment
            </h4>
            <p className="text-sm text-gray-700">{dayInLife.work_environment}</p>
          </div>

          <div className="p-3 bg-pink-50 rounded-xl">
            <h4 className="font-semibold text-sm text-pink-900 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Interaction
            </h4>
            <p className="text-sm text-gray-700">{dayInLife.team_interaction}</p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl">
          <h4 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Key Challenges
          </h4>
          <p className="text-sm text-gray-700">{dayInLife.key_challenges}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h4 className="font-semibold text-sm text-green-900">Good Day</h4>
            </div>
            <p className="text-xs text-gray-700">{dayInLife.good_day}</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <h4 className="font-semibold text-sm text-gray-900">Tough Day</h4>
            </div>
            <p className="text-xs text-gray-700">{dayInLife.bad_day}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}