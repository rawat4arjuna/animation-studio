
import React from 'react';

// SVG Icon for Search
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
  </svg>
);

export default function TopBar() {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center">
        <div className="relative">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-64 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center">
        {/* User menu placeholder */}
        <div className="w-9 h-9 bg-gray-300 rounded-full dark:bg-gray-600"></div>
      </div>
    </header>
  );
}
