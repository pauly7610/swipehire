import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, MessageCircle, Share2, Plus, Play, Pause,
  Volume2, VolumeX, User, Briefcase, Building2, Loader2,
  Sparkles, BookmarkPlus, Send, Trash2, Flag, MoreVertical
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

const VideoCard = ({ post, user, isActive, onLike, onView, candidate, company, onComment, onShare, onFollow, isFollowing, onDelete, isOwner, onReport }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(isFollowing);
  
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

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Video Container */}
      <div className="relative w-full max-w-md h-full max-h-[85vh] mx-auto">
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
      </div>
      </div>
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

      const currentPage = isLoadMore ? page + 1 : 0;
      
      const [allPosts, allUsers, allCandidates, allCompanies, allFollows] = await Promise.all([
        base44.entities.VideoPost.list('-created_date', 100),
        base44.entities.User.list(),
        base44.entities.Candidate.list(),
        base44.entities.Company.list(),
        base44.entities.Follow.filter({ follower_id: currentUser.id })
      ]);

      const followedIds = new Set(allFollows.map(f => f.followed_id));
      if (!isLoadMore) setFollowedUserIds(followedIds);

      // Enhanced "For You" Algorithm with personalization
      const now = new Date();
      const candidateData = allCandidates.find(c => c.user_id === currentUser.id);
      const userSkills = candidateData?.skills || [];
      const userPreferences = candidateData?.culture_preferences || [];
      const userLocation = candidateData?.location?.toLowerCase() || '';
      
      // Get author types user has engaged with
      const likedAuthors = new Set();
      const likedTypes = new Set();
      
      const scoredPosts = allPosts.map(p => {
        let score = 0;
        
        // 1. Engagement Score (viral content)
        const engagementScore = (p.likes || 0) * 3 + (p.views || 0) * 0.5 + (p.shares || 0) * 5 + (p.comments_count || 0) * 4;
        score += Math.min(engagementScore, 100); // Cap at 100
        
        // 2. Recency boost (fresher content ranks higher)
        const postAge = (now - new Date(p.created_date)) / (1000 * 60 * 60);
        if (postAge < 6) score += 60;
        else if (postAge < 24) score += 45;
        else if (postAge < 72) score += 30;
        else if (postAge < 168) score += 15;
        
        // 3. Following boost (content from followed users)
        if (followedIds.has(p.author_id)) score += 40;
        
        // 4. Skills/Tags relevance
        const tagMatches = p.tags?.filter(tag => 
          userSkills.some(skill => 
            skill.toLowerCase().includes(tag.toLowerCase()) || 
            tag.toLowerCase().includes(skill.toLowerCase())
          )
        ).length || 0;
        score += tagMatches * 30;
        
        // 5. Content type preference (based on user type)
        const companyData = allCompanies.find(c => c.user_id === currentUser.id);
        if (companyData) {
          // Employer prefers candidate intros
          if (p.type === 'intro' && p.author_type === 'candidate') score += 35;
        } else {
          // Candidate prefers job posts and company culture
          if (p.type === 'job_post') score += 35;
          if (p.type === 'company_culture') score += 30;
          if (p.type === 'tips') score += 25;
        }
        
        // 6. Location relevance
        const authorCandidate = allCandidates.find(c => c.user_id === p.author_id);
        const authorCompany = allCompanies.find(c => c.user_id === p.author_id);
        const authorLocation = (authorCandidate?.location || authorCompany?.location || '').toLowerCase();
        if (userLocation && authorLocation && authorLocation.includes(userLocation.split(',')[0])) {
          score += 25;
        }
        
        // 7. Diversity factor (mix content types)
        const typeBonus = { job_post: 15, tips: 12, day_in_life: 10, company_culture: 12, intro: 8 }[p.type] || 5;
        score += typeBonus;
        
        // 8. Quality signals
        if (p.caption?.length > 50) score += 10; // Detailed captions
        if (p.tags?.length >= 3) score += 8; // Well-tagged content
        
        // 9. Discovery factor (introduce new content)
        score += Math.random() * 15;
        
        // 10. Penalty for already viewed (if tracked)
        if (viewedPostIds.has(p.id)) score -= 50;
        
        return { ...p, score };
      })
      .filter(p => p.moderation_status !== 'rejected')
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
        caption: newPost.caption,
        type: newPost.type,
        tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean)
      });

      setPosts([post, ...posts]);
      setShowConfirmPost(false);
      setPendingFile(null);
      setNewPost({ caption: '', type: 'intro', tags: '' });
    } catch (error) {
      console.error('Failed to upload:', error);
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
          {posts.filter(p => p.moderation_status !== 'rejected').map((post, index) => (
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
                />
              </div>
            ))}
          
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
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
        <h1 className="text-white font-bold text-xl">SwipeHire</h1>
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
                        className={`${activeTab === 'discover' ? 'bg-pink-500 text-white' : 'bg-black/40 text-white'} border-0 cursor-pointer`}
                        onClick={() => setActiveTab('discover')}
                      >
                        Discover
                      </Badge>
                      <Badge 
                        className="bg-black/40 text-white border-0 cursor-pointer"
                        onClick={() => setShowAnalytics(true)}
                      >
                        📊
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