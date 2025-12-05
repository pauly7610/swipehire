import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Heart, HeartOff, Loader2 } from 'lucide-react';

export default function FollowCompanyButton({ companyId, candidateId, userId, variant = "default", size = "default" }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRecord, setFollowRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [companyId, candidateId]);

  const checkFollowStatus = async () => {
    if (!companyId || !candidateId) {
      setLoading(false);
      return;
    }
    try {
      const follows = await base44.entities.CompanyFollow.filter({
        candidate_id: candidateId,
        company_id: companyId
      });
      if (follows.length > 0) {
        setIsFollowing(true);
        setFollowRecord(follows[0]);
      }
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
    setLoading(false);
  };

  const toggleFollow = async () => {
    if (!candidateId || !companyId || !userId) return;
    
    setLoading(true);
    try {
      if (isFollowing && followRecord) {
        await base44.entities.CompanyFollow.delete(followRecord.id);
        setIsFollowing(false);
        setFollowRecord(null);
      } else {
        const newFollow = await base44.entities.CompanyFollow.create({
          candidate_id: candidateId,
          company_id: companyId,
          user_id: userId
        });
        setIsFollowing(true);
        setFollowRecord(newFollow);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
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
      variant={isFollowing ? "secondary" : variant}
      size={size}
      onClick={toggleFollow}
      className={isFollowing ? "bg-pink-100 text-pink-600 hover:bg-pink-200" : ""}
    >
      {isFollowing ? (
        <><Heart className="w-4 h-4 mr-2 fill-pink-500 text-pink-500" /> Following</>
      ) : (
        <><Heart className="w-4 h-4 mr-2" /> Follow</>
      )}
    </Button>
  );
}