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
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 text-center">
                        Profile
                      </Dialog.Title>
                      <div className="mt-2 flex flex-col items-center">
                        <Image
                          className="h-24 w-24 rounded-full bg-gray-50"
                          src={user?.profilePicture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                          alt="Profile Picture"
                          width={96}
                          height={96}
                        />
                        <p className="mt-3 text-lg font-semibold text-gray-900">{user?.fullName || "User Name"}</p>

                        <div className="mt-6 w-full space-y-3">
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <EnvelopeIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                            <p className="text-sm text-gray-900">{user?.email || "user@example.com"}</p>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <MapPinIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                            <p className="text-sm text-gray-900">{user?.location || "San Francisco, CA"}</p>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <CalendarIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                            <p className="text-sm text-gray-900">Joined {user?.joinedDate || "March 2021"}</p>
                          </div>
                        </div>

                        <div className="mt-6 w-full">
                          <button
                            type="button"
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            onClick={handleManageProfileClick}
                          >
                            <Cog6ToothIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Manage Profile
                          </button>
                        </div>
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