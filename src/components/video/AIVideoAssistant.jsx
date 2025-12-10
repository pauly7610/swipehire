import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, Copy, Check, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AIVideoAssistant({ videoType, onApplySuggestions, userType, jobTitle, companyName }) {
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('caption');
  const [suggestions, setSuggestions] = useState({
    caption: '',
    tags: [],
    script: ''
  });
  const [copied, setCopied] = useState(false);

  const generateCaption = async () => {
    setGenerating(true);
    try {
      const context = userType === 'employer' 
        ? `company: ${companyName}, video type: ${videoType}`
        : `job seeker, role: ${jobTitle}, video type: ${videoType}`;
      
      const prompt = `Generate an engaging, professional social media caption for a ${videoType} video post on a job recruitment platform. Context: ${context}. 
      Requirements:
      - 50-150 characters
      - Professional yet conversational
      - Include relevant emojis (max 2)
      - No hashtags (we handle those separately)
      - Make it attention-grabbing
      
      Return only the caption text.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setSuggestions(prev => ({ ...prev, caption: response }));
    } catch (error) {
      console.error('Failed to generate caption:', error);
    }
    setGenerating(false);
  };

  const generateTags = async () => {
    setGenerating(true);
    try {
      const context = userType === 'employer'
        ? `company: ${companyName}, video type: ${videoType}`
        : `job seeker, role: ${jobTitle}, video type: ${videoType}`;

      const prompt = `Generate 5-8 relevant tags for a ${videoType} video on a job recruitment platform. Context: ${context}.
      Requirements:
      - Short, single-word or 2-word tags
      - Mix of skills, industries, and general career terms
      - Relevant for job search/recruitment
      - No # symbols
      
      Return as JSON array: ["tag1", "tag2", ...]`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tags: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSuggestions(prev => ({ ...prev, tags: response.tags || [] }));
    } catch (error) {
      console.error('Failed to generate tags:', error);
    }
    setGenerating(false);
  };

  const generateScript = async () => {
    setGenerating(true);
    try {
      let scriptPrompt = '';
      
      if (videoType === 'intro') {
        scriptPrompt = `Create a 30-second video introduction script for a job seeker${jobTitle ? ` who is a ${jobTitle}` : ''}. 
        Include:
        - Greeting and name placeholder [YOUR NAME]
        - Current role or what they're looking for
        - 2-3 key skills or achievements
        - Call to action (connect/reach out)
        
        Make it natural, confident, and personable.`;
      } else if (videoType === 'job_post') {
        scriptPrompt = `Create a 30-second job opening video script for ${companyName || 'a company'}.
        Include:
        - Hook about the opportunity
        - Key role responsibilities
        - What makes it exciting
        - Call to action (apply now)
        
        Make it energetic and compelling.`;
      } else if (videoType === 'company_culture') {
        scriptPrompt = `Create a 30-second company culture video script for ${companyName || 'a company'}.
        Include:
        - What makes the workplace special
        - Team/culture highlights
        - Employee perks or values
        - Invitation to join
        
        Make it authentic and inviting.`;
      } else {
        scriptPrompt = `Create a 30-second ${videoType} video script for ${userType === 'employer' ? companyName : `a ${jobTitle || 'professional'}`}.
        Make it engaging, informative, and include a clear call to action.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: scriptPrompt,
        add_context_from_internet: false
      });

      setSuggestions(prev => ({ ...prev, script: response }));
    } catch (error) {
      console.error('Failed to generate script:', error);
    }
    setGenerating(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyAll = () => {
    onApplySuggestions({
      caption: suggestions.caption,
      tags: suggestions.tags.join(', ')
    });
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Content Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <Badge
            className={`cursor-pointer ${activeTab === 'caption' ? 'bg-purple-500 text-white' : 'bg-white text-gray-600'}`}
            onClick={() => setActiveTab('caption')}
          >
            Caption
          </Badge>
          <Badge
            className={`cursor-pointer ${activeTab === 'tags' ? 'bg-purple-500 text-white' : 'bg-white text-gray-600'}`}
            onClick={() => setActiveTab('tags')}
          >
            Tags
          </Badge>
          <Badge
            className={`cursor-pointer ${activeTab === 'script' ? 'bg-purple-500 text-white' : 'bg-white text-gray-600'}`}
            onClick={() => setActiveTab('script')}
          >
            Script
          </Badge>
        </div>

        {/* Caption Tab */}
        {activeTab === 'caption' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Let AI write an engaging caption for your video</p>
            {suggestions.caption ? (
              <div className="relative">
                <Textarea
                  value={suggestions.caption}
                  onChange={(e) => setSuggestions(prev => ({ ...prev, caption: e.target.value }))}
                  className="pr-10 bg-white"
                  rows={3}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(suggestions.caption)}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button
                onClick={generateCaption}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate Caption
              </Button>
            )}
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Get AI-suggested tags to boost discoverability</p>
            {suggestions.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestions.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700">
                    {tag}
                  </Badge>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(suggestions.tags.join(', '))}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button
                onClick={generateTags}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate Tags
              </Button>
            )}
          </div>
        )}

        {/* Script Tab */}
        {activeTab === 'script' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Get a ready-to-use video script</p>
            {suggestions.script ? (
              <div className="relative">
                <Textarea
                  value={suggestions.script}
                  onChange={(e) => setSuggestions(prev => ({ ...prev, script: e.target.value }))}
                  className="pr-10 bg-white"
                  rows={8}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(suggestions.script)}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button
                onClick={generateScript}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate Script
              </Button>
            )}
          </div>
        )}

        {/* Apply Button */}
        {(suggestions.caption || suggestions.tags.length > 0) && (
          <Button
            onClick={applyAll}
            variant="outline"
            className="w-full border-purple-300 hover:bg-purple-50"
          >
            Apply to Post
          </Button>
        )}
      </CardContent>
    </Card>
  );
}