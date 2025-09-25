import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function ProfileManagementModal({ open, setOpen, user }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-90"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-90"
            >
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden bg-white/95 backdrop-blur-xl border border-white/20 text-left shadow-2xl transition-all rounded-3xl">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30 animate-pulse"></div>

                {/* Close button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    type="button"
                    className="flex items-center justify-center w-8 h-8 text-gray-500 bg-white/80 backdrop-blur-sm rounded-full hover:text-gray-700 hover:bg-white transition-all duration-200 hover:scale-110"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="relative p-8">
                  {/* Header */}
                  <div className="text-center mb-8 animate-fade-in-up">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                    <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900 mb-2">
                      Profile Management
                    </Dialog.Title>
                    <p className="text-sm text-gray-600">Update your account information</p>
                  </div>

                  {/* Profile Picture Section */}
                  <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center space-x-6 p-6 bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl hover:bg-white/80 transition-all duration-300">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-indigo-200 to-purple-300 flex items-center justify-center text-2xl font-bold text-indigo-800 shadow-lg">
                          {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Profile Picture</h4>
                        <p className="text-sm text-gray-600 mb-3">Upload a new profile picture to personalize your account</p>
                        <button
                          type="button"
                          className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          <PhotoIcon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                          <span>Upload New Photo</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    {/* Full Name */}
                    <div className="group">
                      <label htmlFor="full-name" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="full-name"
                          id="full-name"
                          autoComplete="name"
                          defaultValue={user?.fullName || user?.name || ""}
                          className="block w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all duration-300 hover:border-gray-300"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="group">
                      <label htmlFor="email-address" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email Address
                      </label>
                      <div className="relative">
                        <textarea
                          name="email-address"
                          id="email-address"
                          autoComplete="email"
                          value={user?.email || ""}
                          readOnly
                          rows={2}
                          className="block w-full px-4 py-3 bg-gray-50/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-gray-500 placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-all duration-300 cursor-not-allowed"
                          placeholder="Your email address"
                        />
                        <div className="absolute right-3 top-3 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                          Read-only
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="group">
                      <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Location
                      </label>
                      <div className="relative">
                        <textarea
                          name="location"
                          id="location"
                          autoComplete="address-level2"
                          defaultValue={user?.location || "San Francisco, CA"}
                          rows={2}
                          className="block w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100/50 transition-all duration-300 hover:border-gray-300 resize-none"
                          placeholder="Enter your location"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-105 active:scale-95"
                      onClick={() => setOpen(false)}
                    >
                      <XMarkIcon className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="flex-1 group relative flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
                      onClick={() => setOpen(false)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <svg className="relative w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="relative">Save Changes</span>
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}