import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-gray-600 shadow-md p-4 flex justify-end items-center">
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold h-10 w-10 flex items-center justify-center rounded-full mr-4 text-lg">
        +
      </button>
      <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
        Profile
      </button>
    </nav>
  );
};

export default Navbar;