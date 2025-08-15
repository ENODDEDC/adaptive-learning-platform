import React from 'react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <nav>
        <ul>
          <li className="mb-4">
            <a href="#" className="hover:text-gray-300">Home</a>
          </li>
          <li className="mb-4">
            <a href="#" className="hover:text-gray-300">Reading Exercise</a>
          </li>
          <li className="mb-4">
            <a href="#" className="hover:text-gray-300">Activity</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;