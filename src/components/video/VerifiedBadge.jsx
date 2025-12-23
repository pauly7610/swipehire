import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Crown } from 'lucide-react';

export default function VerifiedBadge({ isVerified, isPremium, size = 'sm' }) {
  if (!isVerified && !isPremium) return null;

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div className="flex items-center gap-1">
      {isVerified && (
        <Badge className="bg-blue-500 text-white border-0 px-1.5 py-0.5">
          <CheckCircle2 className={`${iconSize} mr-0.5`} />
          <span className={textSize}>Verified</span>
        </Badge>
      )}
      {isPremium && (
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 px-1.5 py-0.5">
          <Crown className={`${iconSize} mr-0.5`} />
          <span className={textSize}>Premium</span>
        </Badge>
      )}
    </div>
  );
}