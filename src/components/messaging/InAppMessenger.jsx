import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Send, Paperclip, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function InAppMessenger({ connectionId, otherUser, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [connectionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.DirectMessage.filter(
        { connection_id: connectionId },
        'created_date'
      );
      setMessages(msgs);
      
      // Mark unread messages as read
      const unreadMessages = msgs.filter(m => 
        m.receiver_id === currentUser.id && !m.is_read
      );
      
      for (const msg of unreadMessages) {
        await base44.entities.DirectMessage.update(msg.id, { is_read: true });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map((r, i) => ({
        url: r.file_url,
        name: files[i].name,
        type: files[i].type
      }));
      
      setAttachments([...attachments, ...fileUrls]);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    setSending(true);
    try {
      let content = newMessage.trim();
      
      // Add attachment references to message
      if (attachments.length > 0) {
        const attachmentText = attachments.map(a => 
          `[File: ${a.name}](${a.url})`
        ).join('\n');
        content = content ? `${content}\n\n${attachmentText}` : attachmentText;
      }

      await base44.entities.DirectMessage.create({
        connection_id: connectionId,
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
        content
      });

      // Create notification
      await base44.entities.Notification.create({
        user_id: otherUser.id,
        type: 'message',
        title: 'New Message',
        message: `${currentUser.full_name} sent you a message`,
        navigate_to: 'DirectMessages'
      });

      setNewMessage('');
      setAttachments([]);
      loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  const isImage = (url) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const renderMessageContent = (content) => {
    // Parse markdown-style links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      
      const url = match[2];
      if (isImage(url)) {
        parts.push({ type: 'image', url, name: match[1] });
      } else {
        parts.push({ type: 'file', url, name: match[1] });
      }
      
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUser.id;
            const parts = renderMessageContent(msg.content);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-2 ${
                    isOwn 
                      ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    {parts.map((part, idx) => {
                      if (part.type === 'text') {
                        return <p key={idx} className="text-sm whitespace-pre-wrap break-words">{part.content}</p>;
                      } else if (part.type === 'image') {
                        return (
                          <a key={idx} href={part.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                            <img src={part.url} alt={part.name} className="rounded-lg max-w-full h-auto" />
                          </a>
                        );
                      } else if (part.type === 'file') {
                        return (
                          <a 
                            key={idx} 
                            href={part.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 mt-2 p-2 rounded-lg ${
                              isOwn ? 'bg-white/20' : 'bg-gray-50'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{part.name}</span>
                          </a>
                        );
                      }
                    })}
                  </div>
                  <span className="text-xs text-gray-400 mt-1">
                    {format(new Date(msg.created_date), 'HH:mm')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                {isImage(file.url) ? (
                  <ImageIcon className="w-4 h-4 text-pink-500" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm text-gray-700">{file.name}</span>
                <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                  <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t">
        <div className="flex items-end gap-2">
          <label className="cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              {uploading ? (
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-12 h-11 rounded-full"
              disabled={sending}
            />
          </div>
          
          <Button
            type="submit"
            disabled={sending || (!newMessage.trim() && attachments.length === 0)}
            className="w-10 h-10 rounded-full swipe-gradient p-0"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}