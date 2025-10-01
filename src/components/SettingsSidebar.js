'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsSidebar = ({ activeSection, onSectionChange, isVisible = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSections, setRecentSections] = useState([]);

  const settingsCategories = [
    {
      id: 'profile',
      title: 'Profile',
      icon: '👤',
      color: '#3B82F6',
      description: 'Personal information and avatar',
      usage: 85,
      category: 'account'
    },
    {
      id: 'security',
      title: 'Security',
      icon: '🔐',
      color: '#EF4444',
      description: 'Password and account protection',
      usage: 60,
      category: 'security'
    },
    {
      id: 'learning',
      title: 'AI Learning',
      icon: '🧠',
      color: '#8B5CF6',
      description: 'Adaptive behavior and preferences',
      usage: 90,
      category: 'ai'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: '📢',
      color: '#F59E0B',
      description: 'Alerts and communication settings',
      usage: 70,
      category: 'communication'
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: '🔒',
      color: '#10B981',
      description: 'Data control and privacy settings',
      usage: 45,
      category: 'privacy'
    },
    {
      id: 'system',
      title: 'System',
      icon: '⚙️',
      color: '#6B7280',
      description: 'Performance and system settings',
      usage: 30,
      category: 'system'
    }
  ];

  // Filter categories based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(settingsCategories);
    } else {
      const filtered = settingsCategories.filter(category =>
        category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, settingsCategories]);

  // Track recently accessed sections
  useEffect(() => {
    if (activeSection && activeSection !== 'search') {
      setRecentSections(prev => {
        const filtered = prev.filter(item => item.id !== activeSection);
        return [{ id: activeSection, timestamp: Date.now() }, ...filtered].slice(0, 3);
      });
    }
  }, [activeSection]);

  const handleSectionClick = (sectionId) => {
    onSectionChange(sectionId);
  };

  const getUsageColor = (usage) => {
    if (usage >= 80) return 'text-green-400';
    if (usage >= 60) return 'text-blue-400';
    if (usage >= 40) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getUsageWidth = (usage) => {
    return `${Math.max(20, usage)}%`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 z-50 overflow-hidden"
        >
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-purple-900/20 to-black/40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_70%)]" />
          </div>

          {/* Header */}
          <div className="relative p-6 border-b border-white/10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
              <p className="text-white/60 text-sm">Manage your preferences and account</p>
            </motion.div>

            {/* Smart Search */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <motion.svg
                    className="w-4 h-4 text-white/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: isSearchFocused ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </motion.svg>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Sections */}
          {recentSections.length > 0 && !searchTerm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative px-6 py-4 border-b border-white/10"
            >
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Recent
              </h3>
              <div className="space-y-2">
                {recentSections.map((section) => {
                  const category = settingsCategories.find(cat => cat.id === section.id);
                  if (!category) return null;

                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                        activeSection === section.id
                          ? 'bg-blue-500/20 border border-blue-400/30'
                          : 'hover:bg-white/10 border border-transparent hover:border-white/20'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-white font-medium text-sm">{category.title}</div>
                        <div className="text-white/50 text-xs">{category.description}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${activeSection === section.id ? 'bg-blue-400' : 'bg-white/30'}`} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Settings Categories */}
          <div className="relative flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {filteredCategories.length > 0 ? (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  {filteredCategories.map((category, index) => (
                    <motion.button
                      key={category.id}
                      onClick={() => handleSectionClick(category.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                        activeSection === category.id
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-lg shadow-blue-500/20'
                          : 'hover:bg-white/10 border border-transparent hover:border-white/20 hover:shadow-lg'
                      }`}
                      style={{
                        background: activeSection === category.id
                          ? `linear-gradient(135deg, ${category.color}15, ${category.color}05)`
                          : undefined
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Hover Effect Background */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${category.color}08, ${category.color}04)`
                        }}
                      />

                      {/* Icon with Pulse Effect */}
                      <div className="relative">
                        <motion.div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl relative z-10"
                          style={{ backgroundColor: `${category.color}20` }}
                          animate={{
                            boxShadow: activeSection === category.id
                              ? `0 0 20px ${category.color}40`
                              : `0 0 10px ${category.color}20`
                          }}
                        >
                          {category.icon}
                        </motion.div>

                        {/* Usage Indicator */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center">
                          <div
                            className={`w-2 h-2 rounded-full ${getUsageColor(category.usage)}`}
                            title={`${category.usage}% usage`}
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-left relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold text-sm">{category.title}</h3>
                          {category.usage >= 80 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-1.5 h-1.5 bg-green-400 rounded-full"
                            />
                          )}
                        </div>
                        <p className="text-white/60 text-xs leading-relaxed">{category.description}</p>

                        {/* Usage Bar */}
                        <div className="mt-2 w-full bg-white/10 rounded-full h-1">
                          <motion.div
                            className="h-1 rounded-full"
                            style={{ backgroundColor: category.color }}
                            initial={{ width: 0 }}
                            animate={{ width: getUsageWidth(category.usage) }}
                            transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                          />
                        </div>
                      </div>

                      {/* Active Indicator */}
                      <motion.div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: category.color }}
                        animate={{
                          opacity: activeSection === category.id ? 1 : 0,
                          scaleY: activeSection === category.id ? 1 : 0.8
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.881-6.123-2.334M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M9 19.128v-.003c0-1.113-.285-2.16-.786-3.07" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">No settings found</h3>
                  <p className="text-white/60 text-sm">Try adjusting your search terms</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="relative p-6 border-t border-white/10"
          >
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">{settingsCategories.length}</div>
                <div className="text-xs text-white/60">Categories</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-400">
                  {settingsCategories.filter(cat => cat.usage >= 70).length}
                </div>
                <div className="text-xs text-white/60">Active</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsSidebar;