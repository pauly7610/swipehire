import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  UserCheck, UserPlus, Clock, MessageCircle, X, Check, 
  Loader2, Users, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function Connections() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [users, setUsers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allConnections, allUsers] = await Promise.all([
        base44.entities.Connection.list(),
        base44.entities.User.list()
      ]);

      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);

      // Filter connections by user
      const accepted = allConnections.filter(c => 
        (c.requester_id === currentUser.id || c.receiver_id === currentUser.id) && 
        c.status === 'accepted'
      );
      
      const pending = allConnections.filter(c => 
        c.receiver_id === currentUser.id && c.status === 'pending'
      );
      
      const sent = allConnections.filter(c => 
        c.requester_id === currentUser.id && c.status === 'pending'
      );

      setConnections(accepted);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
    setLoading(false);
  };

  const handleAccept = async (connectionId) => {
    try {
      await base44.entities.Connection.update(connectionId, { status: 'accepted' });
      
      const connection = pendingRequests.find(c => c.id === connectionId);
      if (connection) {
        // Notify requester
        await base44.entities.Notification.create({
          user_id: connection.requester_id,
          type: 'connection_accepted',
          title: '✅ Connection Accepted',
          message: `${user.full_name} accepted your connection request!`,
          navigate_to: 'DirectMessages'
        });
      }
      
      loadData();
    } catch (error) {
      console.error('Failed to accept connection:', error);
    }
  };

  const handleReject = async (connectionId) => {
    try {
      await base44.entities.Connection.update(connectionId, { status: 'rejected' });
      loadData();
    } catch (error) {
      console.error('Failed to reject connection:', error);
    }
  };

  const handleMessage = (connection) => {
    navigate(createPageUrl('DirectMessages') + `?connectionId=${connection.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Connections</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your professional network</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm dark:bg-slate-900">
            <CardContent className="p-4 text-center">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{connections.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Connections</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-900">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRequests.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Requests</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-900">
            <CardContent className="p-4 text-center">
              <UserPlus className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sentRequests.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="connections" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm">
            <TabsTrigger value="connections" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg">
              My Connections
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg">
              Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg">
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* My Connections */}
          <TabsContent value="connections">
            {connections.length === 0 ? (
              <Card className="border-0 shadow-sm dark:bg-slate-900">
                <CardContent className="py-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No connections yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Start connecting with recruiters and candidates!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {connections.map((connection) => {
                  const otherUserId = connection.requester_id === user.id 
                    ? connection.receiver_id 
                    : connection.requester_id;
                  const otherUser = users[otherUserId];

                  return (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full swipe-gradient flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                              {otherUser?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {otherUser?.full_name || 'User'}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {otherUser?.email}
                              </p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                <UserCheck className="w-3 h-3 mr-1" /> Connected
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleMessage(connection)}
                              className="swipe-gradient text-white"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Pending Requests */}
          <TabsContent value="requests">
            {pendingRequests.length === 0 ? (
              <Card className="border-0 shadow-sm dark:bg-slate-900">
                <CardContent className="py-12 text-center">
                  <Clock className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request) => {
                  const requester = users[request.requester_id];

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-0 shadow-sm dark:bg-slate-900 bg-gradient-to-r from-pink-50/50 to-orange-50/50 dark:from-pink-950/20 dark:to-orange-950/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full swipe-gradient flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                              {requester?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {requester?.full_name || 'User'}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {requester?.email}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {format(new Date(request.created_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAccept(request.id)}
                                className="swipe-gradient text-white"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(request.id)}
                                className="text-gray-600 dark:text-gray-400"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Sent Requests */}
          <TabsContent value="sent">
            {sentRequests.length === 0 ? (
              <Card className="border-0 shadow-sm dark:bg-slate-900">
                <CardContent className="py-12 text-center">
                  <UserPlus className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No sent requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sentRequests.map((request) => {
                  const receiver = users[request.receiver_id];

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-0 shadow-sm dark:bg-slate-900">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-amber-800 text-xl font-bold flex-shrink-0">
                              {receiver?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {receiver?.full_name || 'User'}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {receiver?.email}
                              </p>
                              <Badge className="mt-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <Clock className="w-3 h-3 mr-1" /> Pending
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}