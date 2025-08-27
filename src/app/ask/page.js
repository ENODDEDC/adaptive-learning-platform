'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

function AskPageClient({ initialQuery }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const initialQuerySent = useRef(false);

  useEffect(() => {
    if (initialQuery && !initialQuerySent.current) {
      handleSend(initialQuery);
      initialQuerySent.current = true;
    }
  }, [initialQuery]);

  const handleSend = async (currentQuery) => {
    if (!currentQuery.trim()) return;

    const userMessage = { text: currentQuery, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentQuery }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = { text: data.response, sender: 'ai' };
      setMessages((prev) => [...prev, aiResponse]);
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
      <div key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
        {paragraph.split('\n').map((line, lIndex) => {
          // Handle numbered lists
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={lIndex} className="mb-2">
                <strong className="text-blue-300">{line.match(/^\d+\./)[0]}</strong>
                <span className="ml-2">{line.replace(/^\d+\.\s/, '')}</span>
              </div>
            );
          }
          
          // Handle bullet points
          if (/^[\-\*\+]\s/.test(line)) {
            return (
              <div key={lIndex} className="mb-1 ml-4">
                <span className="text-blue-300 mr-2">•</span>
                <span>{line.replace(/^[\-\*\+]\s/, '')}</span>
              </div>
            );
          }
          
          // Handle headers (lines ending with colon or starting with uppercase and short)
          if (line.endsWith(':') && line.length < 50) {
            return (
              <div key={lIndex} className="font-semibold text-blue-200 mb-2 mt-3">
                {line}
              </div>
            );
          }
          
          // Regular lines
          return (
            <div key={lIndex} className={lIndex > 0 ? 'mt-1' : ''}>
              {line}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`flex mb-6 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-lg max-w-[80%] ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}>
                {msg.sender === 'ai' ? (
                  <div className="prose max-w-none text-justify">
                    {renderMessage(msg.text)}
                  </div>
                ) : (
                  <div className="text-justify">{msg.text}</div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-gray-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 bg-gray-200 border-t border-gray-300">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center bg-white rounded-lg border border-gray-300 focus-within:border-blue-500 transition-colors">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(query)}
              placeholder="Ask AI anything..."
              className="w-full bg-transparent p-4 focus:outline-none text-gray-800 placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend(query)}
              disabled={isLoading || !query.trim()}
              className="p-4 text-gray-500 hover:text-blue-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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