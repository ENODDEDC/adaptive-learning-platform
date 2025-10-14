'use client';

import React from 'react';

const VisualWireframe = ({ wireframeData, contentType }) => {
  if (!wireframeData) return null;

  const { title, description, layout, sections = [], connections = [], style = {} } = wireframeData;

  const getContentTypeStyles = () => {
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

  const styles = getContentTypeStyles();

  const renderLayout = () => {
    if (layout?.type === 'radial' || contentType === 'mindmap') {
      return renderRadialLayout();
    } else if (layout?.type === 'stack' || contentType === 'flowchart') {
      return renderStackLayout();
    } else if (layout?.type === 'flex' || contentType === 'infographic') {
      return renderFlexLayout();
    } else {
      return renderGridLayout();
    }
  };

  const renderRadialLayout = () => {
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
                {title || 'Main Topic'}
              </h3>
              <p className="text-gray-600 text-lg">
                {description || 'Core concepts and relationships'}
              </p>
            </div>
          </div>
        </div>

        {/* Related concepts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
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

  const renderStackLayout = () => {
    // Create a PROFESSIONAL HORIZONTAL timeline with refined animations
    return (
      <div className="w-full">
        {/* Professional Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/60"></div>
        </div>

        {/* Main Timeline Container */}
        <div className="relative z-10 p-8">
          {/* Professional Timeline Line */}
          <div className="absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full shadow-sm"></div>

          {/* Process steps - Clean Horizontal Layout */}
          <div className="grid grid-cols-5 gap-6 items-start justify-items-center pt-24">
            {/* Start step - Professional */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mx-auto border-4 border-white">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-md group-hover:shadow-lg transition-all duration-300">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Initiate</h4>
                <p className="text-sm text-gray-600">Transaction request</p>
              </div>
            </div>

            {/* Process steps - Professional */}
            {sections.map((section, index) => (
              <div key={section.id || index} className="text-center group relative">
                {/* Professional connection arrow */}
                {index < sections.length - 1 && (
                  <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></div>
                    <div className="absolute -right-1 top-0 w-0 h-0 border-t-2 border-b-2 border-l-4 border-t-transparent border-b-transparent border-l-purple-600"></div>
                  </div>
                )}

                <div className="relative mb-6">
                  <div className={`w-18 h-18 ${styles.accentClass} rounded-full flex items-center justify-center shadow-lg mx-auto border-4 border-white`}>
                    <span className="text-lg font-bold text-white">{index + 1}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-md group-hover:shadow-lg transition-all duration-300 max-w-xs">
                  <h4 className={`${styles.titleClass} text-lg font-semibold mb-2`}>
                    {section.title}
                  </h4>
                  <div className="space-y-1">
                    {section.content?.slice(0, 2).map((item, i) => (
                      <div key={i} className="text-sm text-gray-600 leading-relaxed">
                        {item.length > 35 ? `${item.substring(0, 35)}...` : item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Completion step - Professional */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg mx-auto border-4 border-white">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-md group-hover:shadow-lg transition-all duration-300">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Complete</h4>
                <p className="text-sm text-gray-600">Transaction verified</p>
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-6 text-sm bg-white rounded-full px-8 py-4 shadow-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-800">Process Timeline</span>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 ${styles.accentClass} rounded-full opacity-60`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <span className="text-gray-600">Sequential workflow visualization</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFlexLayout = () => {
    // Create a modern dashboard-style infographic
    return (
      <div className="w-full">
        {/* Main Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {sections.slice(0, 4).map((section, index) => {
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
        {sections.length > 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.slice(4).map((section, index) => (
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
                <div className="text-2xl font-bold text-blue-600">{sections.length}</div>
                <div className="text-xs text-gray-500">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {sections.reduce((acc, section) => acc + (section.content?.length || 0), 0)}
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

  const renderGridLayout = () => {
    return (
      <div className="grid grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <div key={section.id || index} className={`${styles.sectionClass} rounded-2xl p-6 group hover:scale-105 transition-all duration-300`}>
            {/* Enhanced header with icon */}
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

            {/* Enhanced title */}
            <h4 className={`${styles.titleClass} text-lg mb-4 group-hover:text-opacity-80 transition-colors duration-300`}>
              {section.title}
            </h4>

            {/* Enhanced content list */}
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
              
              {/* Connection indicator */}
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

  return (
    <div className={`${styles.containerClass} rounded-3xl p-8 border-2 border-white/20 shadow-2xl relative overflow-hidden`}>
      {/* Beautiful background pattern */}
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
            {title || `${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`}
          </h3>
        </div>
        
        {description && (
          <p className="text-gray-600 text-base max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        )}

        {/* Decorative line */}
        <div className="mt-4 flex items-center justify-center">
          <div className={`h-1 w-16 ${styles.accentClass} rounded-full`}></div>
        </div>
      </div>

      {/* Visual Content */}
      <div className="relative z-10">
        {renderLayout()}
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

      {/* Custom styles for better arrows */}
      <style jsx>{`
        @keyframes arrowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .arrow-animation {
          animation: arrowPulse 2s ease-in-out infinite;
        }

        .timeline-arrow {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .step-connector {
          position: relative;
          overflow: visible;
        }

        .step-connector::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -20px;
          transform: translateY(-50%);
          width: 16px;
          height: 2px;
          background: linear-gradient(to right, #f97316, #9333ea);
          border-radius: 1px;
        }

        .step-connector::before {
          content: '';
          position: absolute;
          top: 50%;
          right: -24px;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
          border-left: 6px solid #9333ea;
          animation: arrowPulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default VisualWireframe;
