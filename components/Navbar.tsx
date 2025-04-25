'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = useState<string>('/');
  const [indicatorPosition, setIndicatorPosition] = useState<number>(0);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Fetch wishlist items count
  const { data: wishlistItems } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await fetch('/api/wishlist');
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }
      return response.json();
    },
    // Non bloccare il rendering se la query fallisce
    staleTime: 60000, // 1 minuto
  });

  // Numero di elementi nella wishlist
  const wishlistCount = wishlistItems?.length || 0;

  // Formatta il conteggio per il badge (99+ se superiore a 99)
  const formattedCount = wishlistCount > 99 ? '99+' : wishlistCount.toString();

  // Calcola la posizione dell'indicatore in base alla rotta attiva
  useEffect(() => {
    // Determina la posizione iniziale senza animazione
    if (isInitialMount) {
      if (pathname.includes('/wishlist')) {
        setActiveRoute('/wishlist');
        setIndicatorPosition(1);
      } else {
        setActiveRoute('/');
        setIndicatorPosition(0);
      }
      // Dopo l'inizializzazione, imposta isInitialMount a false
      setTimeout(() => setIsInitialMount(false), 50);
    } else {
      // Aggiorna normalmente dopo il mount iniziale
      if (pathname.includes('/wishlist')) {
        setActiveRoute('/wishlist');
        setIndicatorPosition(1);
      } else {
        setActiveRoute('/');
        setIndicatorPosition(0);
      }
    }
  }, [pathname, isInitialMount]);

  const navigateTo = (route: string, position: number) => {
    // Se siamo già su questa rotta, non fare nulla
    if (activeRoute === route) return;
    
    setActiveRoute(route);
    setIndicatorPosition(position);
    router.push(route);
  };

  return (
    <nav className="w-20 h-full bg-[#1E2124] flex flex-col items-center pt-4 shadow-lg">
      {/* Logo */}
      <div 
        className="w-12 h-12 mb-10 cursor-pointer"
        onClick={() => navigateTo('/', 0)}
      >
        <Image
          src="/images/logoCardex.svg"
          alt="Cardex Logo"
          width={48}
          height={48}
          style={{ width: '100%', height: 'auto' }}
          className="object-contain"
        />
      </div>
      
      {/* Navigation items container */}
      <div className="relative flex flex-col items-center space-y-3 w-full">
        {/* Active indicator - posizionato a sinistra della navbar con animazione */}
        <div 
          className={`absolute left-0 w-3 h-3 ${isInitialMount ? '' : 'transition-all duration-300'}`}
          style={{ 
            top: `${20 + indicatorPosition * 56}px`, // 56px = dimensione bottone (48px) + spaziatura (8px)
          }}
        >
          <div className="w-0 h-0 
            border-t-[8px] border-t-transparent 
            border-l-[12px] border-l-white 
            border-b-[8px] border-b-transparent">
          </div>
        </div>
        
        {/* Cards list button */}
        <div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-all
            ${activeRoute === '/' ? 'bg-[#36393E]' : 'bg-[#36393E]/70 hover:bg-[#36393E]/90'}`}
          onClick={() => navigateTo('/', 0)}
        >
          <Image
            src="/images/cardlist.svg"
            alt="Card List"
            width={28}
            height={28}
            style={{ width: 'auto', height: 'auto', maxWidth: '28px', maxHeight: '28px' }}
          />
        </div>
        
        {/* Wishlist button con badge counter */}
        <div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-all relative
            ${activeRoute === '/wishlist' ? 'bg-[#36393E]' : 'bg-[#36393E]/70 hover:bg-[#36393E]/90'}`}
          onClick={() => navigateTo('/wishlist', 1)}
        >
          <Image
            src="/images/wishlist.svg"
            alt="Wishlist"
            width={22}
            height={22}
            style={{ width: 'auto', height: 'auto', maxWidth: '22px', maxHeight: '22px' }}
          />
          
          {/* Badge counter - mostra solo se ci sono elementi nella wishlist */}
          {wishlistCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full flex items-center justify-center">
              <span className={`
                ${formattedCount.length > 2 ? 'text-xs px-1' : 'text-xs px-1.5'} 
                py-0.5 min-w-5 h-5 flex items-center justify-center font-medium
              `}>
                {formattedCount}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Logout button - positioned at bottom */}
      <div 
        className="w-12 h-12 bg-[#36393E]/70 hover:bg-[#36393E]/90 rounded-xl flex items-center justify-center cursor-pointer shadow-lg mt-auto mb-6 transition-all"
        onClick={() => {}}
      >
        <Image
          src="/images/logout.svg"
          alt="Logout"
          width={28}
          height={28}
          style={{ width: 'auto', height: 'auto', maxWidth: '28px', maxHeight: '28px' }}
        />
      </div>
    </nav>
  );
};

export default Navbar;