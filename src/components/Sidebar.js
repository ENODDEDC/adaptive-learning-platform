import React from "react";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-base-light text-text-primary p-4 border-r border-divider-light">
      <nav className="pt-4">
        <ul>
          {/* Home */}
          <li className="mb-2">
            <a
              href="#"
              className="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 ease-in-out"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" />
              </svg>
              Home
            </a>
          </li>

          {/* My Courses (Graduation Cap) */}
          <li className="mb-2">
            <a
              href="#"
              className="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 ease-in-out"
            >
              <svg
                className="h-5 w-5 mr-6" 
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10l-10-5-10 5 10 5 10-5z" />
                <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
              </svg>
              Courses
            </a>
          </li>

          {/* My Projects (Clipboard) */}
          <li className="mb-2">
            <a
              href="#"
              className="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 ease-in-out"
            >
              <svg
                className="h-5 w-5 mr-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="4" width="16" height="18" rx="2" ry="2" />
                <path d="M9 2h6v4H9z" />
                <path d="M9 10h6M9 14h4" />
              </svg>
              Projects
            </a>
          </li>

          {/* Readflow (Open Book) */}
          <li className="mb-2">
            <a
              href="#"
              className="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 ease-in-out"
            >
              <svg
                className="h-5 w-5 mr-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* left page */}
                <path d="M4 19V5a2 2 0 012-2h6v18H6a2 2 0 01-2-2z" />
                {/* right page */}
                <path d="M20 19V5a2 2 0 00-2-2h-6v18h6a2 2 0 002-2z" />
              </svg>
              Readflow
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;