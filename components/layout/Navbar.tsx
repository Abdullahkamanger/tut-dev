'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useBlogs } from '../../context/BlogContext'; // Adjust path based on your final folder structure
import SubscribeModal from '../ui/SubscribeModal';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const { darkMode, toggleDarkMode, user, logout } = useBlogs();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Check if user has already been shown the modal in this session
      const hasShown = sessionStorage.getItem('hasShownSubscribe');
      
      // If mouse is near the top (towards navbar) and hasn't shown yet
      if (e.clientY <= 50 && !hasShown) {
        setIsSubscribeOpen(true);
        sessionStorage.setItem('hasShownSubscribe', 'true');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Tut-Dev
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors font-medium">Home</Link>
              <Link href="/blogs" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors font-medium">Archive</Link>
              <Link href="/library" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors font-medium">
                Library
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:ring-2 ring-indigo-500 transition-all"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {/* Desktop Auth Area */}
              {!user ? (
                <>
                  <Link href="/login" className="hidden md:block text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium transition-colors">Login</Link>
                  <Link href="/register" className="hidden md:block bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95">Join</Link>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-4">
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="text-indigo-600 font-bold border-r border-slate-300 dark:border-slate-600 pr-4">Admin Panel</Link>
                  )}
                  {(user.role === 'AUTHOR' && user.status === 'APPROVED') && (
                    <>
                      <Link href="/author" className="text-indigo-600 font-bold border-r border-slate-300 dark:border-slate-600 pr-4">Dashboard</Link>
                      <Link href="/create" className="text-emerald-600 font-bold border-r border-slate-300 dark:border-slate-600 pr-4">Write Post</Link>
                      <Link href="/profile" className="text-blue-600 font-bold border-r border-slate-300 dark:border-slate-600 pr-4">Profile</Link>
                    </>
                  )}
                  {user.status === 'PENDING' && (
                    <span className="text-amber-500 text-xs font-medium italic">Approval Pending...</span>
                  )}
                  <span className="text-slate-900 dark:text-white font-medium">Hi, {user.name}</span>
                  <button onClick={logout} className="text-red-500 text-sm hover:text-red-700 font-medium transition-colors">Logout</button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden text-slate-600 dark:text-slate-300 hover:text-indigo-600 focus:outline-none"
              >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 flex flex-col space-y-4">
                <Link 
                  href="/" 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium text-lg"
                >
                  Home
                </Link>
                <Link 
                  href="/blogs" 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium text-lg"
                >
                  Archive
                </Link>
                <Link 
                  href="/library" 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium text-lg"
                >
                  Library
                </Link>
                
                {/* Mobile Auth Area */}
                {!user ? (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium text-lg">Login</Link>
                    <Link href="/register" onClick={() => setIsOpen(false)} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold w-full text-center">Join</Link>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {user.role === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setIsOpen(false)} className="text-indigo-600 font-bold">Admin Panel</Link>
                    )}
                    {(user.role === 'AUTHOR' && user.status === 'APPROVED') && (
                      <>
                        <Link href="/author" onClick={() => setIsOpen(false)} className="text-indigo-600 font-bold">Dashboard</Link>
                        <Link href="/create" onClick={() => setIsOpen(false)} className="text-emerald-600 font-bold">Write Post</Link>
                      </>
                    )}
                    {user.status === 'PENDING' && (
                      <span className="text-amber-500 text-xs font-medium italic">Approval Pending...</span>
                    )}
                    <span className="text-slate-900 dark:text-white font-medium">Hi, {user.name}</span>
                    <button onClick={() => { logout(); setIsOpen(false); }} className="text-red-500 text-sm font-medium text-left">Logout</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Global Subscribe Modal */}
      <SubscribeModal 
        isOpen={isSubscribeOpen} 
        onClose={() => setIsSubscribeOpen(false)} 
      />
    </>
  );
};

export default Navbar;