import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Cog6ToothIcon, EnvelopeIcon, CalendarIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import ProfileManagementModal from './ProfileManagementModal';

export default function ProfileModal({ open, setOpen, user }) {
  const [openProfileManagementModal, setOpenProfileManagementModal] = useState(false);

  const handleManageProfileClick = () => {
    setOpen(false); // Close the current ProfileModal
    setOpenProfileManagementModal(true); // Open the ProfileManagementModal
  };

  return (
    <Fragment>
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
            <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-500"
                enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-90"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-300"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-90"
              >
                <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden bg-white/95 backdrop-blur-xl border border-white/20 text-left shadow-2xl transition-all rounded-3xl">
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30 animate-pulse"></div>

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
                    <div className="text-center animate-fade-in-up">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 mb-2">
                        Profile
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">Your account information</p>
                    </div>

                    {/* Profile Content */}
                    <div className="flex flex-col items-center mt-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                      {/* Profile Picture */}
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                        <Image
                          className="relative w-28 h-28 rounded-full border-4 border-white shadow-xl"
                          src={user?.profilePicture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                          alt="Profile Picture"
                          width={112}
                          height={112}
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white animate-pulse"></div>
                      </div>

                      {/* Name */}
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {user?.name && user?.surname ? `${user.name} ${user.surname}` : user?.name || user?.surname || "User Name"}
                      </h2>
                      <p className="text-sm text-gray-500 mb-6">Active Member</p>

                      {/* Info Cards */}
                      <div className="w-full space-y-3">
                        <div className="group flex items-center p-4 space-x-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl hover:bg-white/80 hover:shadow-lg transition-all duration-300 hover:scale-102">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-300">
                            <EnvelopeIcon className="w-5 h-5 text-blue-600" aria-hidden="true" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                            <p className="text-sm font-medium text-gray-900">{user?.email || "user@example.com"}</p>
                          </div>
                        </div>

                        <div className="group flex items-center p-4 space-x-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl hover:bg-white/80 hover:shadow-lg transition-all duration-300 hover:scale-102">
                          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors duration-300">
                            <MapPinIcon className="w-5 h-5 text-green-600" aria-hidden="true" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                            <p className="text-sm font-medium text-gray-900">{user?.location || "San Francisco, CA"}</p>
                          </div>
                        </div>

                        <div className="group flex items-center p-4 space-x-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl hover:bg-white/80 hover:shadow-lg transition-all duration-300 hover:scale-102">
                          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors duration-300">
                            <CalendarIcon className="w-5 h-5 text-purple-600" aria-hidden="true" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Member Since</p>
                            <p className="text-sm font-medium text-gray-900">Joined {user?.joinedDate || "March 2021"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="w-full mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <button
                          type="button"
                          className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
                          onClick={handleManageProfileClick}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Cog6ToothIcon className="relative w-5 h-5 transition-transform duration-300 group-hover:rotate-90" aria-hidden="true" />
                          <span className="relative">Manage Profile</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      <ProfileManagementModal open={openProfileManagementModal} setOpen={setOpenProfileManagementModal} user={user} />
    </Fragment>
  );
}