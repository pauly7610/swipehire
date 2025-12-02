import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, FileText, Link2, Sparkles, Loader2, 
  Building2, Users, Briefcase, ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContentSuggestions({ candidate, job, company }) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (candidate && (job || company)) {
      generateSuggestions();
    }
  }, [candidate, job, company]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest relevant company content for a job candidate based on their interests.

Candidate Profile:
- Headline: ${candidate.headline || 'Job Seeker'}
- Skills: ${candidate.skills?.slice(0, 5).join(', ') || 'Various'}
- Culture preferences: ${candidate.culture_preferences?.join(', ') || 'Not specified'}

${job ? `Job Applied: ${job.title}` : ''}

Company Info:
- Name: ${company?.name || 'Company'}
- Industry: ${company?.industry || 'Technology'}
- Culture: ${company?.culture_traits?.join(', ') || 'Innovative'}
- Benefits: ${company?.benefits?.slice(0, 5).join(', ') || 'Competitive'}

Generate 4 content suggestions (blog posts, videos, resources) that would help this candidate learn about the company and role. Include a mix of:
1. Company culture/values content
2. Role-specific insights
3. Employee stories/testimonials
4. Industry trends

Make titles specific and engaging.`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['video', 'blog', 'guide', 'testimonial'] },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  relevance: { type: 'string' },
                  estimated_time: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
    setLoading(false);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'blog': return <FileText className="w-4 h-4" />;
      case 'guide': return <Briefcase className="w-4 h-4" />;
      case 'testimonial': return <Users className="w-4 h-4" />;
      default: return <Link2 className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'video': return 'from-red-500 to-pink-500';
      case 'blog': return 'from-blue-500 to-purple-500';
      case 'guide': return 'from-green-500 to-teal-500';
      case 'testimonial': return 'from-amber-500 to-orange-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-pink-500 mr-2" />
            <span className="text-gray-500">Finding relevant content...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Recommended for You
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {suggestions.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeColor(item.type)} flex items-center justify-center text-white flex-shrink-0`}>
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                  <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs capitalize">{item.type}</Badge>
                  <span className="text-xs text-gray-400">{item.estimated_time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {company && (
          <div className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-pink-500" />
              <span className="text-gray-600">Curated content from</span>
              <span className="font-medium text-gray-900">{company.name}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}