import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Play, Image, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompanyMediaGallery({ media, companyName }) {
  const [selectedMedia, setSelectedMedia] = useState(null);

  if (!media || media.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Media Yet</h3>
          <p className="text-gray-500">Photos and videos of life at {companyName} will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Life at {companyName}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {media.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => setSelectedMedia(item)}
              >
                {item.type === 'video' ? (
                  <>
                    <video src={item.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-gray-900 ml-1" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </>
                )}
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{item.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0">
          <button 
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {selectedMedia?.type === 'video' ? (
            <video src={selectedMedia.url} controls autoPlay className="w-full max-h-[80vh] object-contain" />
          ) : (
            <img src={selectedMedia?.url} alt={selectedMedia?.caption || ''} className="w-full max-h-[80vh] object-contain" />
          )}
          {selectedMedia?.caption && (
            <div className="p-4 bg-black text-white">
              <p>{selectedMedia.caption}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}