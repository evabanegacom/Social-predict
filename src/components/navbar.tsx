import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../global-context';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, theme, toggleTheme } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-white overflow-x-hidden dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* App Name */}
        <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
          Predictly
        </Link>

        {/* Right Side Controls */}
        <div className="flex items-center gap-4">
          {/* <Link
            to="/home"
            className={`text-sm font-medium ${
              location.pathname === '/home'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300'
            } hover:text-blue-500 dark:hover:text-blue-300`}
          >
            Home
          </Link> */}

          <Link
            to="/dashboard"
            className={`text-sm font-medium ${
              location.pathname === '/dashboard'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300'
            } hover:text-blue-500 dark:hover:text-blue-300`}
          >
            Dashboard
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-gray-700 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-300 transition"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Auth Info */}
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-800 dark:text-gray-100">
                <User size={16} />
                {user?.username}
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <LogIn size={16} />
                Sign In
              </Link>
              <Link
                to="/"
                className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
