'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import AttachmentPreview from '@/components/AttachmentPreview';
import RichTextEditor from '@/components/RichTextEditor';

const StreamTab = ({ courseDetails, isInstructor, streamItems: propStreamItems, newAnnouncementContent, setNewAnnouncementContent, handlePostAnnouncement, handleDeleteAnnouncement, newCommentContent, setNewCommentContent, handlePostComment, onOpenContent }) => {
  const [pinnedItems, setPinnedItems] = useState([]);
  const [itemComments, setItemComments] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleComments, setVisibleComments] = useState({});
  const [isClient, setIsClient] = useState(false);

  const fetchComments = useCallback(async (itemId, itemType) => {
    try {
      console.log('🔍 COMMENTS: Fetching comments for item:', itemId, 'type:', itemType);
      if (!isClient) {
        console.log('🔍 COMMENTS: Skipping - not on client');
        return;
      }
      
      const commentsRes = await fetch(`/api/courses/${courseDetails._id}/${itemType === 'announcement' ? 'announcements' : 'classwork'}/${itemId}/comments`, {
        credentials: 'include' // Use cookies for authentication
      });
      if (!commentsRes.ok) {
        console.error(`Failed to fetch comments for item ${itemId}:`, commentsRes.statusText);
        return;
      }
      const commentsData = await commentsRes.json();
      setItemComments(prev => ({ ...prev, [itemId]: commentsData.comments }));
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  }, [courseDetails, isClient]);


  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update pinned items and sort items when propStreamItems or sortBy changes
  useEffect(() => {
    if (propStreamItems) {
      const announcements = propStreamItems.filter(item => item.type === 'announcement');
      const pinned = announcements.filter(item => item.pinned);
      setPinnedItems(pinned);
      setLoading(false);
    }
  }, [propStreamItems, sortBy]);



  const handlePinAnnouncement = async (announcementId, pinned) => {
    try {
      if (!isClient) {
        console.log('🔍 PIN: Skipping pin operation - not on client');
        return;
      }

      const res = await fetch(`/api/courses/${courseDetails._id}/announcements`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use cookies for authentication
        body: JSON.stringify({ announcementId, pinned }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      // The parent component will handle refreshing the data
    } catch (err) {
      setError(err.message);
      console.error('Failed to pin announcement:', err);
    }
  };

  const toggleComments = async (itemId, itemType) => {
    setVisibleComments(prev => {
      const isVisible = !prev[itemId];
      if (isVisible && !itemComments[itemId]) {
        // Lazy load comments when first opened
        fetchComments(itemId, itemType);
      }
      return { ...prev, [itemId]: isVisible };
    });
  };

  return (
    <div className="space-y-8">
      {isInstructor && (
        <div className="group p-6 sm:p-8 bg-white border border-gray-200/60 shadow-sm rounded-2xl hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300/60 transition-all duration-300 hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Post Announcement</h2>
              <p className="text-sm text-gray-600">Share important updates with your students</p>
            </div>
          </div>
          <RichTextEditor
            value={newAnnouncementContent}
            onChange={(content) => {
              console.log('🔍 DEBUG: RichTextEditor onChange called');
              console.log('🔍 DEBUG: New content length:', content?.length);
              console.log('🔍 DEBUG: New content preview:', content?.substring(0, 50));
              setNewAnnouncementContent(content);
            }}
            placeholder="Write your announcement..."
            className="mb-4"
          />
          <div className="flex justify-end">
            <button
              onClick={() => {
                console.log('🔍 DEBUG: Post button clicked');
                console.log('🔍 DEBUG: newAnnouncementContent value:', newAnnouncementContent);
                console.log('🔍 DEBUG: newAnnouncementContent length:', newAnnouncementContent?.length);
                handlePostAnnouncement();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              Post
            </button>
          </div>
        </div>
      )}

      {pinnedItems.length > 0 && (
        <div className="p-6 sm:p-8 bg-white border border-gray-200/60 shadow-sm rounded-2xl hover:shadow-lg hover:shadow-gray-500/10 hover:border-gray-300/60 transition-all duration-300 hover:scale-[1.01]">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Pinned Announcements</h2>
          </div>
          <div className="space-y-6">
            {pinnedItems.map((item) => (
              <div key={item._id} className="group p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200/60 rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
                {/* Header Section */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                    <span className="text-sm font-semibold text-white">
                      {item.postedBy?.name ? item.postedBy.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 text-base">{item.postedBy?.name || 'Unknown User'}</span>
                        {isInstructor && (
                          <span className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full border border-emerald-200">Instructor</span>
                        )}
                        <span className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full border border-blue-200">
                          📌 Pinned Announcement
                        </span>
                      </div>
                      {isInstructor && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handlePinAnnouncement(item._id, !item.pinned)}
                            className="p-2 text-gray-600 transition-all duration-200 rounded-lg hover:bg-blue-100 hover:text-blue-600 hover:scale-110"
                            title="Unpin announcement"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              console.log('🔍 WINDOW: Attempting window.confirm for delete');
                              console.log('🔍 WINDOW: Window available:', typeof window !== 'undefined');
                              console.log('🔍 WINDOW: Confirm available:', typeof window?.confirm !== 'undefined');
                              console.log('🔍 WINDOW: isClient:', isClient);
                              if (!isClient || typeof window === 'undefined' || !window.confirm) {
                                console.log('🔍 WINDOW: Cannot show confirm dialog - not on client');
                                return;
                              }
                              if (window.confirm('Are you sure you want to delete this announcement?')) {
                                console.log('🔍 WINDOW: User confirmed deletion');
                                handleDeleteAnnouncement(item._id);
                              } else {
                                console.log('🔍 WINDOW: User cancelled deletion');
                              }
                            }}
                            className="p-2 text-gray-600 transition-all duration-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:scale-110"
                            title="Delete announcement"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{format(new Date(item.createdAt), 'MMM dd, yyyy • h:mm a')}</span>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="mb-4">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900 leading-tight">{item.title}</h3>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content || item.description }} />
                </div>

                {/* Attachments Section */}
                {item.attachments && item.attachments.length > 0 && (
                  <div className="mb-4 p-4 bg-white/60 rounded-lg border border-blue-200/40">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm font-medium text-blue-700">Attachments ({item.attachments.length})</span>
                    </div>
                    <div className="space-y-3">
                      {item.attachments.map((attachment, index) => (
                        <AttachmentPreview
                          key={index}
                          attachment={attachment}
                          onPreview={(att) => {
                            try {
                              console.log('🔍 WINDOW: Dispatching collapseSidebar event for attachment preview');
                              console.log('🔍 WINDOW: Window available:', typeof window !== 'undefined');
                              if (typeof window !== 'undefined') {
                                window.dispatchEvent(new Event('collapseSidebar'));
                                console.log('🔍 WINDOW: Event dispatched successfully');
                              } else {
                                console.log('🔍 WINDOW: Cannot dispatch event - not on client');
                              }
                            } catch (error) {
                              console.log('🔍 WINDOW: Error dispatching event:', error);
                            }
                            if (typeof onOpenContent === 'function') {
                              onOpenContent(att);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4 mt-6 border-t border-gray-200">
                  <button
                    onClick={() => toggleComments(item._id, item.type)}
                    className="mb-3 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    {visibleComments[item._id] ? 'Hide Comments' : 'View Comments'}
                  </button>
                  {visibleComments[item._id] && (
                    <>
                      <h4 className="mb-3 text-lg font-semibold text-gray-900">Comments</h4>
                      <div className="space-y-4">
                        {itemComments[item._id]?.length === 0 ? (
                          <p className="text-sm text-gray-600">No comments yet.</p>
                        ) : (
                          itemComments[item._id]?.map((comment) => (
                            <div key={comment._id} className="flex items-start gap-3">
                              <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full">
                                <span className="text-xs font-semibold text-gray-700">{comment.postedBy?.name ? comment.postedBy.name.charAt(0).toUpperCase() : 'U'}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">{comment.postedBy?.name || 'Unknown User'}</span>
                                  <span className="text-xs text-gray-500">{format(new Date(comment.createdAt), 'MMM dd, yyyy')}</span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <input
                          type="text"
                          placeholder="Add class comment..."
                          className="flex-1 p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newCommentContent[item._id] || ''}
                          onChange={(e) => {
                            console.log('🔍 DEBUG: Comment input changed');
                            console.log('🔍 DEBUG: item._id:', item._id);
                            console.log('🔍 DEBUG: e.target.value:', e.target.value);
                            console.log('🔍 DEBUG: e.target.value.trim():', e.target.value.trim());
                            console.log('🔍 DEBUG: e.target.value.trim().length:', e.target.value.trim().length);
                            setNewCommentContent(prev => {
                              console.log('🔍 DEBUG: setNewCommentContent callback - prev:', prev);
                              const newState = { ...prev, [item._id]: e.target.value };
                              console.log('🔍 DEBUG: setNewCommentContent callback - newState:', newState);
                              return newState;
                            });
                          }}
                        />
                        <button
                          onClick={() => {
                            console.log('🔍 DEBUG: Comment button clicked');
                            console.log('🔍 DEBUG: item._id:', item._id);
                            console.log('🔍 DEBUG: item.type:', item.type);
                            console.log('🔍 DEBUG: newCommentContent[item._id]:', newCommentContent[item._id]);
                            console.log('🔍 DEBUG: newCommentContent[item._id]?.trim():', newCommentContent[item._id]?.trim());
                            console.log('🔍 DEBUG: newCommentContent[item._id]?.trim()?.length:', newCommentContent[item._id]?.trim()?.length);
                            handlePostComment(item._id, item.type === 'announcement' ? 'announcements' : 'classwork');
                          }}
                          className="p-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8 bg-white border border-gray-200/60 shadow-sm rounded-2xl hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300/60 transition-all duration-300 hover:scale-[1.01]">
        <div className="flex flex-col gap-6 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Activity Feed</h2>
            <p className="text-sm text-gray-600">Latest announcements and course updates</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {['all','announcement','assignment'].map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-300 hover:scale-105 active:scale-95 ${
                  filter === key
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg shadow-blue-500/25'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {key === 'all' ? 'All Items' : key.charAt(0).toUpperCase() + key.slice(1) + (key==='assignment'?'s':'')}
              </button>
            ))}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_,i) => (
              <div key={i} className="p-6 border border-gray-200/60 rounded-xl bg-white animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full shadow-sm"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/6"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200/60">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : propStreamItems.length === 0 ? (
          <div className="py-16 text-center animate-fade-in">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110">
              <svg className="w-10 h-10 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h4 className="mb-3 text-lg font-semibold text-gray-900">No activity yet</h4>
            <p className="text-sm leading-relaxed text-gray-600 max-w-md mx-auto">When your instructor posts announcements or assignments, they'll appear here. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(() => {
              // Sort items based on sortBy
              const sortedItems = [...propStreamItems].sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
              });

              const filteredItems = sortedItems.filter(item => filter === 'all' || item.type === filter);
              if (filteredItems.length === 0) {
                return (
                  <div className="py-16 text-center animate-fade-in">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110">
                      <svg className="w-10 h-10 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <h4 className="mb-3 text-lg font-semibold text-gray-900">No items match this filter</h4>
                    <p className="text-sm leading-relaxed text-gray-600 max-w-md mx-auto">Try selecting a different filter or clearing some filters to see more content.</p>
                    <button
                      onClick={() => setFilter('all')}
                      className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      Show All Items
                    </button>
                  </div>
                );
              }
              return filteredItems.map((item) => (
              <div key={item._id} className="group p-6 bg-white border border-gray-200/60 rounded-xl hover:bg-gray-50/50 hover:border-gray-300/60 hover:shadow-md transition-all duration-200">
                {/* Header Section */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                    <span className="text-sm font-semibold text-white">
                      {item.postedBy?.name ? item.postedBy.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 text-base">{item.postedBy?.name || 'Unknown User'}</span>
                        {isInstructor && (
                          <span className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full border border-emerald-200">Instructor</span>
                        )}
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                          item.type === 'announcement'
                            ? 'text-blue-700 bg-blue-50 border-blue-200'
                            : 'text-purple-700 bg-purple-50 border-purple-200'
                        }`}>
                          {item.type === 'announcement' ? '📢 Announcement' : '📋 Assignment'}
                        </span>
                      </div>
                      {isInstructor && item.type === 'announcement' && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handlePinAnnouncement(item._id, !item.pinned)}
                            className="p-2 text-gray-600 transition-all duration-200 rounded-lg hover:bg-blue-100 hover:text-blue-600 hover:scale-110"
                            title="Pin/Unpin"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              console.log('🔍 WINDOW: Attempting window.confirm for delete (feed section)');
                              console.log('🔍 WINDOW: isClient:', isClient);
                              if (!isClient || typeof window === 'undefined' || !window.confirm) {
                                console.log('🔍 WINDOW: Cannot show confirm dialog - not on client');
                                return;
                              }
                              if (window.confirm('Are you sure you want to delete this announcement?')) {
                                handleDeleteAnnouncement(item._id);
                              }
                            }}
                            className="p-2 text-gray-600 transition-all duration-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:scale-110"
                            title="Delete announcement"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{format(new Date(item.createdAt), 'MMM dd, yyyy • h:mm a')}</span>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="mb-4">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900 leading-tight">{item.title}</h3>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content || item.description }} />
                </div>

                {/* Attachments Section */}
                {item.attachments && item.attachments.length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Attachments ({item.attachments.length})</span>
                    </div>
                    <div className="space-y-3">
                      {item.attachments.map((attachment, index) => (
                        <AttachmentPreview key={index} attachment={attachment} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Comments Section */}
                <div className="pt-6 mt-6 border-t border-gray-200/60">
                  <button
                    onClick={() => toggleComments(item._id, item.type)}
                    className="flex items-center gap-2 mb-4 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{visibleComments[item._id] ? 'Hide Comments' : `View Comments (${itemComments[item._id]?.length || 0})`}</span>
                  </button>

                  {visibleComments[item._id] && (
                    <div className="bg-gray-50/50 rounded-lg border border-gray-200/60 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h4 className="text-base font-semibold text-gray-900">Comments ({itemComments[item._id]?.length || 0})</h4>
                      </div>

                      <div className="space-y-3 mb-4">
                        {itemComments[item._id]?.length === 0 ? (
                          <div className="text-center py-6">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-white border border-gray-200 rounded-full">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-600">No comments yet. Be the first to comment!</p>
                          </div>
                        ) : (
                          itemComments[item._id]?.map((comment) => (
                            <div key={comment._id} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow duration-200">
                              <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 border border-blue-200 rounded-full">
                                <span className="text-xs font-semibold text-blue-600">{comment.postedBy?.name ? comment.postedBy.name.charAt(0).toUpperCase() : 'U'}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-semibold text-gray-900">{comment.postedBy?.name || 'Unknown User'}</span>
                                  <span className="text-xs text-gray-500">{format(new Date(comment.createdAt), 'MMM dd, h:mm a')}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment Section */}
                      <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 border border-blue-200 rounded-full">
                          <span className="text-xs font-semibold text-blue-600">Y</span>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors duration-200"
                            value={newCommentContent[item._id] || ''}
                            onChange={(e) => {
                              console.log('🔍 DEBUG: Comment input changed (feed section)');
                              console.log('🔍 DEBUG: item._id:', item._id);
                              console.log('🔍 DEBUG: e.target.value:', e.target.value);
                              console.log('🔍 DEBUG: e.target.value.trim():', e.target.value.trim());
                              console.log('🔍 DEBUG: e.target.value.trim().length:', e.target.value.trim().length);
                              setNewCommentContent(prev => {
                                console.log('🔍 DEBUG: setNewCommentContent callback - prev:', prev);
                                const newState = { ...prev, [item._id]: e.target.value };
                                console.log('🔍 DEBUG: setNewCommentContent callback - newState:', newState);
                                return newState;
                              });
                            }}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => {
                                console.log('🔍 DEBUG: Comment button clicked (feed section)');
                                console.log('🔍 DEBUG: item._id:', item._id);
                                console.log('🔍 DEBUG: item.type:', item.type);
                                console.log('🔍 DEBUG: newCommentContent[item._id]:', newCommentContent[item._id]);
                                console.log('🔍 DEBUG: newCommentContent[item._id]?.trim():', newCommentContent[item._id]?.trim());
                                console.log('🔍 DEBUG: newCommentContent[item._id]?.trim()?.length:', newCommentContent[item._id]?.trim()?.length);
                                handlePostComment(item._id, item.type === 'announcement' ? 'announcements' : 'classwork');
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
                            >
                              Post Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamTab;