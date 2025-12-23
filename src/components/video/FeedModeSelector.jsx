import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Briefcase, UserCircle, FileText, Shield } from 'lucide-react';

const FEED_MODES = [
  { id: 'discovery', label: 'Discovery', icon: Sparkles },
  { id: 'actively_hiring', label: 'Actively Hiring', icon: Briefcase },
  { id: 'open_to_work', label: 'Open to Work', icon: UserCircle },
  { id: 'contract_only', label: 'Contract Only', icon: FileText },
  { id: 'clearance', label: 'Clearance', icon: Shield },
];

export default function FeedModeSelector({ currentMode, onChange, viewerType }) {
  const relevantModes = viewerType === 'employer' 
    ? FEED_MODES.filter(m => ['discovery', 'actively_hiring', 'open_to_work', 'contract_only', 'clearance'].includes(m.id))
    : FEED_MODES.filter(m => ['discovery', 'actively_hiring', 'contract_only', 'clearance'].includes(m.id));

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
      {relevantModes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <Badge
            key={mode.id}
            className={`flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
              isActive 
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white border-0 shadow-lg' 
                : 'bg-black/40 text-white/70 border-white/10 hover:bg-black/60'
            }`}
            onClick={() => onChange(mode.id)}
          >
            <Icon className="w-3 h-3" />
            {mode.label}
          </Badge>
        );
      })}
    </div>
  );
}