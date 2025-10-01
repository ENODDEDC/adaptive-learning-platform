import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export default function CourseBrowserModal({ open, setOpen, courses, type, onNavigate, navigatingTo }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredCourses = (courses || []).filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'progress') return b.progress - a.progress;
    return 0;
  });

  const getTypeColor = (type) => {
    return type === 'created' ? 'blue' : 'purple';
  };

  const color = getTypeColor(type);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden bg-white rounded-2xl text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center`}>
                        <BookOpenIcon className={`w-5 h-5 text-${color}-600`} />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                          {type === 'created' ? 'My Created Courses' : 'My Enrolled Courses'}
                        </Dialog.Title>
                        <p className="text-sm text-gray-600">
                          {(courses || []).length} courses • Browse and manage your courses
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Search and Filter */}
                  <div className="mt-4 flex gap-3">
                    <div className="flex-1 relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="progress">Sort by Progress</option>
                    </select>
                  </div>
                </div>

                {/* Course Grid */}
                <div className="p-6">
                  {filteredCourses?.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No courses found</p>
                      {searchTerm && (
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCourses.map((course) => (
                        <button
                          key={course.id}
                          onClick={() => {
                            onNavigate(`/courses/${course.id}`, `Course: ${course.title}`);
                            setOpen(false);
                          }}
                          disabled={navigatingTo === `Course: ${course.title}`}
                          className="group p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-3 h-3 bg-${color}-400 rounded-full group-hover:scale-125 transition-transform`}></div>
                            {navigatingTo === `Course: ${course.title}` && (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>

                          <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                            {navigatingTo === `Course: ${course.title}` ? 'Loading...' : course.title}
                          </h4>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium text-gray-700">{course.progress}%</span>
                          </div>

                          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${type === 'created' ? 'from-blue-400 to-blue-600' : 'from-purple-400 to-purple-600'} transition-all duration-500`}
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing {filteredCourses.length} of {(courses || []).length} courses
                  </p>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}