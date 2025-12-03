import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Video, Tag, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ConfirmPostDialog({ open, onOpenChange, postData, onConfirm, uploading }) {
  const getTypeLabel = (type) => {
    const labels = {
      job_post: '💼 Job Opening',
      intro: '👋 Introduction',
      day_in_life: '📅 Day in Life',
      tips: '💡 Career Tips',
      company_culture: '🏢 Company Culture'
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-pink-500" />
            Confirm Post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-gray-600">Are you sure you want to post this video?</p>
          
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Video ready to upload</span>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 truncate">
                {postData?.caption || 'No caption'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-pink-100 text-pink-700 border-0">
                {getTypeLabel(postData?.type)}
              </Badge>
            </div>
            
            {postData?.tags && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-gray-500" />
                {postData.tags.split(',').filter(Boolean).map((tag, i) => (
                  <span key={i} className="text-xs text-pink-500">#{tag.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={uploading}
            className="bg-gradient-to-r from-pink-500 to-orange-500 text-white"
          >
            {uploading ? 'Posting...' : 'Post Video'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}