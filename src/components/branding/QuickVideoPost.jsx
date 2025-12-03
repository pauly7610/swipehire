import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Video, Upload, Loader2, Building2, Users, Briefcase, 
  Sparkles, Play, X, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEO_TYPES = [
  { 
    value: 'company_culture', 
    label: 'Company Culture', 
    icon: Building2, 
    description: 'Showcase your workplace environment and team dynamics',
    tips: ['Show your office space', 'Feature team collaboration', 'Highlight unique perks']
  },
  { 
    value: 'day_in_life', 
    label: 'Day in the Life', 
    icon: Users, 
    description: 'Give candidates a glimpse of a typical workday',
    tips: ['Follow an employee', 'Show daily routines', 'Include team interactions']
  },
  { 
    value: 'job_post', 
    label: 'Job Opening', 
    icon: Briefcase, 
    description: 'Announce and promote open positions',
    tips: ['Highlight key responsibilities', 'Mention growth opportunities', 'Share team info']
  },
  { 
    value: 'tips', 
    label: 'Career Tips', 
    icon: Sparkles, 
    description: 'Share industry insights and advice',
    tips: ['Offer valuable advice', 'Share your expertise', 'Be authentic']
  }
];

export default function QuickVideoPost({ company, jobs, onVideoPosted }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [linkedJob, setLinkedJob] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!videoFile || !selectedType) return;
    
    setUploading(true);
    try {
      const user = await base44.auth.me();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: videoFile });
      
      await base44.entities.VideoPost.create({
        author_id: user.id,
        author_type: 'employer',
        video_url: file_url,
        caption,
        type: selectedType.value,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        job_id: linkedJob || undefined,
        likes: 0,
        views: 0,
        shares: 0,
        comments_count: 0,
        moderation_status: 'approved'
      });
      
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setSelectedType(null);
        setVideoFile(null);
        setVideoPreview(null);
        setCaption('');
        setTags('');
        setLinkedJob('');
        onVideoPosted?.();
      }, 2000);
    } catch (error) {
      console.error('Failed to upload:', error);
    }
    setUploading(false);
  };

  const resetAndClose = () => {
    setShowModal(false);
    setSelectedType(null);
    setVideoFile(null);
    setVideoPreview(null);
    setCaption('');
    setTags('');
  };

  return (
    <>
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="swipe-gradient p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Create Branding Content</h3>
              <p className="text-white/80 text-sm">Showcase your company culture</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {VIDEO_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => { setSelectedType(type); setShowModal(true); }}
                className="flex items-center gap-2 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-colors"
              >
                <type.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Dialog open={showModal} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedType?.icon && <selectedType.icon className="w-5 h-5 text-pink-500" />}
              Post {selectedType?.label} Video
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="w-16 h-16 rounded-full swipe-gradient mx-auto flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Video Posted!</h3>
                <p className="text-gray-500">Your content is now live</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Tips */}
                {selectedType?.tips && (
                  <div className="p-3 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-700 mb-2">Tips for great {selectedType.label.toLowerCase()} videos:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {selectedType.tips.map((tip, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-pink-500" /> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Video Upload */}
                <div>
                  <Label>Video</Label>
                  {videoPreview ? (
                    <div className="relative mt-2 rounded-xl overflow-hidden bg-black">
                      <video src={videoPreview} controls className="w-full max-h-48 object-contain" />
                      <button 
                        onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="block mt-2 cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-500 transition-colors">
                        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500 mb-1">Click to upload video</p>
                        <p className="text-xs text-gray-400">MP4, MOV up to 100MB</p>
                      </div>
                      <input type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                  )}
                </div>

                {/* Caption */}
                <div>
                  <Label>Caption</Label>
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write an engaging caption..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="hiring, culture, remote"
                    className="mt-1"
                  />
                </div>

                {/* Link to Job (for job posts) */}
                {selectedType?.value === 'job_post' && jobs?.length > 0 && (
                  <div>
                    <Label>Link to Job Posting</Label>
                    <select
                      value={linkedJob}
                      onChange={(e) => setLinkedJob(e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-200 rounded-lg"
                    >
                      <option value="">Select a job (optional)</option>
                      {jobs.filter(j => j.is_active).map(job => (
                        <option key={job.id} value={job.id}>{job.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <Button 
                  onClick={handleUpload}
                  disabled={!videoFile || uploading}
                  className="w-full swipe-gradient text-white"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</>
                  ) : (
                    <><Video className="w-4 h-4 mr-2" /> Post Video</>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>
    </>
  );
}