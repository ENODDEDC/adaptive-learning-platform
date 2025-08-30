'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

function AskPageClient({ initialQuery }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]); // Add conversation memory
  const [promptCount, setPromptCount] = useState(0); // Track prompts in session
  const [lastSentTime, setLastSentTime] = useState(0); // Track last message time
  const [isOnCooldown, setIsOnCooldown] = useState(false); // Cooldown state
  const [toast, setToast] = useState({ show: false, message: '', type: '' }); // Toast notifications
  const initialQuerySent = useRef(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialQuery && !initialQuerySent.current) {
      // Process initial query without counting against limit
      handleInitialQuery(initialQuery);
      initialQuerySent.current = true;
      
      // Clean up URL after processing initial query
      window.history.replaceState({}, '', '/ask');
    }
  }, [initialQuery]);

  const handleInitialQuery = async (currentQuery) => {
    const userMessage = { text: currentQuery, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    
    const newConversationHistory = [userMessage];
    setConversationHistory(newConversationHistory);
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: currentQuery,
          conversationHistory: newConversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = { text: data.response, sender: 'ai' };
      setMessages((prev) => [...prev, aiResponse]);
      setConversationHistory(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = { text: 'Sorry, I had trouble getting a response. Please try again.', sender: 'ai' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleSend = async (currentQuery) => {
    if (!currentQuery.trim()) return;

    // Check if user has exceeded prompt limit
    if (promptCount >= 20) {
      showToast('You have reached the limit of 20 prompts per session. Please start a new session or upgrade for unlimited prompts.', 'error');
      return;
    }

    // Check cooldown (30 seconds = 30000ms)
    const now = Date.now();
    const timeSinceLastMessage = now - lastSentTime;
    if (lastSentTime > 0 && timeSinceLastMessage < 30000) {
      const remainingTime = Math.ceil((30000 - timeSinceLastMessage) / 1000);
      showToast(`Please wait ${remainingTime} seconds before sending another message.`, 'warning');
      return;
    }

    const userMessage = { text: currentQuery, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    
    // Update conversation history for context
    const newConversationHistory = [...conversationHistory, userMessage];
    setConversationHistory(newConversationHistory);
    
    // Update prompt count and last sent time
    setPromptCount(prev => prev + 1);
    setLastSentTime(now);
    
    // Start cooldown
    setIsOnCooldown(true);
    setTimeout(() => setIsOnCooldown(false), 30000);
    
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
    
    return paragraphs.map((paragraph, pIndex) => {
      // Check if this paragraph is a table
      if (paragraph.includes('|') && paragraph.split('\n').some(line => line.includes('|'))) {
        return renderTable(paragraph, pIndex);
      }
      
      // Check if this paragraph contains definition lists (term: description pattern)
      const lines = paragraph.split('\n');
      const hasDefinitionPattern = lines.some(line => /^[A-Z][^:]*:\s/.test(line.trim()));
      
      if (hasDefinitionPattern) {
        return renderDefinitionList(lines, pIndex);
      }
      
      return (
        <div key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
          {lines.map((line, lIndex) => {
            // Handle different levels of Markdown headers
            if (/^###\s/.test(line)) {
              return (
                <div key={lIndex} className="text-lg font-bold text-gray-900 mb-3 mt-4 border-l-4 border-blue-500 pl-3">
                  {line.replace(/^###\s/, '')}
                </div>
              );
            }
            
            if (/^##\s/.test(line)) {
              return (
                <div key={lIndex} className="text-xl font-bold text-gray-900 mb-3 mt-5 border-b border-gray-300 pb-2">
                  {line.replace(/^##\s/, '')}
                </div>
              );
            }
            
            if (/^#\s/.test(line)) {
              return (
                <div key={lIndex} className="text-2xl font-bold text-gray-900 mb-4 mt-6">
                  {line.replace(/^#\s/, '')}
                </div>
              );
            }
            
            // Handle numbered lists
            if (/^\d+\.\s/.test(line)) {
              return (
                <div key={lIndex} className="mb-2 flex items-start">
                  <span className="font-semibold text-blue-600 mr-2 text-sm min-w-[20px]">{line.match(/^\d+\./)[0]}</span>
                  <span className="text-sm leading-relaxed">{line.replace(/^\d+\.\s/, '')}</span>
                </div>
              );
            }
            
            // Handle bullet points
            if (/^[\-\*\+]\s/.test(line)) {
              return (
                <div key={lIndex} className="mb-2 ml-4 flex items-start">
                  <span className="text-blue-600 mr-2 text-sm font-bold">•</span>
                  <span className="text-sm leading-relaxed">{line.replace(/^[\-\*\+]\s/, '')}</span>
                </div>
              );
            }
            
            // Handle bold text **text**
            if (line.includes('**')) {
              const parts = line.split(/\*\*(.*?)\*\*/g);
              return (
                <div key={lIndex} className={`text-sm leading-relaxed ${lIndex > 0 ? 'mt-2' : ''}`}>
                  {parts.map((part, partIndex) => 
                    partIndex % 2 === 1 ? 
                      <strong key={partIndex} className="font-semibold text-gray-900">{part}</strong> : 
                      part
                  )}
                </div>
              );
            }
            
            // Handle horizontal rules (---)
            if (/^---+$/.test(line.trim())) {
              return (
                <hr key={lIndex} className="my-4 border-gray-300" />
              );
            }
            
            // Handle lines that look like section headers (end with colon)
            if (line.endsWith(':') && line.length < 80 && !line.includes('.')) {
              return (
                <div key={lIndex} className="font-semibold text-gray-900 mb-2 mt-3 text-sm">
                  {line}
                </div>
              );
            }
            
            // Handle empty lines
            if (!line.trim()) {
              return <div key={lIndex} className="h-2"></div>;
            }
            
            // Regular lines
            return (
              <div key={lIndex} className={`text-sm leading-relaxed text-gray-700 ${lIndex > 0 ? 'mt-1' : ''}`}>
                {line}
              </div>
            );
          })}
        </div>
      );
    });
  };

  const renderTable = (tableText, pIndex) => {
    const lines = tableText.split('\n').filter(line => line.trim());
    const tableLines = lines.filter(line => line.includes('|'));
    
    if (tableLines.length === 0) return null;
    
    // Parse table header and rows
    const headerLine = tableLines[0];
    const headers = headerLine.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
    
    const dataLines = tableLines.slice(1).filter(line => !line.includes('---'));
    const rows = dataLines.map(line => 
      line.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0)
    );
    
    return (
      <div key={`table-${pIndex}`} className="my-4 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDefinitionList = (lines, pIndex) => {
    const definitionItems = [];
    let currentItem = null;
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Check if this line starts a new definition (Term: Description pattern)
      if (/^[A-Z][^:]*:\s/.test(trimmedLine)) {
        // Save previous item if exists
        if (currentItem) {
          definitionItems.push(currentItem);
        }
        
        // Start new definition item
        const colonIndex = trimmedLine.indexOf(':');
        const term = trimmedLine.substring(0, colonIndex).trim();
        const description = trimmedLine.substring(colonIndex + 1).trim();
        
        currentItem = {
          term,
          description: [description].filter(Boolean),
          lineIndex
        };
      } else if (currentItem && trimmedLine) {
        // Add continuation of description
        currentItem.description.push(trimmedLine);
      } else if (!trimmedLine && currentItem) {
        // Empty line - finalize current item
        definitionItems.push(currentItem);
        currentItem = null;
      }
    });
    
    // Add the last item if exists
    if (currentItem) {
      definitionItems.push(currentItem);
    }
    
    return (
      <div key={`definition-list-${pIndex}`} className="my-4 space-y-3">
        {definitionItems.map((item, itemIndex) => (
          <div key={itemIndex} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm mb-1">
                  {item.term}
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {item.description.join(' ')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50 p-8 overflow-hidden">
      <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 h-full">
        {/* Header */}
        <div className="bg-white rounded-t-2xl border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
                <p className="text-sm text-gray-500">Ask me anything about your studies</p>
              </div>
            </div>
            
            {/* Session Counter Badge */}
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                promptCount >= 18 ? 'bg-red-100 text-red-700' : 
                promptCount >= 15 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-blue-100 text-blue-700'
              }`}>
                {promptCount}/20 prompts
              </div>
              <button className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full hover:from-purple-700 hover:to-blue-700 transition-colors">
                Upgrade for Unlimited
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 min-h-0 overflow-hidden bg-gray-50">
          <div 
            className="h-full px-6 py-4 overflow-y-auto" 
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to AI Assistant</h3>
                <p className="text-gray-500 max-w-md mx-auto text-center">Start a conversation by asking me anything. I&apos;m here to help with your studies!</p>
              </div>
            )}
            
            {messages.length > 0 && (
              <div className="h-full flex flex-col max-w-6xl mx-auto">
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
              <div className="h-full flex flex-col max-w-6xl mx-auto">
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
        <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0 bg-white rounded-b-2xl relative">
          <div className="max-w-6xl mx-auto">
            {/* Toast Notification */}
            {toast.show && (
              <div className={`absolute bottom-full right-0 mb-2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-10 animate-pulse ${
                toast.type === 'error' ? 'bg-red-500 text-white' :
                toast.type === 'warning' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {toast.message}
                <div className={`absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-transparent ${
                  toast.type === 'error' ? 'border-t-4 border-t-red-500' :
                  toast.type === 'warning' ? 'border-t-4 border-t-yellow-500' :
                  'border-t-4 border-t-blue-500'
                }`}></div>
              </div>
            )}
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
                  disabled={isLoading || !query.trim() || isOnCooldown || promptCount >= 20}
                  className={`p-1 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 ${
                    isLoading || !query.trim() || isOnCooldown || promptCount >= 20
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  title={isOnCooldown ? 'Please wait 30 seconds between messages' : promptCount >= 20 ? 'Prompt limit reached' : ''}
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
            
            {/* Quick suggestions or limit reached message */}
            {promptCount >= 20 ? (
              <div className="flex flex-col items-center gap-3 mt-3">
                <div className="text-center">
                  <p className="text-red-600 font-medium mb-2">Session limit reached (20/20 prompts)</p>
                  <p className="text-gray-600 text-sm mb-3">Start a new session or upgrade for unlimited prompts</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start New Session
                  </button>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors">
                    Upgrade Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => setQuery('Explain a concept')}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                  disabled={isLoading || isOnCooldown}
                >
                  💡 Explain a concept
                </button>
                <button
                  onClick={() => setQuery('Help me with homework')}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                  disabled={isLoading || isOnCooldown}
                >
                  📚 Help me with homework
                </button>
                <button
                  onClick={() => setQuery('Create a study plan')}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                  disabled={isLoading || isOnCooldown}
                >
                  📅 Create a study plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SparklesIcon = (props) => (
  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

// Component that uses useSearchParams - must be inside Suspense
function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');
  
  return <AskPageClient initialQuery={initialQuery} />;
}

export default function AskPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    }>
      <SearchParamsWrapper />
    </Suspense>
  );
}