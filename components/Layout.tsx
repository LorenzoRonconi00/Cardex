'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Navbar from './Navbar';
import TopHeader from './TopHeader';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface LayoutProps {
  children: ReactNode;
  onSearch?: (searchTerm: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onSearch }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Set isClient to true once the component mounts on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isClient && status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [isClient, status, router]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Initial loading state before client-side rendering or during authentication check
  if (!isClient || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E2124]">
        <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated, don't render the layout (will be redirected by useEffect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="flex h-screen">
      {/* Left sidebar navigation - fixed on desktop, hidden on mobile unless menu is open */}
      <div 
        className={`${
          isMobileMenuOpen ? 'fixed inset-0 bg-black/80 z-50 transition-opacity duration-300 ease-in-out opacity-100' : 'fixed inset-0 bg-black bg-opacity-0 z-50 pointer-events-none transition-opacity duration-300 ease-in-out opacity-0'
        } md:bg-transparent md:block md:static md:inset-auto md:pointer-events-auto md:opacity-100`}
        onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
      >
        <div 
          className={`${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed h-full z-40 transition-transform duration-300 ease-in-out`}
          onClick={(e) => e.stopPropagation()}
        >
          <Navbar />
        </div>
      </div>
      
      {/* Main content area with responsive padding */}
      <div className="flex flex-col w-full md:ml-20">
        {/* Top header with mobile menu button and responsive positioning */}
        <div className="fixed top-0 right-0 left-0 md:left-20 z-20">
          <div className="md:hidden absolute left-0 top-1/2 transform -translate-y-1/2 z-30">
            <button
              onClick={toggleMobileMenu}
              className="p-2 px-4 text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          <TopHeader session={session} onSearch={onSearch} />
        </div>
        
        {/* Page content with responsive padding */}
        <main className="flex-1 bg-[#282B30] overflow-y-auto pt-12 md:pt-14 mt-16 md:mt-18 px-2 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;