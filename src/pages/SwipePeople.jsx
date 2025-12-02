import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, Sparkles } from 'lucide-react';

export default function SwipePeople() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Network</h1>
        <p className="text-gray-500 mb-8">Connect with professionals in your industry</p>

        <Card className="p-12 border-0 shadow-lg">
          <div className="w-20 h-20 rounded-full swipe-gradient mx-auto flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Coming Soon!</h3>
          <p className="text-gray-500 mb-6">
            Network with other professionals, mentors, and industry leaders.
          </p>
          <div className="flex items-center justify-center gap-2 text-pink-500">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Stay tuned for updates</span>
          </div>
        </Card>
      </div>
    </div>
  );
}