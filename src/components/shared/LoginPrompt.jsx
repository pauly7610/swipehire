import React from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Briefcase, User } from 'lucide-react';

export default function LoginPrompt({ open, onOpenChange, feature = 'this feature' }) {
  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname + window.location.search);
  };

  const features = {
    swipe: { icon: Heart, title: 'Login to Swipe', desc: 'Create an account to swipe on jobs and connect with companies' },
    message: { icon: MessageCircle, title: 'Login to Message', desc: 'Sign in to start conversations with recruiters and candidates' },
    apply: { icon: Briefcase, title: 'Login to Apply', desc: 'Create your profile to apply for jobs' },
    default: { icon: User, title: 'Login Required', desc: `Please login to use ${feature}` }
  };

  const config = features[feature] || features.default;
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 mx-auto mb-4 flex items-center justify-center">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center">{config.title}</DialogTitle>
          <DialogDescription className="text-center">
            {config.desc}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button 
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white"
          >
            Login / Sign Up
          </Button>
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full"
          >
            Continue Browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}