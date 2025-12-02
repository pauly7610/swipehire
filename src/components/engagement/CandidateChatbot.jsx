import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  MessageCircle, Send, X, Bot, User, Loader2, 
  Sparkles, Building2, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_QUESTIONS = [
  "What's the interview process?",
  "What benefits do you offer?",
  "What's the company culture like?",
  "Is remote work available?"
];

export default function CandidateChatbot({ company, job }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      setMessages([{
        role: 'assistant',
        content: `Hi! 👋 I'm ${company?.name || 'the company'}'s AI assistant. I can answer questions about our culture, benefits, interview process, and more. How can I help you today?`
      }]);
    }
  }, [isOpen, company]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful AI assistant for ${company?.name || 'a company'}. Answer the candidate's question based on the company information below.

Company Info:
- Name: ${company?.name || 'Company'}
- Industry: ${company?.industry || 'Technology'}
- Size: ${company?.size || 'Growing team'}
- Location: ${company?.location || 'Multiple locations'}
- Culture: ${company?.culture_traits?.join(', ') || 'Innovative, collaborative'}
- Benefits: ${company?.benefits?.join(', ') || 'Competitive benefits package'}
- Description: ${company?.description || 'A great place to work'}

${job ? `Current Job Opening:
- Title: ${job.title}
- Type: ${job.job_type}
- Location: ${job.location}
- Requirements: ${job.requirements?.slice(0, 3).join(', ') || 'See job description'}` : ''}

Candidate Question: ${text}

Provide a helpful, friendly, and concise answer. If you don't have specific information, give a general helpful response and suggest they reach out to the recruiter for details. Keep response under 150 words.`,
        response_json_schema: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
            follow_up_suggestion: { type: 'string' }
          }
        }
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        followUp: response.follow_up_suggestion
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I couldn't process that. Please try again or reach out to our team directly."
      }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 rounded-full shadow-lg z-50 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-[calc(100%-2rem)] md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}>
              <div className="flex items-center gap-3">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover bg-white" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white">{company?.name || 'Company'} Assistant</h3>
                  <p className="text-xs text-white/80">Ask me anything!</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                    <div className={`rounded-2xl px-4 py-2 ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    {msg.followUp && (
                      <p className="text-xs text-gray-400 mt-1 px-2">{msg.followUp}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Quick questions
                </p>
                <div className="flex flex-wrap gap-1">
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-100">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1"
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={loading || !input.trim()}
                  style={{ background: 'linear-gradient(135deg, #FF005C 0%, #FF7B00 100%)' }}
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}