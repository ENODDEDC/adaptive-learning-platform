'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TextToDocsClient() {
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    if (urlPrompt) {
      setPrompt(urlPrompt);
      // Automatically generate document when coming from home page
      generateDocumentFromPrompt(urlPrompt);
      
      // Clean up URL after processing initial prompt
      window.history.replaceState({}, '', '/text-to-docs');
    }
  }, [searchParams]);

  const generateDocumentFromPrompt = async (promptText) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      
      // Generate and download the Word document
      await downloadWordDocument(data.content, prompt);
      
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const cleanText = (text) => {
    // Remove ALL markdown formatting symbols
    return text
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '') // Remove italic markers
      .replace(/`/g, '') // Remove code markers
      .replace(/~/g, '') // Remove strikethrough markers
      .replace(/#{1,6}\s*/g, '') // Remove heading markers
      .replace(/^\s*[-*+]\s*/gm, '') // Remove bullet point markers
      .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered list markers
      .trim();
  };

  const parseMarkdownToElements = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let currentList = null;
    let listItems = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        // End current list if exists
        if (currentList) {
          elements.push(
            <ul key={`list-${elements.length}`} className="mb-6 ml-8 space-y-2">
              {listItems}
            </ul>
          );
          currentList = null;
          listItems = [];
        }
        continue;
      }

      // Handle headings
      if (trimmed.startsWith('#')) {
        // End current list if exists
        if (currentList) {
          elements.push(
            <ul key={`list-${elements.length}`} className="mb-6 ml-8 space-y-2">
              {listItems}
            </ul>
          );
          currentList = null;
          listItems = [];
        }

        const level = (trimmed.match(/^#+/) || [''])[0].length;
        const text = cleanText(trimmed);
        
        if (level === 1) {
          elements.push(
            <h1 key={`h1-${i}`} className="text-4xl font-bold text-gray-900 mt-12 mb-8 text-center border-b-2 border-gray-400 pb-4">
              {text}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={`h2-${i}`} className="text-2xl font-bold text-gray-900 mt-10 mb-6 border-b border-gray-300 pb-3">
              {text}
            </h2>
          );
        } else {
          elements.push(
            <h3 key={`h3-${i}`} className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              {text}
            </h3>
          );
        }
        continue;
      }

      // Handle bullet points
      if (trimmed.match(/^[-*•]\s+/) || trimmed.startsWith('• ')) {
        const text = cleanText(trimmed);
        listItems.push(
          <li key={`li-${i}`} className="text-lg leading-8 text-gray-800 list-disc">
            {text}
          </li>
        );
        currentList = true;
        continue;
      }

      // Handle numbered lists
      if (trimmed.match(/^\d+\.\s+/)) {
        // End current unordered list if exists
        if (currentList) {
          elements.push(
            <ul key={`list-${elements.length}`} className="mb-6 ml-8 space-y-2">
              {listItems}
            </ul>
          );
          currentList = null;
          listItems = [];
        }

        const number = (trimmed.match(/^\d+/) || ['1'])[0];
        const text = cleanText(trimmed);
        elements.push(
          <div key={`numbered-${i}`} className="mb-4 text-lg leading-8 text-gray-800 ml-4">
            <span className="font-bold text-gray-900 mr-2">{number}.</span>
            {text}
          </div>
        );
        continue;
      }

      // End current list if exists for regular paragraphs
      if (currentList) {
        elements.push(
          <ul key={`list-${elements.length}`} className="mb-6 ml-8 space-y-2">
            {listItems}
          </ul>
        );
        currentList = null;
        listItems = [];
      }

      // Handle regular paragraphs
      if (trimmed) {
        const cleanedText = cleanText(trimmed);
        
        // Check if it's a section header (all caps or ends with colon)
        if (trimmed.match(/^[A-Z\s]+:?\s*$/) && trimmed.length < 100) {
          elements.push(
            <h3 key={`section-${i}`} className="text-xl font-bold text-gray-900 mt-8 mb-4 uppercase tracking-wide">
              {cleanedText.replace(/:$/, '')}
            </h3>
          );
        } else {
          // Regular paragraph
          elements.push(
            <p key={`p-${i}`} className="mb-6 text-lg leading-8 text-gray-800 text-justify indent-8">
              {cleanedText}
            </p>
          );
        }
      }
    }

    // Add any remaining list items
    if (currentList && listItems.length > 0) {
      elements.push(
        <ul key={`list-final`} className="mb-6 ml-8 space-y-2">
          {listItems}
        </ul>
      );
    }

    return elements;
  };

  const calculatePageCount = (content) => {
    // Estimate page count based on content length and formatting
    const words = content.split(' ').length;
    const lines = content.split('\n').length;
    
    // Average words per page in a standard document (Times New Roman, 12pt, 1" margins)
    // Accounting for headings, spacing, and formatting
    const wordsPerPage = 250;
    
    // Calculate based on words, but adjust for formatting elements
    const headingCount = (content.match(/^#+\s/gm) || []).length;
    const listItems = (content.match(/^[-*•]\s/gm) || []).length;
    const emptyLines = (content.match(/^\s*$/gm) || []).length;
    
    // Add extra space for headings and formatting
    const formattingAdjustment = (headingCount * 2) + (listItems * 0.5) + (emptyLines * 0.3);
    const adjustedWords = words + formattingAdjustment * 10;
    
    const estimatedPages = Math.max(1, Math.ceil(adjustedWords / wordsPerPage));
    return estimatedPages;
  };

  const downloadWordDocument = async (content, title) => {
    try {
      const response = await fetch('/api/create-word-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, title }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Word document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${title.substring(0, 50).replace(/[^a-z0-9]/gi, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const splitContentIntoPages = (content) => {
    // Simple approach: split content by paragraphs and distribute evenly
    const allElements = parseMarkdownToElements(content);
    const pages = [];
    const elementsPerPage = Math.max(8, Math.ceil(allElements.length / Math.max(1, calculatePageCount(content))));
    
    for (let i = 0; i < allElements.length; i += elementsPerPage) {
      const pageElements = allElements.slice(i, i + elementsPerPage);
      if (pageElements.length > 0) {
        pages.push(pageElements);
      }
    }
    
    return pages.length > 0 ? pages : [allElements];
  };

  // Show loading state
  if (isGenerating) {
    return (
      <div className="h-full bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Generating Document...</h2>
          <p className="text-gray-600">Please wait while AI creates your document</p>
        </div>
      </div>
    );
  }

  // Show document view when content is generated
  if (generatedContent) {
    const pages = splitContentIntoPages(generatedContent);
    
    return (
      <div className="h-full bg-gray-300 overflow-y-auto" style={{ margin: 0, padding: 0 }}>

        {/* Multiple Pages Layout */}
        <div className="max-w-4xl mx-auto space-y-8 pt-16">
          {pages.map((pageContent, pageIndex) => (
            <div key={pageIndex} className="relative">
              {/* Page Container */}
              <div
                className="bg-white shadow-2xl border border-gray-300 mx-auto overflow-hidden"
                style={{
                  fontFamily: 'Times New Roman, serif',
                  width: '800px',  // Slightly smaller for better display
                  minHeight: '1000px', // Adjusted height
                  maxWidth: '800px'
                }}
              >
                {/* Document Header - Only on first page */}
                {pageIndex === 0 && (
                  <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-gray-700">Document.docx</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                          {new Date().toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => downloadWordDocument(generatedContent, prompt)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Page Content */}
                <div className="px-16 py-12 min-h-full">
                  <div className="text-gray-900 leading-relaxed">
                    {pageContent}
                  </div>
                </div>
                
                {/* Page Number Footer */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <div className="text-sm text-gray-500">
                    Page {pageIndex + 1}
                  </div>
                </div>
              </div>
              

            </div>
          ))}
          
          {/* Document Summary Footer */}
          <div className="text-center py-8">
            <div className="text-sm text-gray-600">
              Generated by AI • {generatedContent.split(' ').length} words • {pages.length} pages
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show form when no content is generated (fallback)
  return (
    <div className="h-full bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Text to Docs</h1>
          <p className="text-gray-600 mb-8">
            Enter a prompt and AI will generate a comprehensive Word document for you.
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Document Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here... (e.g., 'Create a business plan for a coffee shop', 'Write a research paper on renewable energy', etc.)"
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isGenerating}
              />
            </div>

            <button
              onClick={handleGenerateDocument}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Document...
                </div>
              ) : (
                'Generate Word Document'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}