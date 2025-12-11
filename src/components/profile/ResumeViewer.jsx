import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, X } from 'lucide-react';

export default function ResumeViewer({ resumeUrl, open, onOpenChange }) {
  if (!resumeUrl) return null;

  const isPDF = resumeUrl.toLowerCase().endsWith('.pdf');
  const isDoc = resumeUrl.toLowerCase().endsWith('.doc') || resumeUrl.toLowerCase().endsWith('.docx');

  // Use Google Docs Viewer for better compatibility
  const getViewerUrl = () => {
    if (isPDF) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`;
    }
    if (isDoc) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resumeUrl)}`;
    }
    return null;
  };

  const viewerUrl = getViewerUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resume
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(resumeUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden rounded-lg border border-gray-200">
          {viewerUrl ? (
            <iframe
              src={viewerUrl}
              className="w-full h-full"
              title="Resume"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <div className="text-center space-y-4">
                <FileText className="w-16 h-16 mx-auto text-gray-400" />
                <p className="text-gray-600">Preview not available for this file type</p>
                <Button onClick={() => window.open(resumeUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Download Resume
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}