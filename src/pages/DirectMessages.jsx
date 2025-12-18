import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, ArrowLeft, User, Search, Loader2, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function DirectMessages() {
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connectionId');
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (connectionId && connections.length > 0) {
      const connection = connections.find(c => c.id === connectionId);
      if (connection) {
        setSelectedConnection(connection);
        loadMessages(connectionId);
      }
    }
  }, [connectionId, connections]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling for new messages
  useEffect(() => {
    if (!selectedConnection) return;

    const interval = setInterval(async () => {
      try {
        const msgs = await base44.entities.DirectMessage.filter({ 
          connection_id: selectedConnection.id 
        });
        const sorted = msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        if (sorted.length !== messages.length) {
          setMessages(sorted);
          // Mark as read
          const unread = sorted.filter(m => m.receiver_id === user.id && !m.is_read);
          await Promise.all(unread.map(m => 
            base44.entities.DirectMessage.update(m.id, { is_read: true })
          ));
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConnection, messages.length, user]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allConnections, allUsers] = await Promise.all([
        base44.entities.Connection.filter({ status: 'accepted' }),
        base44.entities.User.list()
      ]);

      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);

      const myConnections = allConnections.filter(
        c => c.requester_id === currentUser.id || c.receiver_id === currentUser.id
      );
      setConnections(myConnections);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const loadMessages = async (connId) => {
    try {
      const msgs = await base44.entities.DirectMessage.filter({ connection_id: connId });
      const sorted = msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      setMessages(sorted);

      // Mark as read
      const unread = sorted.filter(m => m.receiver_id === user.id && !m.is_read);
      await Promise.all(unread.map(m => 
        base44.entities.DirectMessage.update(m.id, { is_read: true })
      ));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConnection) return;

    setSending(true);
    try {
      const otherUserId = selectedConnection.requester_id === user.id 
        ? selectedConnection.receiver_id 
        : selectedConnection.requester_id;

      const message = await base44.entities.DirectMessage.create({
        connection_id: selectedConnection.id,
        sender_id: user.id,
        receiver_id: otherUserId,
        content: newMessage
      });

      setMessages([...messages, message]);
      setNewMessage('');

      // Send notification
      await base44.entities.Notification.create({
        user_id: otherUserId,
        type: 'message',
        title: 'New Message',
        message: `${user.full_name} sent you a message`,
        navigate_to: 'DirectMessages'
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  const getOtherUser = (connection) => {
    const otherUserId = connection.requester_id === user?.id 
      ? connection.receiver_id 
      : connection.requester_id;
    return users[otherUserId];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      {/* Sidebar - Connections List */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        </div>

        <ScrollArea className="flex-1">
          {connections.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No connections yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {connections.map((connection) => {
                const otherUser = getOtherUser(connection);
                return (
                  <button
                    key={connection.id}
                    onClick={() => {
                      setSelectedConnection(connection);
                      loadMessages(connection.id);
                    }}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      selectedConnection?.id === connection.id ? 'bg-pink-50' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full swipe-gradient flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {otherUser?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {otherUser?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {otherUser?.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConnection ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
              <button
                onClick={() => setSelectedConnection(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full swipe-gradient flex items-center justify-center text-white font-semibold">
                {getOtherUser(selectedConnection)?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {getOtherUser(selectedConnection)?.full_name || 'User'}
                </h3>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg) => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                              isMe
                                ? 'swipe-gradient text-white rounded-br-md'
                                : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                              {format(new Date(msg.created_date), 'h:mm a')}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="max-w-3xl mx-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-3"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
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
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a connection to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}