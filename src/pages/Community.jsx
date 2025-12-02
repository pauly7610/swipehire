import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, Heart, Users, Plus, Search, 
  TrendingUp, Clock, Loader2, Send, UserPlus,
  Briefcase, BookOpen, Newspaper, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = [
  { value: 'career-advice', label: 'Career Advice', icon: Briefcase },
  { value: 'interview-tips', label: 'Interview Tips', icon: MessageSquare },
  { value: 'industry-news', label: 'Industry News', icon: Newspaper },
  { value: 'job-search', label: 'Job Search', icon: Search },
  { value: 'networking', label: 'Networking', icon: Network },
  { value: 'general', label: 'General', icon: BookOpen },
];

export default function Community() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allPosts, allUsers, userConnections] = await Promise.all([
        base44.entities.ForumPost.list('-created_date', 50),
        base44.entities.User.list(),
        base44.entities.Connection.filter({ 
          $or: [{ requester_id: currentUser.id }, { receiver_id: currentUser.id }]
        })
      ]);

      setPosts(allPosts);
      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);
      setConnections(userConnections);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) return;
    setSubmitting(true);
    try {
      const post = await base44.entities.ForumPost.create({
        author_id: user.id,
        author_type: 'candidate',
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setPosts([post, ...posts]);
      setNewPost({ title: '', content: '', category: 'general', tags: '' });
      setShowNewPost(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
    setSubmitting(false);
  };

  const handleLike = async (post) => {
    await base44.entities.ForumPost.update(post.id, { likes: (post.likes || 0) + 1 });
    setPosts(posts.map(p => p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p));
  };

  const handleConnect = async (targetUserId) => {
    await base44.entities.Connection.create({
      requester_id: user.id,
      receiver_id: targetUserId,
      status: 'pending'
    });
    const newConnection = { requester_id: user.id, receiver_id: targetUserId, status: 'pending' };
    setConnections([...connections, newConnection]);
  };

  const isConnected = (userId) => {
    return connections.some(c => 
      (c.requester_id === userId || c.receiver_id === userId) && 
      (c.requester_id === user?.id || c.receiver_id === user?.id)
    );
  };

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <style>{`
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-8 h-8 text-pink-500" />
              Community
            </h1>
            <p className="text-gray-500">Connect, learn, and grow together</p>
          </div>
          <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
            <DialogTrigger asChild>
              <Button className="swipe-gradient text-white">
                <Plus className="w-4 h-4 mr-2" /> New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Post title..."
                  value={newPost.title}
                  onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                />
                <Select value={newPost.category} onValueChange={v => setNewPost({ ...newPost, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPost.content}
                  onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                  rows={5}
                />
                <Input
                  placeholder="Tags (comma separated)"
                  value={newPost.tags}
                  onChange={e => setNewPost({ ...newPost, tags: e.target.value })}
                />
                <Button onClick={handleCreatePost} className="w-full swipe-gradient text-white" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Post
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Badge
            className={`cursor-pointer whitespace-nowrap ${selectedCategory === 'all' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Posts
          </Badge>
          {CATEGORIES.map(cat => (
            <Badge
              key={cat.value}
              className={`cursor-pointer whitespace-nowrap ${selectedCategory === cat.value ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredPosts.map((post, i) => {
              const author = users[post.author_id];
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center font-semibold text-pink-500">
                            {author?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{author?.full_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {author && author.id !== user?.id && !isConnected(author.id) && (
                          <Button variant="outline" size="sm" onClick={() => handleConnect(author.id)}>
                            <UserPlus className="w-4 h-4 mr-1" /> Connect
                          </Button>
                        )}
                        {isConnected(author?.id) && author?.id !== user?.id && (
                          <Badge variant="secondary">Connected</Badge>
                        )}
                      </div>

                      <Badge variant="secondary" className="mb-2 capitalize">
                        {post.category?.replace('-', ' ')}
                      </Badge>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{post.content}</p>

                      {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {post.tags.map((tag, j) => (
                            <Badge key={j} variant="outline" className="text-xs">#{tag}</Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                        <button
                          onClick={() => handleLike(post)}
                          className="flex items-center gap-1 text-gray-500 hover:text-pink-500 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{post.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm">{post.comments_count || 0}</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredPosts.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No posts yet. Be the first to share!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}