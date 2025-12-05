import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';

export default function FavoriteCandidateButton({ candidateId, companyId, recruiterUserId, jobId, variant = "ghost", size = "icon" }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteRecord, setFavoriteRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFavoriteStatus();
  }, [candidateId, companyId]);

  const checkFavoriteStatus = async () => {
    if (!candidateId || !companyId) {
      setLoading(false);
      return;
    }
    try {
      const favorites = await base44.entities.FavoriteCandidate.filter({
        candidate_id: candidateId,
        company_id: companyId
      });
      if (favorites.length > 0) {
        setIsFavorite(true);
        setFavoriteRecord(favorites[0]);
      }
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
    setLoading(false);
  };

  const toggleFavorite = async (e) => {
    e?.stopPropagation();
    if (!candidateId || !companyId || !recruiterUserId) return;
    
    setLoading(true);
    try {
      if (isFavorite && favoriteRecord) {
        await base44.entities.FavoriteCandidate.delete(favoriteRecord.id);
        setIsFavorite(false);
        setFavoriteRecord(null);
      } else {
        const newFavorite = await base44.entities.FavoriteCandidate.create({
          candidate_id: candidateId,
          company_id: companyId,
          recruiter_user_id: recruiterUserId,
          job_id: jobId || undefined
        });
        setIsFavorite(true);
        setFavoriteRecord(newFavorite);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleFavorite}
      className={isFavorite ? "text-amber-500" : "text-gray-400 hover:text-amber-500"}
    >
      <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-500' : ''}`} />
    </Button>
  );
}