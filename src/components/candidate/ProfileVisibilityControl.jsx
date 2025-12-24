import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProfileVisibilityControl({ candidate, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const isVisible = candidate?.job_search_status !== 'not_looking';

  const toggleVisibility = async (visible) => {
    setLoading(true);
    try {
      const newStatus = visible ? 'actively_looking' : 'not_looking';
      await base44.entities.Candidate.update(candidate.id, { 
        job_search_status: newStatus 
      });
      
      if (onUpdate) {
        onUpdate({ job_search_status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
    setLoading(false);
  };

  return (
    <Card className={`border-2 transition-all ${
      isVisible 
        ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800' 
        : 'border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {isVisible ? (
                <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
              <h3 className="font-bold text-gray-900 dark:text-white">
                Profile Visibility
              </h3>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-pink-500" />}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {isVisible 
                ? 'Your profile is visible to recruiters and appears in search results' 
                : 'Your profile is paused and hidden from all searches and recommendations'}
            </p>

            {isVisible && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                  Actively visible to {candidate?.target_industries?.length || 'all'} industries
                </span>
              </div>
            )}
          </div>

          <Switch
            checked={isVisible}
            onCheckedChange={toggleVisibility}
            disabled={loading}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

        {!isVisible && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 <strong>Tip:</strong> Toggle back on when you're ready to receive opportunities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}