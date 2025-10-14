'use client';

import React, { useState } from 'react';
import { 
  XMarkIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import MermaidFlowchart from '../../components/MermaidFlowchart';

const VisualMockupsPage = () => {
  const [activeType, setActiveType] = useState('mindmap');

  const mockupData = {
    mindmap: {
      title: "Crypto & Blockchain Basics",
      description: "A foundational mind map detailing the core concepts of Cryptocurrency and Blockchain Technology",
      sections: [
        {
          id: "key-features",
          title: "Key Features",
          content: ["Decentralization: No control", "Security: Hashing, consensus", "Volatility: Price swings"]
        },
        {
          id: "key-examples", 
          title: "Key Examples",
          content: ["Bitcoin (Digital Gold)", "Ethereum (Smart Contracts)"]
        },
        {
          id: "core-concepts",
          title: "Core Concepts", 
          content: ["Cryptocurrency: Digital money", "Blockchain: Decentralized ledger", "Cryptography: Security layer"]
        },
        {
          id: "structure-basics",
          title: "Structure Basics",
          content: ["Blocks store data", "Chains link blocks"]
        },
        {
          id: "transaction-flow",
          title: "Transaction Flow",
          content: ["Broadcast request", "Miners verify", "Added to block/chain"]
        }
      ]
    },
    flowchart: {
      title: "Data Processing Pipeline",
      description: "Step-by-step workflow for processing and analyzing data",
      sections: [
        {
          id: "data-collection",
          title: "Data Collection",
          content: ["Gather raw data", "Validate inputs", "Store in database"]
        },
        {
          id: "data-cleaning",
          title: "Data Cleaning", 
          content: ["Remove duplicates", "Fix errors", "Handle missing values"]
        },
        {
          id: "data-analysis",
          title: "Data Analysis",
          content: ["Run algorithms", "Generate insights", "Create reports"]
        },
        {
          id: "data-visualization",
          title: "Data Visualization",
          content: ["Create charts", "Build dashboards", "Present findings"]
        }
      ]
    },
    infographic: {
      title: "AI Learning Statistics",
      description: "Key metrics and insights about artificial intelligence adoption in education",
      sections: [
        {
          id: "adoption-rates",
          title: "Adoption Rates",
          content: ["85% of schools use AI", "92% student satisfaction", "78% improved outcomes"]
        },
        {
          id: "learning-methods",
          title: "Learning Methods",
          content: ["Adaptive learning", "Personalized content", "Real-time feedback"]
        },
        {
          id: "benefits",
          title: "Key Benefits",
          content: ["Faster learning", "Better retention", "Cost effective"]
        }
      ]
    },
    diagram: {
      title: "System Architecture",
      description: "Technical overview of the application's core components and data flow",
      sections: [
        {
          id: "frontend",
          title: "Frontend Layer",
          content: ["React components", "User interface", "State management"]
        },
        {
          id: "backend",
          title: "Backend Layer", 
          content: ["API endpoints", "Business logic", "Data processing"]
        },
        {
          id: "database",
          title: "Database Layer",
          content: ["Data storage", "Query optimization", "Backup systems"]
        },
        {
          id: "external-apis",
          title: "External APIs",
          content: ["AI services", "Authentication", "File storage"]
        }
      ]
    }
  };

  const visualTypes = [
    { key: 'diagram', name: 'Concept Diagram', icon: PhotoIcon, description: 'Technical system overview' },
    { key: 'infographic', name: 'Data Visualization', icon: DocumentTextIcon, description: 'Statistical information display' },
    { key: 'mindmap', name: 'Mind Map', icon: PhotoIcon, description: 'Radial concept mapping' },
    { key: 'flowchart', name: 'Process Timeline', icon: DocumentTextIcon, description: 'Sequential process flow' }
  ];

  const getContentTypeStyles = (contentType) => {
    switch (contentType) {
      case 'diagram':
        return {
          containerClass: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
          sectionClass: 'bg-white/90 backdrop-blur-sm border-2 border-blue-300/50 shadow-xl hover:shadow-2xl transition-all duration-300',
          titleClass: 'text-blue-900 font-bold',
          connectionClass: 'border-blue-400/60',
          accentClass: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          iconClass: 'text-blue-600'
        };
      case 'infographic':
        return {
          containerClass: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50',
          sectionClass: 'bg-white/90 backdrop-blur-sm border-2 border-emerald-300/50 shadow-xl hover:shadow-2xl transition-all duration-300',
          titleClass: 'text-emerald-900 font-bold',
          connectionClass: 'border-emerald-400/60',
          accentClass: 'bg-gradient-to-r from-emerald-500 to-teal-600',
          iconClass: 'text-emerald-600'
        };
      case 'mindmap':
        return {
          containerClass: 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50',
          sectionClass: 'bg-white/90 backdrop-blur-sm border-2 border-purple-300/50 shadow-xl hover:shadow-2xl transition-all duration-300',
          titleClass: 'text-purple-900 font-bold',
          connectionClass: 'border-purple-400/60',
          accentClass: 'bg-gradient-to-r from-purple-500 to-pink-600',
          iconClass: 'text-purple-600'
        };
      case 'flowchart':
        return {
          containerClass: 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50',
          sectionClass: 'bg-white/90 backdrop-blur-sm border-2 border-orange-300/50 shadow-xl hover:shadow-2xl transition-all duration-300',
          titleClass: 'text-orange-900 font-bold',
          connectionClass: 'border-orange-400/60',
          accentClass: 'bg-gradient-to-r from-orange-500 to-red-600',
          iconClass: 'text-orange-600'
        };
      default:
        return {
          containerClass: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
          sectionClass: 'bg-white/90 backdrop-blur-sm border-2 border-gray-300/50 shadow-xl hover:shadow-2xl transition-all duration-300',
          titleClass: 'text-gray-900 font-bold',
          connectionClass: 'border-gray-400/60',
          accentClass: 'bg-gradient-to-r from-gray-500 to-slate-600',
          iconClass: 'text-gray-600'
        };
    }
  };

  const renderMindMap = (data, styles) => {
    return (
      <div className="w-full">
        {/* Center concept card */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-4 ${styles.sectionClass} rounded-3xl p-8 max-w-2xl mx-auto group hover:scale-105 transition-all duration-300`}>
            <div className={`w-16 h-16 ${styles.accentClass} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className={`${styles.titleClass} text-2xl font-bold mb-2`}>
                {data.title}
              </h3>
              <p className="text-gray-600 text-lg">
                {data.description || 'Core concepts and relationships'}
              </p>
            </div>
          </div>
        </div>

        {/* Related concepts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.sections.map((section, index) => (
            <div 
              key={section.id || index} 
              className={`${styles.sectionClass} rounded-2xl p-6 group hover:scale-105 hover:shadow-2xl transition-all duration-300`}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${styles.accentClass} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className={`${styles.titleClass} text-lg font-semibold group-hover:text-opacity-80 transition-colors duration-300`}>
                  {section.title}
                </h4>
              </div>

              {/* Section content */}
              <div className="space-y-3">
                {section.content?.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group/item">
                    <div className={`w-2 h-2 ${styles.accentClass} rounded-full mt-2 flex-shrink-0 group-hover/item:scale-125 transition-transform duration-300`}></div>
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300 leading-relaxed text-sm">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Connection indicator */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 ${styles.accentClass} rounded-full`}></div>
                  <span>Related to main concept</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Connection visualization */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 ${styles.accentClass} rounded-full opacity-30`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <span>All concepts are interconnected</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 ${styles.accentClass} rounded-full opacity-30`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFlowchart = (data, styles) => {
    // Create a beautiful process timeline instead of flowchart
    return (
      <div className="w-full">
        {/* Process Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 rounded-full"></div>
          
          {/* Process steps */}
          <div className="space-y-8">
            {/* Start step */}
            <div className="relative flex items-center gap-6">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🚀</span>
                </div>
              </div>
              <div className={`${styles.sectionClass} rounded-2xl p-6 flex-1 group hover:scale-105 transition-all duration-300`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Start: Crypto Idea</h4>
                    <p className="text-gray-600">User initiates a transaction request</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Process steps */}
            {data.sections.map((section, index) => (
              <div key={section.id || index} className="relative flex items-center gap-6">
                <div className="relative z-10">
                  <div className={`w-16 h-16 ${styles.accentClass} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-xl font-bold text-white">{index + 1}</span>
                  </div>
                </div>
                <div className={`${styles.sectionClass} rounded-2xl p-6 flex-1 group hover:scale-105 transition-all duration-300`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${styles.accentClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className={`${styles.titleClass} text-xl font-bold mb-3 group-hover:text-opacity-80 transition-colors duration-300`}>
                        {section.title}
                      </h4>
                      <div className="space-y-2">
                        {section.content?.map((item, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`w-2 h-2 ${styles.accentClass} rounded-full mt-2 flex-shrink-0`}></div>
                            <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300 leading-relaxed">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* End step */}
            <div className="relative flex items-center gap-6">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <div className={`${styles.sectionClass} rounded-2xl p-6 flex-1 group hover:scale-105 transition-all duration-300`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Process Complete</h4>
                    <p className="text-gray-600">Transaction successfully added to blockchain</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Process summary */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 rounded-full px-4 py-2">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 ${styles.accentClass} rounded-full opacity-60`}
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <span>Step-by-step process visualization</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 ${styles.accentClass} rounded-full opacity-60`}
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInfographic = (data, styles) => {
    // Create a modern dashboard-style infographic
    return (
      <div className="w-full">
        {/* Main Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {data.sections.slice(0, 4).map((section, index) => {
            const colors = [
              'from-blue-500 to-blue-600',
              'from-emerald-500 to-emerald-600', 
              'from-purple-500 to-purple-600',
              'from-orange-500 to-orange-600'
            ];
            const bgColors = [
              'bg-blue-50',
              'bg-emerald-50',
              'bg-purple-50', 
              'bg-orange-50'
            ];
            const iconColors = [
              'text-blue-600',
              'text-emerald-600',
              'text-purple-600',
              'text-orange-600'
            ];
            
            return (
              <div key={section.id || index} className={`${bgColors[index]} rounded-2xl p-6 group hover:scale-105 transition-all duration-300 border border-gray-200`}>
                {/* Icon and Title */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${colors[index]} rounded-xl flex items-center justify-center shadow-lg`}>
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className={`w-3 h-3 bg-gradient-to-r ${colors[index]} rounded-full`}></div>
                </div>
                
                {/* Title */}
                <h4 className={`${iconColors[index]} text-lg font-bold mb-2`}>
                  {section.title}
                </h4>
                
                {/* Key Metric */}
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {section.content?.[0] || 'N/A'}
                </div>
                
                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">
                  {section.content?.[1] || 'Key information'}
                </p>
                
                {/* Progress indicator */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${colors[index]} h-2 rounded-full transition-all duration-1000`}
                      style={{ width: `${(index + 1) * 25}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {(index + 1) * 25}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Information Cards */}
        {data.sections.length > 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.sections.slice(4).map((section, index) => (
              <div key={section.id || index + 4} className={`${styles.sectionClass} rounded-2xl p-6 group hover:scale-105 transition-all duration-300`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${styles.accentClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className={`${styles.titleClass} text-lg font-bold mb-3`}>
                      {section.title}
                    </h4>
                    <div className="space-y-2">
                      {section.content?.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-2 h-2 ${styles.accentClass} rounded-full mt-2 flex-shrink-0`}></div>
                          <span className="text-gray-700 text-sm leading-relaxed">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
          <div className="text-center">
            <h4 className="text-lg font-bold text-gray-900 mb-2">Data Summary</h4>
            <p className="text-gray-600 text-sm mb-4">
              Comprehensive overview of key metrics and insights
            </p>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.sections.length}</div>
                <div className="text-xs text-gray-500">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {data.sections.reduce((acc, section) => acc + (section.content?.length || 0), 0)}
                </div>
                <div className="text-xs text-gray-500">Data Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">100%</div>
                <div className="text-xs text-gray-500">Complete</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDiagram = (data, styles) => {
    return (
      <div className="grid grid-cols-2 gap-6">
        {data.sections.map((section, index) => (
          <div key={section.id || index} className={`${styles.sectionClass} rounded-2xl p-6 group hover:scale-105 transition-all duration-300`}>
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 ${styles.accentClass} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Section number badge */}
              <div className={`w-6 h-6 ${styles.accentClass} rounded-full flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform duration-300`}>
                {index + 1}
              </div>
            </div>

            {/* Title */}
            <h4 className={`${styles.titleClass} text-lg mb-4 group-hover:text-opacity-80 transition-colors duration-300`}>
              {section.title}
            </h4>

            {/* Content list */}
            <ul className="space-y-2.5">
              {section.content?.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm group/item">
                  <div className={`w-2 h-2 ${styles.accentClass} rounded-full mt-2 flex-shrink-0 group-hover/item:scale-125 transition-transform duration-300`}></div>
                  <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            {/* Decorative elements */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 ${styles.accentClass} rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-300`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors duration-300">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Connected</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderVisualContent = () => {
    const data = mockupData[activeType];
    const styles = getContentTypeStyles(activeType);

    switch (activeType) {
      case 'mindmap':
        return renderMindMap(data, styles);
      case 'flowchart':
        return renderFlowchart(data, styles);
      case 'infographic':
        return renderInfographic(data, styles);
      case 'diagram':
        return renderDiagram(data, styles);
      default:
        return renderDiagram(data, styles);
    }
  };

  const currentData = mockupData[activeType];
  const styles = getContentTypeStyles(activeType);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Visual Content Mockups</h1>
          <p className="text-lg text-gray-600">Interactive HTML mockups for all visual content types</p>
        </div>

        {/* Visual Type Selector */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2 bg-white rounded-2xl p-2 shadow-lg">
            {visualTypes.map((type) => {
              const Icon = type.icon;
              const isActive = type.key === activeType;
              
              return (
                <button
                  key={type.key}
                  onClick={() => setActiveType(type.key)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{type.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Content Container */}
        <div className={`${styles.containerClass} rounded-3xl p-8 border-2 border-white/20 shadow-2xl relative overflow-hidden`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, ${styles.iconClass.replace('text-', '#')} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${styles.iconClass.replace('text-', '#')} 0%, transparent 50%)`,
            }} />
          </div>

          {/* Enhanced Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${styles.accentClass} rounded-2xl flex items-center justify-center shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold ${styles.titleClass} drop-shadow-sm`}>
                {currentData.title}
              </h3>
            </div>
            
            <p className="text-gray-600 text-base max-w-2xl mx-auto leading-relaxed">
              {currentData.description}
            </p>

            {/* Decorative line */}
            <div className="mt-4 flex items-center justify-center">
              <div className={`h-1 w-16 ${styles.accentClass} rounded-full`}></div>
            </div>
          </div>

          {/* Visual Content */}
          <div className="relative z-10">
            {renderVisualContent()}
          </div>

          {/* Enhanced Legend */}
          <div className="mt-8 pt-6 border-t border-white/20 relative z-10">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-3 bg-white/50 rounded-full px-4 py-2 backdrop-blur-sm">
                <div className={`w-3 h-3 ${styles.accentClass} rounded-full shadow-sm`}></div>
                <span className="font-medium text-gray-700">Main Concepts</span>
              </div>
              <div className="flex items-center gap-3 bg-white/50 rounded-full px-4 py-2 backdrop-blur-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-sm"></div>
                <span className="font-medium text-gray-700">Processes</span>
              </div>
              <div className="flex items-center gap-3 bg-white/50 rounded-full px-4 py-2 backdrop-blur-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-sm"></div>
                <span className="font-medium text-gray-700">Steps</span>
              </div>
            </div>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-2xl"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-2xl"></div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Use These Mockups</h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Interactive Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Click tabs to switch between visual types</li>
                  <li>• Hover over elements to see animations</li>
                  <li>• All layouts are responsive and scalable</li>
                  <li>• Perfect alignment with fixed dimensions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Visual Types:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Mind Map:</strong> Radial concept mapping</li>
                  <li>• <strong>Flowchart:</strong> Sequential process flow</li>
                  <li>• <strong>Infographic:</strong> Statistical information display</li>
                  <li>• <strong>Diagram:</strong> Technical system overview</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualMockupsPage;
