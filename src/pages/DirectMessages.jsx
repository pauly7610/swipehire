import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, ArrowLeft, User, Loader2, MessageSquare, 
  Search, Circle, Check, CheckCheck
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function DirectMessages() {
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connectionId');
  const userId = searchParams.get('userId');
  
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [allUsers, setAllUsers] = useState({});
  const [candidates, setCandidates] = useState({});
  const [messages, setMessages] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (connectionId && connections.length > 0) {
      const conn = connections.find(c => c.id === connectionId);
      if (conn) selectConversation(conn);
    } else if (userId && connections.length > 0 && user) {
      const conn = connections.find(c => 
        (c.requester_id === userId || c.receiver_id === userId) && 
        c.status === 'accepted'
      );
      if (conn) selectConversation(conn);
    }
  }, [connectionId, userId, connections, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages when active conversation
  useEffect(() => {
    if (activeConnection && user) {
      pollIntervalRef.current = setInterval(async () => {
        const otherUserId = activeConnection.requester_id === user.id ? activeConnection.receiver_id : activeConnection.requester_id;
        const connMessages = await base44.entities.DirectMessage.filter({
          $or: [
            { sender_id: user.id, receiver_id: otherUserId },
            { sender_id: otherUserId, receiver_id: user.id }
          ]
        });
        const sortedMessages = connMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        setMessages(sortedMessages);

        // Mark new unread messages as read
        const unreadMessages = connMessages.filter(m => m.receiver_id === user.id && !m.is_read && !messages.find(msg => msg.id === m.id));
        for (const msg of unreadMessages) {
          await base44.entities.DirectMessage.update(msg.id, { is_read: true });
        }
      }, 3000);

      return () => clearInterval(pollIntervalRef.current);
    }
  }, [activeConnection, user, messages]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [userConnections, users, allCandidates] = await Promise.all([
        base44.entities.Connection.filter({
          $or: [{ requester_id: currentUser.id }, { receiver_id: currentUser.id }]
        }),
        base44.entities.User.list(),
        base44.entities.Candidate.list()
      ]);

      const acceptedConnections = userConnections.filter(c => c.status === 'accepted');
      setConnections(acceptedConnections);

      const userMap = {};
      users.forEach(u => { userMap[u.id] = u; });
      setAllUsers(userMap);

      const candidateMap = {};
      allCandidates.forEach(c => { candidateMap[c.user_id] = c; });
      setCandidates(candidateMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const selectConversation = async (connection) => {
    setActiveConnection(connection);
    const otherUserId = connection.requester_id === user?.id ? connection.receiver_id : connection.requester_id;
    setActiveUser(allUsers[otherUserId]);

    // Load messages for this connection
    const connMessages = await base44.entities.DirectMessage.filter({
      $or: [
        { sender_id: user.id, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: user.id }
      ]
    });
    setMessages(connMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));

    // Mark unread messages as read
    const unreadMessages = connMessages.filter(m => m.receiver_id === user.id && !m.is_read);
    for (const msg of unreadMessages) {
      await base44.entities.DirectMessage.update(msg.id, { is_read: true });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConnection || !activeUser) return;

    setSending(true);
    try {
      const message = await base44.entities.DirectMessage.create({
        connection_id: activeConnection.id,
        sender_id: user.id,
        receiver_id: activeUser.id,
        content: newMessage,
        is_read: false
      });
      setMessages([...messages, message]);
      setNewMessage('');

      // Send notification
      await base44.entities.Notification.create({
        user_id: activeUser.id,
        type: 'message',
        title: '💬 New Message',
        message: `${user.full_name}: ${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
        navigate_to: 'DirectMessages'
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      // Clear typing indicator after 3 seconds of inactivity
    }, 3000);
  };

  const getOtherUser = (connection) => {
    const otherUserId = connection.requester_id === user?.id ? connection.receiver_id : connection.requester_id;
    return allUsers[otherUserId];
  };

  const formatMessageTime = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return 'Yesterday ' + format(d, 'h:mm a');
    return format(d, 'MMM d, h:mm a');
  };

  const filteredConnections = connections.filter(conn => {
    if (!searchQuery.trim()) return true;
    const otherUser = getOtherUser(conn);
    const candidate = candidates[otherUser?.id];
    const searchText = [
      otherUser?.full_name || '',
      candidate?.headline || ''
    ].join(' ').toLowerCase();
    return searchText.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <style>{`
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
      `}</style>

      {/* Conversations List */}
      <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col ${activeConnection && 'hidden md:flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-3">
            <MessageSquare className="w-6 h-6 text-pink-500" />
            Messages
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConnections.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <Link to={createPageUrl('Connections')}>
                <Button variant="outline" size="sm" className="mt-3">
                  Find Connections
                </Button>
              </Link>
            </div>
          ) : (
            filteredConnections.map(conn => {
              const otherUser = getOtherUser(conn);
              const candidate = candidates[otherUser?.id];
              const isActive = activeConnection?.id === conn.id;
              
              return (
                <div
                  key={conn.id}
                  onClick={() => selectConversation(conn)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${isActive ? 'bg-pink-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {candidate?.photo_url ? (
                      <img src={candidate.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center font-semibold text-pink-500">
                        {otherUser?.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{otherUser?.full_name}</p>
                      <p className="text-sm text-gray-500 truncate">{candidate?.headline || 'SwipeHire Member'}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeConnection && 'hidden md:flex'}`}>
        {activeConnection && activeUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
              <button 
                onClick={() => setActiveConnection(null)} 
                className="md:hidden p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {candidates[activeUser.id]?.photo_url ? (
                <img src={candidates[activeUser.id].photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center font-semibold text-pink-500">
                  {activeUser.full_name?.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activeUser.full_name}</p>
                <p className="text-sm text-gray-500">{candidates[activeUser.id]?.headline || 'SwipeHire Member'}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="max-w-2xl mx-auto space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full swipe-gradient mx-auto flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-500">Start the conversation with {activeUser.full_name}!</p>
                  </div>
                )}

                <AnimatePresence>
                  {messages.map((message, idx) => {
                    const isMe = message.sender_id === user.id;
                    const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1]?.sender_id !== message.sender_id);
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && showAvatar && (
                          <div className="flex-shrink-0">
                            {candidates[activeUser.id]?.photo_url ? (
                              <img src={candidates[activeUser.id].photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center text-xs font-semibold text-pink-500">
                                {activeUser?.full_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                        )}
                        {!isMe && !showAvatar && <div className="w-8" />}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            isMe 
                              ? 'swipe-gradient text-white rounded-br-md' 
                              : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <div className={`flex items-center gap-1 justify-end mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                            <span className="text-xs">{formatMessageTime(message.created_date)}</span>
                            {isMe && (
                              message.is_read ? 
                                <CheckCheck className="w-3 h-3" /> : 
                                <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="max-w-2xl mx-auto">
                <form 
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex items-center gap-3"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 h-12 rounded-full border-gray-200 px-4"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || sending}
                    className="w-12 h-12 rounded-full swipe-gradient p-0"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}