import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Inbox, MessageCircle, Calendar, Bell, Building2, Briefcase,
  Search, Filter, CheckCircle2, Clock, Video, Star, Loader2,
  ChevronRight, Eye, Users, Gift, XCircle, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, isToday, isYesterday, isSameDay } from 'date-fns';

export default function CommunicationHub() {
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [matches, setMatches] = useState([]);
  const [jobs, setJobs] = useState({});
  const [companies, setCompanies] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate(createPageUrl('Welcome'), { replace: true });
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user is a candidate or recruiter
      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      const [companyData] = await base44.entities.Company.filter({ user_id: currentUser.id });
      
      if (!candidateData && !companyData) {
        navigate(createPageUrl('Onboarding'), { replace: true });
        return;
      }

      setCandidate(candidateData);

      if (candidateData) {
        // Load all data in parallel
        const [
          userMessages,
          sentMessages,
          userNotifications,
          allInterviews,
          candidateMatches,
          allJobs,
          allCompanies
        ] = await Promise.all([
          base44.entities.DirectMessage.filter({ receiver_id: currentUser.id }, '-created_date', 100),
          base44.entities.DirectMessage.filter({ sender_id: currentUser.id }, '-created_date', 100),
          base44.entities.Notification.filter({ user_id: currentUser.id }, '-created_date', 50),
          base44.entities.Interview.list(),
          base44.entities.Match.filter({ candidate_id: candidateData.id }, '-created_date'),
          base44.entities.Job.list(),
          base44.entities.Company.list()
        ]);

        const candidateInterviews = allInterviews.filter(i => i.candidate_id === candidateData.id);

        setMessages([...userMessages, ...sentMessages]);
        setNotifications(userNotifications);
        setInterviews(candidateInterviews);
        setMatches(candidateMatches);

        const jobMap = {};
        allJobs.forEach(j => { jobMap[j.id] = j; });
        setJobs(jobMap);

        const companyMap = {};
        allCompanies.forEach(c => { companyMap[c.id] = c; });
        setCompanies(companyMap);
      } else if (companyData) {
        // Recruiter view - load recruiter-specific data including interviews
        const [
          userMessages,
          sentMessages,
          userNotifications,
          allInterviews,
          companyMatches,
          allJobs,
          allCompanies
        ] = await Promise.all([
          base44.entities.DirectMessage.filter({ receiver_id: currentUser.id }, '-created_date', 100),
          base44.entities.DirectMessage.filter({ sender_id: currentUser.id }, '-created_date', 100),
          base44.entities.Notification.filter({ user_id: currentUser.id }, '-created_date', 50),
          base44.entities.Interview.list(),
          base44.entities.Match.filter({ company_id: companyData.id }, '-created_date'),
          base44.entities.Job.list(),
          base44.entities.Company.list()
        ]);

        const companyInterviews = allInterviews.filter(i => i.company_id === companyData.id);

        setMessages([...userMessages, ...sentMessages]);
        setNotifications(userNotifications);
        setInterviews(companyInterviews);
        setMatches(companyMatches);

        const jobMap = {};
        allJobs.forEach(j => { jobMap[j.id] = j; });
        setJobs(jobMap);

        const companyMap = {};
        allCompanies.forEach(c => { companyMap[c.id] = c; });
        setCompanies(companyMap);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      navigate(createPageUrl('Welcome'), { replace: true });
    }
    setLoading(false);
  };

  const markNotificationRead = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, { is_read: true });
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => 
      base44.entities.Notification.update(n.id, { is_read: true })
    ));
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  // Combine all items into unified feed
  const unifiedFeed = React.useMemo(() => {
    const items = [];

    // Add messages (filter based on tab)
    const messagesToShow = activeTab === 'sent' 
      ? messages.filter(m => m.sender_id === user?.id)
      : messages.filter(m => m.receiver_id === user?.id);
    
    messagesToShow.forEach(msg => {
      items.push({
        id: `msg-${msg.id}`,
        type: 'message',
        data: msg,
        date: new Date(msg.created_date),
        isRead: msg.is_read,
        isSent: msg.sender_id === user?.id
      });
    });

    // Add notifications
    notifications.forEach(notif => {
      items.push({
        id: `notif-${notif.id}`,
        type: 'notification',
        data: notif,
        date: new Date(notif.created_date),
        isRead: notif.is_read
      });
    });

    // Add upcoming interviews
    interviews.filter(i => ['scheduled', 'confirmed'].includes(i.status)).forEach(interview => {
      items.push({
        id: `interview-${interview.id}`,
        type: 'interview',
        data: interview,
        date: new Date(interview.scheduled_at || interview.created_date),
        isRead: true
      });
    });

    // Add recent status changes from matches
    matches.filter(m => m.status !== 'matched').forEach(match => {
      items.push({
        id: `status-${match.id}`,
        type: 'status',
        data: match,
        date: new Date(match.updated_date || match.created_date),
        isRead: true
      });
    });

    // Sort by date descending
    items.sort((a, b) => b.date - a.date);

    // Filter by tab
    if (activeTab === 'messages') {
      return items.filter(i => i.type === 'message' && !i.isSent);
    } else if (activeTab === 'sent') {
      return items.filter(i => i.type === 'message' && i.isSent);
    } else if (activeTab === 'interviews') {
      return items.filter(i => i.type === 'interview');
    } else if (activeTab === 'updates') {
      return items.filter(i => i.type === 'notification' || i.type === 'status');
    }

    return items;
  }, [messages, notifications, interviews, matches, activeTab, user]);

  // Filter by search
  const filteredFeed = searchQuery 
    ? unifiedFeed.filter(item => {
        const job = jobs[item.data?.job_id];
        const company = companies[item.data?.company_id || job?.company_id];
        const searchLower = searchQuery.toLowerCase();
        return (
          job?.title?.toLowerCase().includes(searchLower) ||
          company?.name?.toLowerCase().includes(searchLower) ||
          item.data?.content?.toLowerCase().includes(searchLower) ||
          item.data?.message?.toLowerCase().includes(searchLower)
        );
      })
    : unifiedFeed;

  // Group by date
  const groupedFeed = React.useMemo(() => {
    const groups = {};
    filteredFeed.forEach(item => {
      let key;
      if (isToday(item.date)) {
        key = 'Today';
      } else if (isYesterday(item.date)) {
        key = 'Yesterday';
      } else {
        key = format(item.date, 'MMMM d, yyyy');
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredFeed]);

  const unreadCount = notifications.filter(n => !n.is_read).length + messages.filter(m => !m.is_read).length;
  const upcomingInterviews = interviews.filter(i => ['scheduled', 'confirmed'].includes(i.status)).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <style>{`
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Header */}
      <div className="swipe-gradient px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">Communication Hub</h1>
          <p className="text-white/80 text-sm">All your job communications in one place</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">
        {/* Debug Info */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
          <p><strong>Debug:</strong></p>
          <p>Interviews loaded: {interviews.length}</p>
          <p>Upcoming interviews: {upcomingInterviews}</p>
          <p>Active tab: {activeTab}</p>
          <p>Unified feed items: {unifiedFeed.length}</p>
          <p>Filtered feed items: {filteredFeed.length}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-pink-100 flex items-center justify-center mb-2">
                <Inbox className="w-5 h-5 text-pink-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-xs text-gray-500">Unread</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{upcomingInterviews}</p>
              <p className="text-xs text-gray-500">Interviews</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
              <p className="text-xs text-gray-500">Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search messages, companies, jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl border-0 shadow-sm"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="w-full bg-white rounded-xl p-1 shadow-sm h-auto">
            <TabsTrigger 
              value="all" 
              className="flex-1 rounded-lg py-2 text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              All
              {unreadCount > 0 && (
                <Badge className="ml-1 bg-white/20 text-current text-xs">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="flex-1 rounded-lg py-2 text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Inbox
            </TabsTrigger>
            <TabsTrigger 
              value="sent" 
              className="flex-1 rounded-lg py-2 text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <ArrowRight className="w-4 h-4 mr-1" />
              Sent
            </TabsTrigger>
            <TabsTrigger 
              value="interviews" 
              className="flex-1 rounded-lg py-2 text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Interviews
            </TabsTrigger>
            <TabsTrigger 
              value="updates" 
              className="flex-1 rounded-lg py-2 text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Bell className="w-4 h-4 mr-1" />
              Updates
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Mark All Read */}
        {unreadCount > 0 && (
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-pink-500">
              Mark all as read
            </Button>
          </div>
        )}

        {/* Feed */}
        {Object.keys(groupedFeed).length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Inbox className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">No communications yet</h3>
              <p className="text-gray-500 text-sm mb-4">Start applying to jobs to receive updates</p>
              <Link to={createPageUrl('SwipeJobs')}>
                <Button className="swipe-gradient text-white">Find Jobs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFeed).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
                <div className="space-y-3">
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <FeedItem
                        key={item.id}
                        item={item}
                        jobs={jobs}
                        companies={companies}
                        onRead={markNotificationRead}
                        index={index}
                        navigate={navigate}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedItem({ item, jobs, companies, onRead, index, navigate }) {
  const { type, data, isRead, date } = item;
  const job = jobs[data?.job_id];
  const company = companies[data?.company_id || job?.company_id];

  const handleClick = () => {
    if (type === 'notification' && !isRead) {
      onRead(data.id);
    }

    // Navigate based on type
    if (type === 'message' && data.connection_id) {
      navigate(createPageUrl('DirectMessages'));
    } else if (type === 'interview' && data.match_id) {
      navigate(createPageUrl('Chat') + `?matchId=${data.match_id}`);
    } else if (type === 'notification' && data.navigate_to) {
      navigate(createPageUrl(data.navigate_to));
    } else if (type === 'status' && data.id) {
      navigate(createPageUrl('ApplicationTracker'));
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'interview':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'notification':
        if (data.type === 'new_match') return <Star className="w-5 h-5 text-pink-500" />;
        if (data.type === 'interview') return <Calendar className="w-5 h-5 text-purple-500" />;
        if (data.type === 'offer') return <Gift className="w-5 h-5 text-green-500" />;
        return <Bell className="w-5 h-5 text-amber-500" />;
      case 'status':
        if (data.status === 'hired') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        if (data.status === 'rejected') return <XCircle className="w-5 h-5 text-gray-400" />;
        if (data.status === 'offered') return <Gift className="w-5 h-5 text-green-500" />;
        if (data.status === 'interviewing') return <Calendar className="w-5 h-5 text-purple-500" />;
        return <Eye className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'message':
        return item.isSent ? 'Sent Message' : 'New Message';
      case 'interview':
        return `Interview ${data.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}`;
      case 'notification':
        return data.title;
      case 'status':
        return `Application ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`;
      default:
        return 'Update';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'message':
        return data.content?.substring(0, 80) + (data.content?.length > 80 ? '...' : '');
      case 'interview':
        return `${job?.title || 'Position'} at ${company?.name || 'Company'} - ${data.scheduled_at ? format(new Date(data.scheduled_at), 'MMM d, h:mm a') : 'Time TBD'}`;
      case 'notification':
        return data.message;
      case 'status':
        return `${job?.title || 'Position'} at ${company?.name || 'Company'}`;
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card 
        className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-all ${!isRead ? 'bg-pink-50/50 border-l-4 border-l-pink-500' : ''}`}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Company Logo or Icon */}
            {company?.logo_url ? (
              <img src={company.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                type === 'interview' ? 'bg-purple-100' :
                type === 'message' ? 'bg-blue-100' :
                type === 'status' && data.status === 'hired' ? 'bg-green-100' :
                'bg-gray-100'
              }`}>
                {getIcon()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`font-medium ${!isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                  {getTitle()}
                </h4>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDistanceToNow(date, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{getDescription()}</p>
              
              {/* Extra info for interviews */}
              {type === 'interview' && data.scheduled_at && (
                <Badge className="mt-2 bg-purple-100 text-purple-700">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(new Date(data.scheduled_at), 'EEEE, MMM d')}
                </Badge>
              )}

              {/* Company name badge */}
              {company && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                  <Building2 className="w-3 h-3" />
                  {company.name}
                </div>
              )}
            </div>

            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}