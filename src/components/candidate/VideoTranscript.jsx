import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VideoTranscript({ videoUrl, transcript, onTranscriptUpdate, isGenerating }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const copyToClipboard = async () => {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateTranscript = async () => {
    if (!videoUrl) return;
    setRegenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Please transcribe the audio from this video introduction. Provide a clean, accurate transcript of what the person is saying. If there's no audio or speech, respond with "No speech detected."`,
        file_urls: [videoUrl],
        response_json_schema: {
          type: "object",
          properties: {
            transcript: { type: "string", description: "The transcribed text from the video" },
            has_speech: { type: "boolean", description: "Whether speech was detected" }
          }
        }
      });
      
      if (onTranscriptUpdate && result.has_speech) {
        onTranscriptUpdate(result.transcript);
      }
    } catch (err) {
      console.error('Transcript regeneration failed:', err);
    }
    setRegenerating(false);
  };

  if (!videoUrl) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-pink-500" />
            Video Transcript
          </CardTitle>
          <div className="flex items-center gap-2">
            {transcript && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 px-2"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-500 mr-1" /> Copied</>
                ) : (
                  <><Copy className="w-4 h-4 mr-1" /> Copy</>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={regenerateTranscript}
              disabled={regenerating || isGenerating}
              className="h-8 px-2"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isGenerating || regenerating ? (
          <div className="flex items-center gap-2 text-gray-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Generating transcript...</span>
          </div>
        ) : transcript ? (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
            {transcript}
          </div>
        ) : (
          <div className="text-sm text-gray-500 py-2">
            No transcript available. Click "Regenerate" to create one.
          </div>
        )}
      </CardContent>
    </Card>
  );
}