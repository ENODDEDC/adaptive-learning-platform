'use client';
import React, { useState, useRef, useEffect } from 'react';

const Navbar = ({ onCreateCourseClick, onJoinCourseClick }) => {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const optionsRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleOptionsModal = () => {
    setShowOptionsModal(!showOptionsModal);
  };

  const handleClickOutside = (event) => {
    if (
      optionsRef.current &&
      !optionsRef.current.contains(event.target) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target)
    ) {
      setShowOptionsModal(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gray-600 shadow-md p-4 flex justify-between items-center relative">
      <div>{/* Left-aligned content if any */}</div>
      <div className="flex items-center">
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={toggleOptionsModal}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold h-10 w-10 flex items-center justify-center rounded-full mr-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            +
          </button>
          {showOptionsModal && (
            <div
              ref={optionsRef}
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20"
              style={{ top: 'calc(100% + 10px)' }} // Position below the button
            >
              <button
                onClick={() => {
                  onCreateCourseClick();
                  setShowOptionsModal(false);
                }}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Create Course
              </button>
              <button
                onClick={() => {
                  onJoinCourseClick();
                  setShowOptionsModal(false);
                }}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Join Course
              </button>
            </div>
          )}
        </div>
        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50">
          Profile
        </button>
      </div>
    </nav>
  );
};

export default Navbar;