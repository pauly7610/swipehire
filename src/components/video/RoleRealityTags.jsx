import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Zap, Target, Phone, Home } from 'lucide-react';

const REALITY_TAGS = {
  'fast_paced': { icon: Zap, label: 'Fast-paced', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  'client_facing': { icon: Phone, label: 'Client-facing', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'on_call': { icon: Clock, label: 'On-call', color: 'bg-red-50 text-red-700 border-red-200' },
  'high_autonomy': { icon: Target, label: 'High autonomy', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'team_collab': { icon: Users, label: 'Team-heavy', color: 'bg-green-50 text-green-700 border-green-200' },
  'remote_friendly': { icon: Home, label: 'Remote-friendly', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
};

export default function RoleRealityTags({ tags = [] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 4).map((tag) => {
        const config = REALITY_TAGS[tag] || { icon: Target, label: tag, color: 'bg-gray-50 text-gray-700' };
        const Icon = config.icon;
        
        return (
          <Badge 
            key={tag} 
            className={`${config.color} border text-[10px] font-bold flex items-center gap-1 px-2 py-0.5`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
}

export { REALITY_TAGS };