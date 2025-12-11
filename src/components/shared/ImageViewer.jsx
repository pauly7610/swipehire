import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImageViewer({ imageUrl, open, onOpenChange, title }) {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-black/95">
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={title || "Image"} 
            className="w-full max-h-[90vh] object-contain"
          />
          
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                const a = document.createElement('a');
                a.href = imageUrl;
                a.download = 'image.jpg';
                a.click();
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {title && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-sm">{title}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}