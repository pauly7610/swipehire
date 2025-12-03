import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, MessageCircle, Share2, Plus, Play, Pause,
  Volume2, VolumeX, User, Briefcase, Building2, Loader2,
  Sparkles, BookmarkPlus, Send, Trash2, Flag, MoreVertical, Search
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import VideoAnalytics from '@/components/video/VideoAnalytics';
import ConfirmPostDialog from '@/components/video/ConfirmPostDialog';

const VideoCard = ({ post, user, isActive, onLike, onView, candidate, company, onComment, onShare, onFollow, isFollowing, onDelete, isOwner, onReport, onSwipe, viewerType, canSwipe }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(isFollowing);
  const [dragX, setDragX] = useState(0);

  // Determine swipe labels based on content type and viewer
  const getSwipeLabels = () => {
    // Candidate intro video - employer swipes to interview
    if (post.type === 'intro' && post.author_type === 'candidate') {
      return { right: 'INTERVIEW', left: 'PASS' };
    }
    // Job post - candidate swipes to apply
    if (post.type === 'job_post') {
      return { right: 'APPLY', left: 'PASS' };
    }
    // Other content types - learn more
    return { right: 'LEARN MORE', left: 'PASS' };
  };

  const swipeLabels = getSwipeLabels();
  
  useEffect(() => {
    setFollowing(isFollowing);
  }, [isFollowing]);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
        onView?.();
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDoubleTap = (e) => {
    e.stopPropagation();
    if (!liked) {
      setLiked(true);
      setShowHeart(true);
      onLike?.();
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(!liked);
    if (!liked) onLike?.();
  };

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const getTypeLabel = (type) => {
    const labels = {
      job_post: '💼 Job Opening',
      intro: '👋 Introduction',
      day_in_life: '📅 Day in Life',
      tips: '💡 Career Tips',
      company_culture: '🏢 Culture'
    };
    return labels[type] || type;
  };

  const authorName = user?.full_name || 'User';
  const authorHeadline = candidate?.headline || company?.name || '';

  const handleDragEnd = (e, info) => {
    if (!canSwipe) {
      setDragX(0);
      return;
    }
    if (info.offset.x > 100) {
      onSwipe?.('right');
    } else if (info.offset.x < -100) {
      onSwipe?.('left');
    }
    setDragX(0);
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Video Container - Swipeable */}
      <motion.div 
        className="relative w-full max-w-md h-full max-h-[85vh] mx-auto"
        drag={canSwipe ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDrag={(e, info) => canSwipe && setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
      >
        {/* Swipe Indicators */}
        <AnimatePresence>
          {canSwipe && dragX < -50 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-1/2 left-8 -translate-y-1/2 z-30 px-4 py-2 border-4 border-red-500 rounded-xl bg-red-500/20 backdrop-blur-sm"
              style={{ rotate: -15 }}
            >
              <span className="text-red-500 font-bold text-2xl">{swipeLabels.left}</span>
            </motion.div>
          )}
          {canSwipe && dragX > 50 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-1/2 right-8 -translate-y-1/2 z-30 px-4 py-2 border-4 border-green-500 rounded-xl bg-green-500/20 backdrop-blur-sm"
              style={{ rotate: 15 }}
            >
              <span className="text-green-500 font-bold text-2xl">{swipeLabels.right}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <video
          ref={videoRef}
          src={post.video_url}
          className="w-full h-full object-contain bg-black rounded-2xl"
          loop
          muted={isMuted}
          playsInline
          onClick={togglePlay}
          onDoubleClick={handleDoubleTap}
        />

      {/* Play/Pause overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double tap heart */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Heart className="w-32 h-32 text-pink-500 fill-pink-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-black/50 backdrop-blur-sm text-white border-0 text-xs">
          {getTypeLabel(post.type)}
        </Badge>
      </div>

      {/* Top right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={handleMuteToggle}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Video
              </DropdownMenuItem>
            )}
            {!isOwner && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReport?.(); }} className="text-orange-600">
                <Flag className="w-4 h-4 mr-2" /> Report Video
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side actions */}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 z-20">
        {/* Profile */}
        <div className="flex flex-col items-center">
          <div className="w-11 h-11 rounded-full border-2 border-white overflow-hidden">
            {candidate?.photo_url || company?.logo_url ? (
              <img src={candidate?.photo_url || company?.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{authorName.charAt(0)}</span>
              </div>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setFollowing(!following);
              onFollow?.();
            }} 
            className={`w-5 h-5 -mt-2.5 rounded-full flex items-center justify-center ${following ? 'bg-gray-500' : 'bg-pink-500'}`}
          >
            <Plus className={`w-3 h-3 text-white ${following ? 'rotate-45' : ''}`} />
          </button>
        </div>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Heart className={`w-6 h-6 ${liked ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
          </div>
          <span className="text-white text-xs mt-1">{(post.likes || 0) + (liked ? 1 : 0)}</span>
        </button>

        {/* Comment */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onComment?.();
          }} 
          className="flex flex-col items-center"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1">{post.comments_count || 0}</span>
        </button>

        {/* Save */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setSaved(!saved);
          }} 
          className="flex flex-col items-center"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <BookmarkPlus className={`w-6 h-6 ${saved ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
          </div>
          <span className="text-white text-xs mt-1">{saved ? 'Saved' : 'Save'}</span>
        </button>

        {/* Share */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onShare?.();
          }} 
          className="flex flex-col items-center"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1">{post.shares || 0}</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-4 left-3 right-16 text-white z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-sm">@{authorName.replace(/\s/g, '').toLowerCase()}</span>
          {post.author_type === 'employer' && <Building2 className="w-4 h-4" />}
        </div>
        {authorHeadline && (
          <p className="text-xs text-white/80 mb-1">{authorHeadline}</p>
        )}
        <p className="text-sm mb-1 line-clamp-2">{post.caption}</p>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs text-pink-400">#{tag}</span>
            ))}
          </div>
        )}
        {post.job_id && (
          <Link to={createPageUrl('SwipeJobs')} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" className="mt-2 bg-pink-500 hover:bg-pink-600 text-white h-8 text-xs">
              <Briefcase className="w-3 h-3 mr-1" /> View Job
            </Button>
          </Link>
        )}
        
        {/* Swipe hint */}
        {canSwipe && (
          <p className="text-xs text-white/50 mt-2">← {swipeLabels.left} • {swipeLabels.right} →</p>
        )}
      </div>
      </motion.div>
    </div>
  );
};

export default function VideoFeed() {
  const [activeTab, setActiveTab] = useState('for_you');
  const [followedUserIds, setFollowedUserIds] = useState(new Set());
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [candidates, setCandidates] = useState({});
  const [companies, setCompanies] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPost, setNewPost] = useState({ caption: '', type: 'intro', tags: '' });
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showConfirmPost, setShowConfirmPost] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [viewedPostIds, setViewedPostIds] = useState(new Set());
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewerType, setViewerType] = useState(null); // 'candidate' or 'employer'
  const containerRef = useRef(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    
    try {
      const currentUser = await base44.auth.me();
      if (!isLoadMore) setUser(currentUser);

      // Determine viewer type
      const companyData = allCompanies?.find(c => c.user_id === currentUser.id);
      const candidateData = allCandidates?.find(c => c.user_id === currentUser.id);
      if (!isLoadMore) {
        setViewerType(companyData ? 'employer' : (candidateData ? 'candidate' : null));
      }

      const currentPage = isLoadMore ? page + 1 : 0;
      
      const [allPosts, allUsers, allCandidates, allCompanies, allFollows, userSwipes] = await Promise.all([
        base44.entities.VideoPost.list('-created_date', 100),
        base44.entities.User.list(),
        base44.entities.Candidate.list(),
        base44.entities.Company.list(),
        base44.entities.Follow.filter({ follower_id: currentUser.id }),
        base44.entities.Swipe.filter({ swiper_id: currentUser.id })
      ]);

      const followedIds = new Set(allFollows.map(f => f.followed_id));
      if (!isLoadMore) setFollowedUserIds(followedIds);

      // Determine viewer type
      const companyDataCheck = allCompanies.find(c => c.user_id === currentUser.id);
      const candidateDataCheck = allCandidates.find(c => c.user_id === currentUser.id);
      const currentViewerType = companyDataCheck ? 'employer' : (candidateDataCheck ? 'candidate' : null);
      if (!isLoadMore) setViewerType(currentViewerType);

      // ============================================
      // ENHANCED "FOR YOU" ALGORITHM
      // ============================================
      const now = new Date();
      const userProfile = candidateDataCheck || {};
      const userSkills = userProfile.skills || [];
      const userPreferences = userProfile.culture_preferences || [];
      const userLocation = (userProfile.location || '').toLowerCase();
      const userIndustry = userProfile.preferred_job_types || [];
      const userExperienceLevel = userProfile.experience_level || '';
      
      // === LEARN FROM USER INTERACTIONS ===
      // Analyze past swipes to understand preferences
      const rightSwipes = userSwipes.filter(s => s.direction === 'right' || s.direction === 'super');
      const leftSwipes = userSwipes.filter(s => s.direction === 'left');
      
      // Build preference maps from interaction history
      const likedAuthorIds = new Set();
      const likedContentTypes = {};
      const likedTags = {};
      const likedIndustries = {};
      
      rightSwipes.forEach(swipe => {
        if (swipe.target_type === 'job') {
          // Find the job to extract preferences
          const relatedPosts = allPosts.filter(p => p.job_id === swipe.target_id);
          relatedPosts.forEach(p => {
            likedAuthorIds.add(p.author_id);
            likedContentTypes[p.type] = (likedContentTypes[p.type] || 0) + 1;
            (p.tags || []).forEach(tag => {
              likedTags[tag.toLowerCase()] = (likedTags[tag.toLowerCase()] || 0) + 1;
            });
          });
        }
      });
      
      // Track which authors user has engaged with (liked, followed)
      const engagedAuthors = new Set([...followedIds, ...likedAuthorIds]);
      
      // === DIVERSITY TRACKING ===
      // Track content types shown to ensure variety
      const recentTypeCount = {};
      const recentCreatorCount = {};
      
      const scoredPosts = allPosts.map((p, index) => {
        let score = 0;
        const reasons = []; // Track why content is ranked
        
        // === 1. VIRAL/ENGAGEMENT SCORE (0-80 points) ===
        const engagementRate = p.views > 0 
          ? ((p.likes || 0) + (p.shares || 0) * 2 + (p.comments_count || 0)) / p.views 
          : 0;
        const viralScore = Math.min(80, 
          (p.likes || 0) * 2 + 
          (p.views || 0) * 0.3 + 
          (p.shares || 0) * 5 + 
          (p.comments_count || 0) * 3 +
          engagementRate * 50
        );
        score += viralScore;
        
        // === 2. RECENCY BOOST (0-70 points) ===
        const postAge = (now - new Date(p.created_date)) / (1000 * 60 * 60);
        let recencyScore = 0;
        if (postAge < 3) recencyScore = 70;
        else if (postAge < 12) recencyScore = 55;
        else if (postAge < 24) recencyScore = 45;
        else if (postAge < 48) recencyScore = 35;
        else if (postAge < 72) recencyScore = 25;
        else if (postAge < 168) recencyScore = 15;
        score += recencyScore;
        
        // === 3. INTERACTION-BASED PERSONALIZATION (0-100 points) ===
        // Boost content from authors user has engaged with
        if (engagedAuthors.has(p.author_id)) {
          score += 50;
          reasons.push('engaged_author');
        }
        
        // Boost content types user has liked before
        if (likedContentTypes[p.type]) {
          const typePreference = Math.min(30, likedContentTypes[p.type] * 10);
          score += typePreference;
          reasons.push('preferred_type');
        }
        
        // Boost content with tags user has shown interest in
        let tagMatchScore = 0;
        (p.tags || []).forEach(tag => {
          if (likedTags[tag.toLowerCase()]) {
            tagMatchScore += Math.min(10, likedTags[tag.toLowerCase()] * 3);
          }
        });
        score += Math.min(20, tagMatchScore);
        
        // === 4. CAREER RELEVANCE (0-80 points) ===
        const authorCandidate = allCandidates.find(c => c.user_id === p.author_id);
        const authorCompany = allCompanies.find(c => c.user_id === p.author_id);
        
        // Skills match
        const skillMatches = (p.tags || []).filter(tag => 
          userSkills.some(skill => 
            skill.toLowerCase().includes(tag.toLowerCase()) || 
            tag.toLowerCase().includes(skill.toLowerCase())
          )
        ).length;
        score += Math.min(40, skillMatches * 15);
        
        // Industry/job type relevance
        if (authorCompany?.industry && userIndustry.length > 0) {
          const industryMatch = userIndustry.some(ind => 
            authorCompany.industry.toLowerCase().includes(ind.toLowerCase())
          );
          if (industryMatch) score += 25;
        }
        
        // Experience level matching
        if (p.type === 'job_post' && userExperienceLevel) {
          const captionLower = (p.caption || '').toLowerCase();
          if (captionLower.includes(userExperienceLevel)) score += 15;
        }
        
        // === 5. CONTENT TYPE PREFERENCE BY USER TYPE (0-40 points) ===
        if (companyDataCheck) {
          // Employers want candidate intros
          if (p.type === 'intro' && p.author_type === 'candidate') score += 40;
          if (p.type === 'tips') score += 15;
        } else {
          // Candidates want jobs and culture content
          if (p.type === 'job_post') score += 40;
          if (p.type === 'company_culture') score += 35;
          if (p.type === 'tips') score += 30;
          if (p.type === 'day_in_life') score += 20;
        }
        
        // === 6. LOCATION RELEVANCE (0-30 points) ===
        const authorLocation = (authorCandidate?.location || authorCompany?.location || '').toLowerCase();
        if (userLocation && authorLocation) {
          const userCity = userLocation.split(',')[0].trim();
          if (authorLocation.includes(userCity)) score += 30;
          else if (authorLocation.includes(userLocation.split(',').pop()?.trim() || '')) score += 15;
        }
        
        // === 7. CULTURE FIT (0-25 points) ===
        if (authorCompany?.culture_traits && userPreferences.length > 0) {
          const cultureMatches = authorCompany.culture_traits.filter(trait =>
            userPreferences.some(pref => 
              pref.toLowerCase().includes(trait.toLowerCase()) ||
              trait.toLowerCase().includes(pref.toLowerCase())
            )
          ).length;
          score += Math.min(25, cultureMatches * 8);
        }
        
        // === 8. QUALITY SIGNALS (0-20 points) ===
        if (p.caption?.length > 100) score += 8;
        else if (p.caption?.length > 50) score += 5;
        if ((p.tags || []).length >= 3) score += 7;
        if (p.thumbnail_url) score += 5;
        
        // === 9. DIVERSITY FACTOR (adjust to ensure variety) ===
        // Track and penalize over-represented content types
        recentTypeCount[p.type] = (recentTypeCount[p.type] || 0) + 1;
        recentCreatorCount[p.author_id] = (recentCreatorCount[p.author_id] || 0) + 1;
        
        // Penalize if too many of same type already shown
        if (recentTypeCount[p.type] > 3) {
          score -= (recentTypeCount[p.type] - 3) * 10;
        }
        
        // Penalize if same creator appears too often
        if (recentCreatorCount[p.author_id] > 2) {
          score -= (recentCreatorCount[p.author_id] - 2) * 15;
        }
        
        // Bonus for underrepresented content types (discovery)
        const typeFrequency = allPosts.filter(post => post.type === p.type).length / allPosts.length;
        if (typeFrequency < 0.15) score += 20; // Rare content gets boost
        
        // === 10. DISCOVERY FACTOR (0-25 points) ===
        // Introduce some randomness for serendipitous discovery
        const discoveryBoost = Math.random() * 25;
        score += discoveryBoost;
        
        // Boost content from creators user hasn't seen
        if (!engagedAuthors.has(p.author_id) && !viewedPostIds.has(p.id)) {
          score += 15; // Discovery bonus for new creators
        }
        
        // === 11. NEGATIVE SIGNALS ===
        // Penalty for already viewed
        if (viewedPostIds.has(p.id)) score -= 80;
        
        // Penalty for similar content to what user swiped left on
        if (leftSwipes.length > 0) {
          const leftSwipedTypes = leftSwipes.map(s => s.target_type);
          // Could expand this to check tags, industries, etc.
        }
        
        return { ...p, score: Math.max(0, score), reasons };
      })
      .filter(p => p.moderation_status !== 'rejected' && p.video_url && p.video_url.length > 0)
      .filter(p => {
        // Apply search filter if query exists
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const author = allUsers.find(u => u.id === p.author_id);
        const authorCandidate = allCandidates.find(c => c.user_id === p.author_id);
        const authorCompany = allCompanies.find(c => c.user_id === p.author_id);
        
        const searchText = [
          p.caption,
          author?.full_name,
          authorCandidate?.headline,
          authorCompany?.name,
          ...(p.tags || []),
          ...(authorCandidate?.skills || [])
        ].join(' ').toLowerCase();
        
        return searchText.includes(query);
      })
      .filter(p => {
        // Apply tab filter
        if (activeTab === 'for_you') return true;
        if (activeTab === 'following') return followedIds.has(p.author_id);
        if (activeTab === 'jobs') return p.type === 'job_post';
        if (activeTab === 'people') return p.type === 'intro' || p.author_type === 'candidate';
        return true;
      })
      .sort((a, b) => b.score - a.score);

      // Paginate results
      const startIndex = currentPage * PAGE_SIZE;
      const paginatedPosts = scoredPosts.slice(startIndex, startIndex + PAGE_SIZE);
      
      if (isLoadMore) {
        setPosts(prev => [...prev, ...paginatedPosts]);
        setPage(currentPage);
      } else {
        setPosts(scoredPosts.slice(0, PAGE_SIZE));
      }
      
      setHasMore(startIndex + PAGE_SIZE < scoredPosts.length);

      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);

      const candidateMap = {};
      allCandidates.forEach(c => { candidateMap[c.user_id] = c; });
      setCandidates(candidateMap);

      const companyMap = {};
      allCompanies.forEach(c => { companyMap[c.user_id] = c; });
      setCompanies(companyMap);
    } catch (error) {
      console.error('Failed to load feed:', error);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
    
    // Infinite scroll: load more when near the end
    const scrollHeight = container.scrollHeight;
    const scrollPosition = scrollTop + container.clientHeight;
    
    if (scrollPosition >= scrollHeight - itemHeight * 2 && hasMore && !loadingMore) {
      loadData(true);
    }
  }, [currentIndex, hasMore, loadingMore]);

    const handleFollow = async (authorId) => {
      if (!user || !authorId) return;

      if (followedUserIds.has(authorId)) {
        const [follow] = await base44.entities.Follow.filter({ follower_id: user.id, followed_id: authorId });
        if (follow) {
          await base44.entities.Follow.delete(follow.id);
          setFollowedUserIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(authorId);
            return newSet;
          });
        }
      } else {
        await base44.entities.Follow.create({ follower_id: user.id, followed_id: authorId });
        setFollowedUserIds(prev => new Set(prev).add(authorId));
      }
    };

  const handleLike = async (post) => {
    await base44.entities.VideoPost.update(post.id, { likes: (post.likes || 0) + 1 });
    // Track liked posts for algorithm
    setLikedPostIds(prev => new Set(prev).add(post.id));
  };

  const handleView = async (post) => {
    await base44.entities.VideoPost.update(post.id, { views: (post.views || 0) + 1 });
    // Track viewed posts to avoid showing again
    setViewedPostIds(prev => new Set(prev).add(post.id));
  };

  const handleComment = (postId) => {
    setActivePostId(postId);
    setShowComments(true);
  };

  const handleShare = async (post) => {
    setActivePostId(post.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this video on SwipeHire',
          text: post.caption,
          url: window.location.href
        });
        await base44.entities.VideoPost.update(post.id, { shares: (post.shares || 0) + 1 });
      } catch (err) {
        setShowShare(true);
      }
    } else {
      setShowShare(true);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    if (activePostId) {
      const post = posts.find(p => p.id === activePostId);
      if (post) {
        await base44.entities.VideoPost.update(activePostId, { shares: (post.shares || 0) + 1 });
      }
    }
    setShowShare(false);
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      await base44.entities.VideoPost.delete(postId);
      setPosts(posts.filter(p => p.id !== postId));
      if (currentIndex >= posts.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !activePostId) return;
    
    await base44.entities.VideoPost.update(activePostId, { 
      is_flagged: true, 
      flag_reason: reportReason 
    });
    
    // Auto-moderate: check for serious violations
    const seriousViolations = ['spam', 'harassment', 'hate speech', 'inappropriate', 'scam', 'fraud'];
    const isSerious = seriousViolations.some(v => reportReason.toLowerCase().includes(v));
    
    if (isSerious) {
      await base44.entities.VideoPost.update(activePostId, { moderation_status: 'rejected' });
      setPosts(posts.filter(p => p.id !== activePostId));
    }
    
    setReportReason('');
    setShowReport(false);
    setActivePostId(null);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !activePostId) return;
    
    await base44.entities.ForumComment.create({
      post_id: activePostId,
      author_id: user.id,
      content: commentText
    });
    
    const post = posts.find(p => p.id === activePostId);
    if (post) {
      await base44.entities.VideoPost.update(activePostId, { 
        comments_count: (post.comments_count || 0) + 1 
      });
      setPosts(posts.map(p => p.id === activePostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
    }
    
    setCommentText('');
    setShowComments(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
    setShowUpload(false);
    setShowConfirmPost(true);
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pendingFile });
      
      const [candidateData] = await base44.entities.Candidate.filter({ user_id: user.id });
      const [companyData] = await base44.entities.Company.filter({ user_id: user.id });

      const post = await base44.entities.VideoPost.create({
        author_id: user.id,
        author_type: companyData ? 'employer' : 'candidate',
        video_url: file_url,
        caption: newPost.caption || '',
        type: newPost.type || 'intro',
        tags: newPost.tags ? newPost.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        likes: 0,
        views: 0,
        shares: 0,
        comments_count: 0,
        moderation_status: 'pending'
      });

      // Refresh the feed to show the new post
      setShowConfirmPost(false);
      setPendingFile(null);
      setNewPost({ caption: '', type: 'intro', tags: '' });
      
      // Reload data to get fresh posts including the new one
      await loadData();
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to upload:', error);
      alert('Failed to upload video. Please try again.');
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative">
      {/* Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {posts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white p-8">
            <Sparkles className="w-16 h-16 text-pink-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Videos Yet</h2>
            <p className="text-gray-400 text-center mb-6">Be the first to share your story!</p>
            <Button onClick={() => setShowUpload(true)} className="bg-pink-500 hover:bg-pink-600">
              <Plus className="w-5 h-5 mr-2" /> Create Video
            </Button>
          </div>
        ) : (
          <>
          {posts.filter(p => p.moderation_status !== 'rejected' && p.video_url && p.video_url.length > 0).map((post, index) => {
              // Determine if viewer can swipe on this content
              // Candidates can't swipe on other candidates' intro videos
              const isAuthorCandidate = post.author_type === 'candidate' && post.type === 'intro';
              const canSwipe = !(viewerType === 'candidate' && isAuthorCandidate);
              
              return (
              <div key={post.id} className="h-full w-full snap-start flex-shrink-0">
                <VideoCard
                  post={post}
                  user={users[post.author_id]}
                  candidate={candidates[post.author_id]}
                  company={companies[post.author_id]}
                  isActive={index === currentIndex}
                  onLike={() => handleLike(post)}
                  onView={() => handleView(post)}
                  onComment={() => handleComment(post.id)}
                  onShare={() => handleShare(post)}
                  onFollow={() => handleFollow(post.author_id)}
                  isFollowing={followedUserIds.has(post.author_id)}
                  onDelete={() => handleDelete(post.id)}
                  isOwner={post.author_id === user?.id}
                  onReport={() => { setActivePostId(post.id); setShowReport(true); }}
                  viewerType={viewerType}
                  canSwipe={canSwipe}
                  onSwipe={async (direction) => {
                    if (!canSwipe) return;
                    
                    // Handle swipe based on content type
                    if (direction === 'right') {
                      if (post.type === 'job_post' && post.job_id) {
                        // Apply to job
                        await base44.entities.Swipe.create({
                          swiper_id: user.id,
                          swiper_type: 'candidate',
                          target_id: post.job_id,
                          target_type: 'job',
                          direction: 'right',
                          job_id: post.job_id
                        });
                      } else if (post.type === 'intro' && post.author_type === 'candidate' && viewerType === 'employer') {
                        // Employer interested in candidate - create swipe for interview
                        const authorCandidate = Object.values(candidates).find(c => c.user_id === post.author_id);
                        if (authorCandidate) {
                          await base44.entities.Swipe.create({
                            swiper_id: user.id,
                            swiper_type: 'employer',
                            target_id: authorCandidate.id,
                            target_type: 'candidate',
                            direction: 'right'
                          });
                        }
                      } else {
                        // Learn more - just follow
                        handleFollow(post.author_id);
                      }
                    }
                    // Move to next video
                    if (index < posts.length - 1) {
                      setCurrentIndex(index + 1);
                      containerRef.current?.scrollTo({ top: (index + 1) * containerRef.current.clientHeight, behavior: 'smooth' });
                    }
                  }}
                />
              </div>
            );})}
          
            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="h-full w-full snap-start flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
              </div>
            )}
            
            {/* End of Feed */}
            {!hasMore && posts.length > 0 && (
              <div className="h-full w-full snap-start flex flex-col items-center justify-center text-white p-8">
                <Sparkles className="w-12 h-12 text-pink-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">You're All Caught Up!</h3>
                <p className="text-gray-400 text-center">Check back later for more videos</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-white font-bold text-xl">SwipeHire</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
            <Badge 
              className="bg-black/40 text-white border-0 cursor-pointer"
              onClick={() => setShowAnalytics(true)}
            >
              📊
            </Badge>
          </div>
        </div>
        
        {/* Search Bar - Expandable */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder="Search jobs, people, skills..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); loadData(); }}
                  autoFocus
                  className="w-full h-10 pl-10 pr-4 bg-black/40 backdrop-blur-sm text-white placeholder-white/60 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-2">
          <Badge 
            className={`${activeTab === 'for_you' ? 'bg-pink-500 text-white' : 'bg-black/40 text-white'} border-0 cursor-pointer`}
            onClick={() => setActiveTab('for_you')}
          >
            For You
          </Badge>
          <Badge 
            className={`${activeTab === 'following' ? 'bg-pink-500 text-white' : 'bg-black/40 text-white'} border-0 cursor-pointer`}
            onClick={() => setActiveTab('following')}
          >
            Following
          </Badge>
          <Badge 
            className={`${activeTab === 'jobs' ? 'bg-pink-500 text-white' : 'bg-black/40 text-white'} border-0 cursor-pointer`}
            onClick={() => setActiveTab('jobs')}
          >
            Jobs
          </Badge>
          <Badge 
            className={`${activeTab === 'people' ? 'bg-pink-500 text-white' : 'bg-black/40 text-white'} border-0 cursor-pointer`}
            onClick={() => setActiveTab('people')}
          >
            People
          </Badge>
        </div>
      </div>

      {/* Create button */}
      <button
        onClick={() => setShowUpload(true)}
        className="absolute bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center z-10"
        style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Video Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newPost.type} onValueChange={v => setNewPost({ ...newPost, type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Post type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intro">👋 Introduction</SelectItem>
                <SelectItem value="job_post">💼 Job Opening</SelectItem>
                <SelectItem value="day_in_life">📅 Day in Life</SelectItem>
                <SelectItem value="tips">💡 Career Tips</SelectItem>
                <SelectItem value="company_culture">🏢 Company Culture</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Write a caption..."
              value={newPost.caption}
              onChange={e => setNewPost({ ...newPost, caption: e.target.value })}
              rows={3}
            />

            <Input
              placeholder="Tags (comma separated)"
              value={newPost.tags}
              onChange={e => setNewPost({ ...newPost, tags: e.target.value })}
            />

            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-pink-500 transition-colors">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" />
                ) : (
                  <>
                    <Plus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Click to upload video</p>
                  </>
                )}
              </div>
              <input type="file" accept="video/*" className="hidden" onChange={handleFileSelect} disabled={uploading} />
            </label>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No comments yet. Be the first!</p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              />
              <Button onClick={submitComment} className="bg-pink-500 hover:bg-pink-600">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button onClick={copyLink} variant="outline" className="w-full justify-start">
              <Share2 className="w-4 h-4 mr-2" /> Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Post Dialog */}
      <ConfirmPostDialog
        open={showConfirmPost}
        onOpenChange={setShowConfirmPost}
        postData={newPost}
        onConfirm={handleConfirmUpload}
        uploading={uploading}
      />

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Your Video Analytics</DialogTitle>
          </DialogHeader>
          <VideoAnalytics posts={posts} user={user} />
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="hate speech">Hate Speech</SelectItem>
                <SelectItem value="scam">Scam or Fraud</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleReport} className="w-full bg-red-500 hover:bg-red-600" disabled={!reportReason}>
              <Flag className="w-4 h-4 mr-2" /> Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}