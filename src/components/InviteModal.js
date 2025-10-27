import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  ClipboardDocumentIcon, 
  CheckIcon,
  LinkIcon,
  EnvelopeIcon 
} from '@heroicons/react/24/outline';

const InviteModal = ({ isOpen, onClose, onInvite, role, courseName, courseId }) => {
  const [inviteMode, setInviteMode] = useState('email'); // 'email' or 'link'
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await onInvite(email.trim().toLowerCase(), role);
      setSuccess(result.message);
      setEmail('');
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess('');
    setInvitationLink('');
    setLinkCopied(false);
    setInviteMode('email');
    onClose();
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/courses/${courseId}/generate-invite-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to generate invitation link');
      }

      const data = await res.json();
      setInvitationLink(data.invitationUrl);
      setSuccess('Invitation link generated successfully!');
    } catch (error) {
      setError(error.message || 'Failed to generate invitation link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      setError('Failed to copy link to clipboard');
    }
  };

  const roleDisplay = role === 'student' ? 'Student' : 'Co-teacher';
  const roleDescription = role === 'student'
    ? 'They will be able to view course materials, submit assignments, and participate in class activities.'
    : 'They will have the same permissions as you to manage the course, including adding students and creating assignments.';

  // Only show link option for students
  const showLinkOption = role === 'student';

  if (!isOpen) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative px-4 pt-5 pb-4 overflow-hidden text-left transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="mb-2 text-lg font-semibold leading-6 text-gray-900">
                      Invite {roleDisplay} to {courseName}
                    </Dialog.Title>
                    
                    {/* Mode Selector - Only for students */}
                    {showLinkOption && (
                      <div className="mt-4 mb-6">
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setInviteMode('email')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                              inviteMode === 'email'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <EnvelopeIcon className="w-4 h-4" />
                            Email Invite
                          </button>
                          <button
                            type="button"
                            onClick={() => setInviteMode('link')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                              inviteMode === 'link'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <LinkIcon className="w-4 h-4" />
                            Invite Link
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-2">
                      <p className="mb-4 text-sm text-gray-600">
                        {inviteMode === 'email' 
                          ? `Enter the email address of the person you want to invite as a ${roleDisplay.toLowerCase()}.`
                          : 'Generate a shareable link that students can use to join your course.'
                        }
                      </p>
                      <p className="mb-4 text-xs text-gray-500">
                        {roleDescription}
                      </p>

                      {inviteMode === 'email' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter email address"
                              required
                              disabled={loading}
                            />
                          </div>

                          {error && (
                            <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                              <p className="text-sm text-red-600">{error}</p>
                            </div>
                          )}

                          {success && (
                            <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                              <p className="text-sm text-green-600">{success}</p>
                            </div>
                          )}

                          <div className="flex justify-end gap-3 pt-4">
                            <button
                              type="button"
                              onClick={handleClose}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              disabled={loading}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading || !email.trim()}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? 'Inviting...' : `Invite ${roleDisplay}`}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          {!invitationLink ? (
                            <div className="text-center py-6">
                              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                <LinkIcon className="w-8 h-8 text-blue-600" />
                              </div>
                              <p className="text-sm text-gray-600 mb-4">
                                Click the button below to generate a shareable invitation link for this course.
                              </p>
                              <button
                                onClick={handleGenerateLink}
                                disabled={loading}
                                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading ? 'Generating...' : 'Generate Invitation Link'}
                              </button>
                            </div>
                          ) : (
                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-700">
                                Invitation Link
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={invitationLink}
                                  readOnly
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                                />
                                <button
                                  onClick={handleCopyLink}
                                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
                                >
                                  {linkCopied ? (
                                    <>
                                      <CheckIcon className="w-4 h-4" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <ClipboardDocumentIcon className="w-4 h-4" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="mt-2 text-xs text-gray-500">
                                Share this link with students. They can preview the course and join directly.
                              </p>
                            </div>
                          )}

                          {error && (
                            <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                              <p className="text-sm text-red-600">{error}</p>
                            </div>
                          )}

                          {success && (
                            <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                              <p className="text-sm text-green-600">{success}</p>
                            </div>
                          )}

                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={handleClose}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default InviteModal;