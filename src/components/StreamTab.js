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
      console.log('🔍 LOCALSTORAGE: Attempting to get token from localStorage');
      console.log('🔍 LOCALSTORAGE: localStorage available:', typeof localStorage !== 'undefined');
      console.log('🔍 LOCALSTORAGE: isClient:', isClient);
      if (!isClient || typeof localStorage === 'undefined') {
        console.log('🔍 LOCALSTORAGE: Skipping localStorage access - not on client');
        return;
      }
      const token = localStorage.getItem('token');
      console.log('🔍 LOCALSTORAGE: Token retrieved:', token ? 'yes' : 'no');
      if (!token) {
        setError('User not authenticated.');
        return;
      }
      const commentsRes = await fetch(`/api/courses/${courseDetails._id}/${itemType === 'announcement' ? 'announcements' : 'classwork'}/${itemId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
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
      if (!isClient || typeof localStorage === 'undefined') {
        console.log('🔍 LOCALSTORAGE: Skipping pin operation - not on client');
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const res = await fetch(`/api/courses/${courseDetails._id}/announcements`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    <div className="space-y-6">
      {isInstructor && (
        <div className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Post Announcement</h2>
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
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 shadow"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              Post
            </button>
          </div>
        </div>
      )}

      {pinnedItems.length > 0 && (
        <div className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Pinned</h2>
          <div className="space-y-6">
            {pinnedItems.map((item) => (
              <div key={item._id} className="p-5 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-start gap-4 mb-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                    <span className="text-sm font-semibold text-white">
                      {item.postedBy?.name ? item.postedBy.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{item.postedBy?.name || 'Unknown User'}</span>
                        {isInstructor && (
                          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Instructor</span>
                        )}
                        <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-full border border-purple-200">
                          {item.type === 'announcement' ? 'Announcement' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                      </div>
                      {isInstructor && (
                        <div className="flex gap-2">
                          <button onClick={() => handlePinAnnouncement(item._id, !item.pinned)} className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100" title="Pin/Unpin">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
                            className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-100"
                            title="Delete announcement"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {(() => {
                        const formattedDate = format(new Date(item.createdAt), 'MMM dd, yyyy');
                        console.log('🔍 DATE_FORMAT: StreamTab pinned item date:', item.title, '->', formattedDate);
                        return formattedDate;
                      })()}
                    </span>
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                <div className="prose" dangerouslySetInnerHTML={{ __html: item.content || item.description }} />
                {item.attachments && item.attachments.length > 0 && (
                  <div className="mt-4 space-y-3">
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

      <div className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Feed</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {['all','announcement','assignment'].map((key) => (
              <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1 text-sm rounded-full border transition-colors ${filter === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                {key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1) + (key==='assignment'?'s':'')}
              </button>
            ))}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1 text-sm border border-gray-200 rounded-full bg-white">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_,i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-xl animate-pulse bg-gray-50">
                <div className="h-4 mb-2 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : propStreamItems.length === 0 ? (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h4 className="mb-2 font-semibold text-gray-900">No recent activity</h4>
            <p className="text-sm leading-relaxed text-gray-500">Announcements and classwork will appear here once posted.</p>
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
                  <div className="py-12 text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h4 className="mb-2 font-semibold text-gray-900">No items match this filter</h4>
                    <p className="text-sm leading-relaxed text-gray-500">Try selecting a different filter to see more items.</p>
                  </div>
                );
              }
              return filteredItems.map((item) => (
              <div key={item._id} className="p-5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4 mb-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                    <span className="text-sm font-semibold text-white">
                      {item.postedBy?.name ? item.postedBy.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{item.postedBy?.name || 'Unknown User'}</span>
                        {isInstructor && (
                          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Instructor</span>
                        )}
                        <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-full border border-purple-200">
                          {item.type === 'announcement' ? 'Announcement' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                      </div>
                      {isInstructor && item.type === 'announcement' && (
                        <div className="flex gap-2">
                          <button onClick={() => handlePinAnnouncement(item._id, !item.pinned)} className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100" title="Pin/Unpin">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
                            className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-100"
                            title="Delete announcement"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                <div className="prose" dangerouslySetInnerHTML={{ __html: item.content || item.description }} />
                {item.attachments && item.attachments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {item.attachments.map((attachment, index) => (
                      <AttachmentPreview key={index} attachment={attachment} />
                    ))}
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
                          className="p-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </button>
                      </div>
                    </>
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