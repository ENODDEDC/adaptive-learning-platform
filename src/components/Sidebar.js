import React from "react";
import Link from 'next/link';

const Sidebar = ({ pathname, isCollapsed, toggleSidebar }) => {
  const links = [
    { href: "/", label: "Home", icon: <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" /> },
    { href: "/courses", label: "Courses", icon: <><path d="M22 10l-10-5-10 5 10 5 10-5z" /><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /></> },
    { href: "/projects", label: "Projects", icon: <><rect x="4" y="4" width="16" height="18" rx="2" ry="2" /><path d="M9 2h6v4H9z" /><path d="M9 10h6M9 14h4" /></> },
    { href: "/readflow", label: "Readflow", icon: <><path d="M4 19V5a2 2 0 012-2h6v18H6a2 2 0 01-2-2z" /><path d="M20 19V5a2 2 0 00-2-2h-6v18h6a2 2 0 002-2z" /></> },
  ];

  return (
    <aside className={`bg-base-light text-text-primary p-4 border-r border-divider-light fixed top-0 left-0 h-full z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-56'}`}>
      <div className="flex items-center justify-end pt-3 mb-10">
        <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-[#E4E2E7]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <nav>
        <ul>
          {links.map(link => (
            <li key={link.href} className="mb-2">
              <Link
                href={link.href}
                className={`flex items-center py-2.5 rounded-md text-sm hover:bg-[#E4E2E7] hover:text-gray-800 transition-colors duration-200 ease-in-out ${
                  pathname === link.href ? 'bg-[#E4E2E7] font-semibold' : ''
                }`}
              >
                <div className="flex items-center justify-center w-12 flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {link.icon}
                  </svg>
                </div>
                <span
                  className={`whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
                    isCollapsed ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;