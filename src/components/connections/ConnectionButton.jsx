import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Clock, MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

/**
 * Connection/Friend request button
 * Shows current status and allows sending/accepting connection requests
 */
export default function ConnectionButton({ 
  targetUserId, 
  currentUserId, 
  onStatusChange,
  size = 'default',
  variant = 'default'
}) {
  const [status, setStatus] = useState(null); // null, 'pending', 'accepted', 'sent'
  const [loading, setLoading] = useState(false);
  const [connectionId, setConnectionId] = useState(null);

  useEffect(() => {
    checkConnectionStatus();
  }, [targetUserId, currentUserId]);

  const checkConnectionStatus = async () => {
    if (!targetUserId || !currentUserId) return;

    try {
      // Check if connection exists in either direction
      const [sentRequests, receivedRequests] = await Promise.all([
        base44.entities.Connection.filter({ 
          requester_id: currentUserId, 
          receiver_id: targetUserId 
        }),
        base44.entities.Connection.filter({ 
          requester_id: targetUserId, 
          receiver_id: currentUserId 
        })
      ]);

      if (sentRequests.length > 0) {
        const conn = sentRequests[0];
        setConnectionId(conn.id);
        setStatus(conn.status === 'accepted' ? 'accepted' : 'sent');
      } else if (receivedRequests.length > 0) {
        const conn = receivedRequests[0];
        setConnectionId(conn.id);
        setStatus(conn.status === 'accepted' ? 'accepted' : 'pending');
      } else {
        setStatus(null);
        setConnectionId(null);
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const connection = await base44.entities.Connection.create({
        requester_id: currentUserId,
        receiver_id: targetUserId,
        status: 'pending'
      });

      setConnectionId(connection.id);
      setStatus('sent');

      // Notify the target user
      await base44.entities.Notification.create({
        user_id: targetUserId,
        type: 'connection_request',
        title: '👋 New Connection Request',
        message: `Someone wants to connect with you!`,
        navigate_to: 'Connections'
      });

      if (onStatusChange) onStatusChange('sent');
    } catch (error) {
      console.error('Failed to send connection request:', error);
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!connectionId) return;
    setLoading(true);
    try {
      await base44.entities.Connection.update(connectionId, { status: 'accepted' });
      setStatus('accepted');

      // Notify the requester
      await base44.entities.Notification.create({
        user_id: targetUserId,
        type: 'connection_accepted',
        title: '✅ Connection Accepted',
        message: `Your connection request was accepted!`,
        navigate_to: 'DirectMessages'
      });

      if (onStatusChange) onStatusChange('accepted');
    } catch (error) {
      console.error('Failed to accept connection:', error);
    }
    setLoading(false);
  };

  if (status === 'accepted') {
    return (
      <Button
        size={size}
        variant="outline"
        className={cn(
          "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
          "dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400"
        )}
        disabled
      >
        <UserCheck className="w-4 h-4 mr-2" />
        Connected
      </Button>
    );
  }

  if (status === 'sent') {
    return (
      <Button
        size={size}
        variant="outline"
        disabled
        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400"
      >
        <Clock className="w-4 h-4 mr-2" />
        Pending
      </Button>
    );
  }

  if (status === 'pending') {
    return (
      <Button
        size={size}
        onClick={handleAccept}
        disabled={loading}
        className="swipe-gradient text-white"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Accept Request
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleConnect}
      disabled={loading}
      className={variant === 'default' ? 'swipe-gradient text-white' : ''}
    >
      <UserPlus className="w-4 h-4 mr-2" />
      Connect
    </Button>
  );
}