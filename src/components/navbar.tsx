import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut, User, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from '../global-context';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, theme, toggleTheme } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* App Name */}
        <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
          <h6 className="font-extrabold text-white">NaWhoKnow 🔥</h6>
        </Link>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-4">
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
          <button
            onClick={toggleTheme}
            className="text-gray-700 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-300 transition"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
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

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden text-gray-700 dark:text-gray-300"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 py-4 px-4 animate-slide-in-top">
          <div className="flex flex-col gap-4">
            <Link
              to="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className={`text-sm font-medium ${
                location.pathname === '/dashboard'
                  ? 'text-blue-400'
                  : 'text-gray-300'
              } hover:text-blue-300`}
            >
              Dashboard
            </Link>
            <button
              onClick={() => {
                toggleTheme();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-yellow-300"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              Toggle Theme
            </button>
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-100">
                  <User size={16} />
                  {user?.username}
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-blue-400"
                >
                  <LogIn size={16} />
                  Sign In
                </Link>
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
