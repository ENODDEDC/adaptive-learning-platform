'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

function AskPageClient({ initialQuery }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]); // Add conversation memory
  const initialQuerySent = useRef(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialQuery && !initialQuerySent.current) {
      handleSend(initialQuery);
      initialQuerySent.current = true;
      
      // Clean up URL after processing initial query
      window.history.replaceState({}, '', '/ask');
    }
  }, [initialQuery]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (currentQuery) => {
    if (!currentQuery.trim()) return;

    const userMessage = { text: currentQuery, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    
    // Update conversation history for context
    const newConversationHistory = [...conversationHistory, userMessage];
    setConversationHistory(newConversationHistory);
    
    setQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: currentQuery,
          conversationHistory: newConversationHistory.slice(-6) // Send last 6 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = { text: data.response, sender: 'ai' };
      setMessages((prev) => [...prev, aiResponse]);
      
      // Add AI response to conversation history
      setConversationHistory(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = { text: 'Sorry, I had trouble getting a response. Please try again.', sender: 'ai' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (text) => {
    if (!text) return null;

    // Split by double line breaks for paragraphs, then by single line breaks
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
    
    return paragraphs.map((paragraph, pIndex) => (
      <div key={pIndex} className={pIndex > 0 ? 'mt-2' : ''}>
        {paragraph.split('\n').map((line, lIndex) => {
          // Handle Markdown headers (## text)
          if (/^##\s/.test(line)) {
            return (
              <div key={lIndex} className="text-base font-bold text-gray-900 mb-2 mt-3">
                {line.replace(/^##\s/, '')}
              </div>
            );
          }
          
          // Handle numbered lists
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={lIndex} className="mb-1 flex items-start">
                <span className="font-semibold text-purple-600 mr-1 text-sm">{line.match(/^\d+\./)[0]}</span>
                <span className="text-sm leading-tight">{line.replace(/^\d+\.\s/, '')}</span>
              </div>
            );
          }
          
          // Handle bullet points
          if (/^[\-\*\+]\s/.test(line)) {
            return (
              <div key={lIndex} className="mb-1 ml-2 flex items-start">
                <span className="text-purple-600 mr-1 text-sm font-bold">•</span>
                <span className="text-sm leading-tight">{line.replace(/^[\-\*\+]\s/, '')}</span>
              </div>
            );
          }
          
          // Handle headers (lines ending with colon or starting with uppercase and short)
          if (line.endsWith(':') && line.length < 50) {
            return (
              <div key={lIndex} className="font-semibold text-gray-900 mb-1 mt-2 text-sm">
                {line}
              </div>
            );
          }
          
          // Regular lines
          return (
            <div key={lIndex} className={`text-sm leading-tight ${lIndex > 0 ? 'mt-0.5' : ''}`}>
              {line}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="p-4">
      <div className="flex flex-col bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg shadow-lg overflow-hidden" style={{height: 'calc(100vh - 96px)'}}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm px-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto py-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                <SparklesIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Intelevo AI</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div 
            className="h-full px-6 overflow-y-auto" 
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#D1D5DB #F3F4F6'
            }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Intelevo AI</h3>
                <p className="text-gray-500 max-w-md mx-auto text-center">Start a conversation by asking me anything. I'm here to help!</p>
              </div>
            )}
            
            {messages.length > 0 && (
              <div className="h-full flex flex-col max-w-4xl mx-auto">
                <div className="flex-1 space-y-3 py-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`flex-shrink-0 ${msg.sender === 'user' ? 'ml-3' : 'mr-3'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            msg.sender === 'user'
                              ? 'bg-blue-500'
                              : 'bg-gradient-to-r from-purple-500 to-pink-500'
                          }`}>
                            {msg.sender === 'user' ? (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`relative px-3 py-2 rounded-xl shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                        }`}>
                          {msg.sender === 'ai' ? (
                            <div className="prose max-w-none text-sm">
                              {renderMessage(msg.text)}
                            </div>
                          ) : (
                            <div className="font-medium text-sm">{msg.text}</div>
                          )}
                          
                          {/* Message timestamp */}
                          <div className={`text-xs mt-1 opacity-60 ${
                            msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                          }`}>
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl rounded-bl-md px-3 py-2 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-gray-600 text-sm font-medium">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Auto-scroll target */}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {!messages.length && isLoading && (
              <div className="h-full flex flex-col max-w-4xl mx-auto">
                <div className="flex-1 space-y-3 py-4">
                  <div className="flex justify-start">
                    <div className="flex">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl rounded-bl-md px-3 py-2 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-gray-600 text-sm font-medium">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Input Area at Bottom */}
        <div className="border-t border-gray-200/50 px-6 py-4 flex-shrink-0 bg-transparent backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all duration-200">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(query)}
                placeholder="Type your message here..."
                className="w-full bg-transparent px-4 py-3 focus:outline-none text-gray-800 placeholder-gray-500 text-sm"
                disabled={isLoading}
              />
              <div className="flex items-center space-x-1 px-2">
                {/* Attachment button (optional) */}
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                
                {/* Send button */}
                <button
                  onClick={() => handleSend(query)}
                  disabled={isLoading || !query.trim()}
                  className="p-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setQuery('Explain a concept')}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                disabled={isLoading}
              >
                💡 Explain a concept
              </button>
              <button
                onClick={() => setQuery('Help me with homework')}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                disabled={isLoading}
              >
                📚 Help me with homework
              </button>
              <button
                onClick={() => setQuery('Create a study plan')}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                disabled={isLoading}
              >
                📅 Create a study plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SparklesIcon = (props) => (
  <img 
    src="/platform_icon.png" 
    alt="Intelevo AI" 
    className="w-8 h-8 object-cover rounded-full"
    {...props}
  />
);

export default function AskPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    }>
      <AskPageClient initialQuery={initialQuery} />
    </Suspense>
  );
}