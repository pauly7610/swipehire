import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, UserPlus, UserCheck, UserX, Search, 
  Loader2, MessageSquare, Mail, Clock, MapPin, Briefcase, Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function Connections() {
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Welcome');
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [userConnections, users, allCandidates, allCompanies] = await Promise.all([
        base44.entities.Connection.filter({
          $or: [{ requester_id: currentUser.id }, { receiver_id: currentUser.id }]
        }),
        base44.entities.User.list(),
        base44.entities.Candidate.list(),
        base44.entities.Company.list()
      ]);

      setConnections(userConnections);
      setAllUsers(users);
      setCandidates(allCandidates);
      setCompanies(allCompanies);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const getConnectionUser = (connection) => {
    const otherUserId = connection.requester_id === user?.id ? connection.receiver_id : connection.requester_id;
    return allUsers.find(u => u.id === otherUserId);
  };

  const getCandidateForUser = (userId) => {
    return candidates.find(c => c.user_id === userId);
  };

  const getCompanyForUser = (userId) => {
    return companies.find(c => c.user_id === userId);
  };

  const getUserType = (userId) => {
    const candidate = getCandidateForUser(userId);
    const company = getCompanyForUser(userId);
    if (company) return 'employer';
    if (candidate) return 'candidate';
    return 'member';
  };

  const handleAccept = async (connection) => {
    await base44.entities.Connection.update(connection.id, { status: 'accepted' });
    setConnections(connections.map(c => c.id === connection.id ? { ...c, status: 'accepted' } : c));
  };

  const handleReject = async (connection) => {
    await base44.entities.Connection.update(connection.id, { status: 'rejected' });
    setConnections(connections.filter(c => c.id !== connection.id));
  };

  const handleConnect = async (targetUserId) => {
    const connection = await base44.entities.Connection.create({
      requester_id: user.id,
      receiver_id: targetUserId,
      status: 'pending'
    });
    setConnections([...connections, connection]);
  };

  const isConnected = (userId) => {
    return connections.some(c =>
      (c.requester_id === userId || c.receiver_id === userId) &&
      c.status === 'accepted'
    );
  };

  const hasPendingRequest = (userId) => {
    return connections.some(c =>
      (c.requester_id === userId || c.receiver_id === userId) &&
      c.status === 'pending'
    );
  };

  const acceptedConnections = connections.filter(c => c.status === 'accepted');
  const pendingReceived = connections.filter(c => c.receiver_id === user?.id && c.status === 'pending');
  const pendingSent = connections.filter(c => c.requester_id === user?.id && c.status === 'pending');

  const suggestedUsers = allUsers.filter(u => {
    if (u.id === user?.id) return false;
    if (isConnected(u.id)) return false;
    if (hasPendingRequest(u.id)) return false;
    
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const candidate = getCandidateForUser(u.id);
    const company = getCompanyForUser(u.id);
    
    const searchableText = [
      u.full_name || '',
      u.email || '',
      candidate?.headline || '',
      candidate?.location || '',
      candidate?.bio || '',
      ...(candidate?.skills || []),
      company?.name || '',
      company?.industry || ''
    ].join(' ').toLowerCase();
    
    return searchableText.includes(query);
  }).slice(0, 20);

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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-pink-500" />
            My Network
          </h1>
          <p className="text-gray-500">{acceptedConnections.length} connections</p>
        </div>

        <Tabs defaultValue="connections" className="space-y-4">
          <TabsList className="bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="connections" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg">
              Connections ({acceptedConnections.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg">
              Pending ({pendingReceived.length})
            </TabsTrigger>
            <TabsTrigger value="discover" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg">
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4">
            {acceptedConnections.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No connections yet. Start networking!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {acceptedConnections.map((conn, i) => {
                  const connUser = getConnectionUser(conn);
                  const candidate = getCandidateForUser(connUser?.id);
                  return (
                    <motion.div key={conn.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center font-semibold text-pink-500">
                              {connUser?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{connUser?.full_name}</p>
                              <p className="text-sm text-gray-500">{candidate?.headline || 'SwipeHire Member'}</p>
                            </div>
                            <Link to={createPageUrl('DirectMessages') + `?connectionId=${conn.id}`}>
                              <Button variant="outline" size="sm">
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingReceived.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No pending requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingReceived.map((conn, i) => {
                  const connUser = getConnectionUser(conn);
                  const candidate = getCandidateForUser(connUser?.id);
                  return (
                    <motion.div key={conn.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center font-semibold text-pink-500">
                              {connUser?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{connUser?.full_name}</p>
                              <p className="text-sm text-gray-500">{candidate?.headline || 'wants to connect'}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="swipe-gradient text-white" onClick={() => handleAccept(conn)}>
                                <UserCheck className="w-4 h-4 mr-1" /> Accept
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleReject(conn)}>
                                <UserX className="w-4 h-4" />
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

          <TabsContent value="discover" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, skills, company, location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <p className="text-sm text-gray-500">
              {suggestedUsers.length} people found {searchQuery && `for "${searchQuery}"`}
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {suggestedUsers.map((suggestedUser, i) => {
                const candidate = getCandidateForUser(suggestedUser.id);
                const company = getCompanyForUser(suggestedUser.id);
                const userType = getUserType(suggestedUser.id);
                const photo = candidate?.photo_url || company?.logo_url;
                
                return (
                  <motion.div key={suggestedUser.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {photo ? (
                            <img src={photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center font-semibold text-pink-500">
                              {suggestedUser.full_name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate">{suggestedUser.full_name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {userType === 'employer' ? (
                                  <><Building2 className="w-3 h-3 mr-1" /> Employer</>
                                ) : userType === 'candidate' ? (
                                  <><Briefcase className="w-3 h-3 mr-1" /> Candidate</>
                                ) : 'Member'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {company?.name || candidate?.headline || 'SwipeHire Member'}
                            </p>
                            {(candidate?.location || company?.location) && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {candidate?.location || company?.location}
                              </p>
                            )}
                            {candidate?.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {candidate.skills.slice(0, 3).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <Button size="sm" className="flex-1 swipe-gradient text-white" onClick={() => handleConnect(suggestedUser.id)}>
                            <UserPlus className="w-4 h-4 mr-1" /> Connect
                          </Button>
                          {candidate && (
                            <Link to={createPageUrl('ViewCandidateProfile') + `?id=${candidate.id}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          )}
                          {company && (
                            <Link to={createPageUrl('CompanyProfile') + `?id=${company.id}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {suggestedUsers.length === 0 && searchQuery && (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No people found matching "{searchQuery}"</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}