'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import AttachmentPreview from '@/components/AttachmentPreview';
import RichTextEditor from '@/components/RichTextEditor';

const StreamTab = ({ courseDetails, isInstructor }) => {
  const [streamItems, setStreamItems] = useState([]);
  const [pinnedItems, setPinnedItems] = useState([]);
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState({});
  const [itemComments, setItemComments] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleComments, setVisibleComments] = useState({});

  const fetchComments = useCallback(async (itemId, itemType) => {
    try {
      const token = localStorage.getItem('token');
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
  }, [courseDetails]);

  const fetchStreamItems = useCallback(async () => {
    if (!courseDetails) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      const [announcementsRes, classworkRes] = await Promise.all([
        fetch(`/api/courses/${courseDetails._id}/announcements`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/courses/${courseDetails._id}/classwork`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!announcementsRes.ok) {
        throw new Error(`Error fetching announcements: ${announcementsRes.status} ${announcementsRes.statusText}`);
      }
      if (!classworkRes.ok) {
        throw new Error(`Error fetching classwork: ${classworkRes.status} ${classworkRes.statusText}`);
      }

      const announcementsData = await announcementsRes.json();
      const classworkData = await classworkRes.json();

      const announcements = announcementsData.announcements.map(item => ({ ...item, type: 'announcement' }));
      const classwork = classworkData.classwork.map(item => ({ ...item, type: item.type || 'assignment' }));

      const pinned = announcements.filter(item => item.pinned);
      const unpinned = announcements.filter(item => !item.pinned);

      const combinedItems = [...unpinned, ...classwork];

      if (sortBy === 'newest') {
        combinedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        combinedItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      setPinnedItems(pinned);
      setStreamItems(combinedItems);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch stream items:', err);
    } finally {
      setLoading(false);
    }
  }, [courseDetails, sortBy]);

  useEffect(() => {
    if (courseDetails) {
      fetchStreamItems();
    }
  }, [courseDetails, fetchStreamItems, sortBy]);

  const handlePostAnnouncement = useCallback(async () => {
    if (!newAnnouncementContent.trim() || !courseDetails?._id) {
      setError('Announcement content cannot be empty.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const res = await fetch(`/api/courses/${courseDetails._id}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newAnnouncementContent }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      setNewAnnouncementContent('');
      fetchStreamItems();
    } catch (err) {
      setError(err.message);
      console.error('Failed to post announcement:', err);
    }
  }, [newAnnouncementContent, courseDetails, fetchStreamItems]);

  const handlePostComment = useCallback(async (itemId, itemType) => {
    const content = newCommentContent[itemId]?.trim();
    if (!content || !courseDetails?._id) {
      setError('Comment content cannot be empty.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const res = await fetch(`/api/courses/${courseDetails._id}/${itemType}/${itemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      setNewCommentContent(prev => ({ ...prev, [itemId]: '' }));
      await fetchComments(itemId, itemType);
    } catch (err) {
      setError(err.message);
      console.error('Failed to post comment:', err);
    }
  }, [newCommentContent, courseDetails, fetchComments]);

  const handlePinAnnouncement = async (announcementId, pinned) => {
    try {
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

      fetchStreamItems();
    } catch (err) {
      setError(err.message);
      console.error('Failed to pin announcement:', err);
    }
  };

  const toggleComments = (itemId, itemType) => {
    setVisibleComments(prev => {
      const isVisible = !prev[itemId];
      if (isVisible && !itemComments[itemId]) {
        fetchComments(itemId, itemType);
      }
      return { ...prev, [itemId]: isVisible };
    });
  };

  return (
    <div className="space-y-6">
      {isInstructor && (
        <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Post Announcement</h2>
          <RichTextEditor
            value={newAnnouncementContent}
            onChange={setNewAnnouncementContent}
            placeholder="Write your announcement..."
            className="mb-4"
          />
          <button
            onClick={handlePostAnnouncement}
            className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 mt-4"
          >
            Post Announcement
          </button>
        </div>
      )}

      {pinnedItems.length > 0 && (
        <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Pinned</h2>
          <div className="space-y-6">
            {pinnedItems.map((item) => (
              <div key={item._id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
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
                        <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                          {item.type === 'announcement' ? 'Announcement' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                      </div>
                      {isInstructor && (
                        <button onClick={() => handlePinAnnouncement(item._id, !item.pinned)} className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                          </svg>
                        </button>
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
                          onChange={(e) => setNewCommentContent(prev => ({ ...prev, [item._id]: e.target.value }))}
                        />
                        <button
                          onClick={() => handlePostComment(item._id, item.type === 'announcement' ? 'announcements' : 'classwork')}
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

      <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Stream</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-full ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>All</button>
              <button onClick={() => setFilter('announcement')} className={`px-3 py-1 text-sm rounded-full ${filter === 'announcement' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Announcements</button>
              <button onClick={() => setFilter('assignment')} className={`px-3 py-1 text-sm rounded-full ${filter === 'assignment' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Assignments</button>
            </div>
            <select onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1 text-sm bg-gray-200 border-none rounded-full">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : streamItems.length === 0 ? (
          <p className="text-gray-600">No recent activity.</p>
        ) : (
          <div className="space-y-6">
            {streamItems.filter(item => filter === 'all' || item.type === filter).map((item) => (
              <div key={item._id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
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
                        <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                          {item.type === 'announcement' ? 'Announcement' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                      </div>
                      {isInstructor && item.type === 'announcement' && (
                        <button onClick={() => handlePinAnnouncement(item._id, !item.pinned)} className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                          </svg>
                        </button>
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
                          onChange={(e) => setNewCommentContent(prev => ({ ...prev, [item._id]: e.target.value }))}
                        />
                        <button
                          onClick={() => handlePostComment(item._id, item.type === 'announcement' ? 'announcements' : 'classwork')}
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
        )}
      </div>
    </div>
  );
};

export default StreamTab;