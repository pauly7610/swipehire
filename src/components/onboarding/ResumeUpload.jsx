import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ResumeUpload({ value, onChange, onParsed }) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(pdf|doc|docx)$/i)) {
      alert('Please upload a PDF or DOC file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Resume must be less than 5MB');
      return;
    }

    setUploading(true);
    setParseError(null);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);

      // Parse resume
      setParsing(true);
      try {
        const parseResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              location: { type: 'string' },
              headline: { type: 'string' },
              summary: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              experience: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    company: { type: 'string' },
                    title: { type: 'string' },
                    start_date: { type: 'string' },
                    end_date: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              },
              education: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    school: { type: 'string' },
                    degree: { type: 'string' },
                    major: { type: 'string' },
                    graduation_year: { type: 'string' }
                  }
                }
              }
            }
          }
        });

        if (parseResult.status === 'success' && parseResult.output) {
          onParsed?.(parseResult.output);
        } else {
          setParseError('Could not parse resume. You can still manually fill in your information.');
        }
      } catch (parseErr) {
        console.error('Resume parse failed:', parseErr);
        setParseError('Could not parse resume. You can still manually fill in your information.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setParseError(null);
  };

  return (
    <div className="space-y-4">
      {!value ? (
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 transition-colors">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          {uploading || parsing ? (
            <>
              <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
              <p className="text-sm font-medium text-gray-700">
                {parsing ? 'Parsing resume...' : 'Uploading...'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {parsing ? 'This may take a few seconds' : 'Please wait'}
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Upload your resume
              </p>
              <p className="text-xs text-gray-500">
                PDF or DOC • Max 5MB
              </p>
              <p className="text-xs text-pink-600 mt-2">
                We'll auto-fill your profile from your resume
              </p>
            </>
          )}
        </label>
      ) : (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Resume uploaded successfully</p>
              <p className="text-xs text-green-700 mt-1">
                {parsing ? 'Parsing your resume...' : 'Your profile has been auto-filled'}
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 hover:bg-green-100 rounded-full transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
          
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 text-sm text-green-700 hover:text-green-800"
          >
            <FileText className="w-4 h-4" />
            View uploaded resume
          </a>
        </div>
      )}

      {parseError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-gray-500 text-center">
        Optional but highly recommended • Improves matching by 3x
      </p>
    </div>
  );
}