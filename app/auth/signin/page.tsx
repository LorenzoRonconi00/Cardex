'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

// Array of Pokémon cards
const cards = [
  { id: 1, image: '/cards/image 21-1.svg', name: 'Blaziken' },
  { id: 2, image: '/cards/image 21-2.svg', name: 'Certifiedge' },
  { id: 3, image: '/cards/image 21-3.svg', name: 'Groudon' },
  { id: 4, image: '/cards/image 21-4.svg', name: 'Braviary' },
  { id: 5, image: '/cards/image 21.svg', name: 'Skitoth' },
];

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [isLoading, setIsLoading] = useState(false);

  // State to control when to start the animation
  const [isAnimating, setIsAnimating] = useState(false);
  // State to track window dimensions for responsive calculations
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Start animation after component is mounted
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 500);

    // Set initial window size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Update window size on resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Function to handle Google sign in with account selection prompt
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn('google', {
      callbackUrl: callbackUrl,
      redirect: true,
      prompt: 'select_account' // Force Google to show account selection screen
    });
  };

  // Function to get error message based on error code
  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'OAuthSignin': "Errore durante l'accesso con Google. Riprova.",
      'OAuthCallback': "Errore durante la callback OAuth. Riprova.",
      'OAuthCreateAccount': "Errore durante la creazione dell'account. Riprova.",
      'EmailCreateAccount': "Errore durante la creazione dell'account email. Riprova.",
      'Callback': "Errore durante la callback. Riprova.",
      'OAuthAccountNotLinked': "Account non collegato. Utilizza lo stesso metodo usato in precedenza.",
      'EmailSignin': "Errore durante l'invio dell'email. Riprova.",
      'CredentialsSignin': "Le credenziali di accesso non sono valide."
    };

    return errorMessages[errorCode] || "Si è verificato un errore durante l'accesso. Riprova.";
  };

  // Function to calculate card dimensions based on screen size
  const getCardDimensions = () => {
    // Base dimensions
    let width = 240;
    let height = 336;

    // Scale up for larger screens
    if (windowSize.width > 1600) {
      width = 300;
      height = 420;
    } else if (windowSize.width > 1200) {
      width = 270;
      height = 378;
    }

    return { width, height };
  };

  // Get dimensions for current screen size
  const cardDimensions = getCardDimensions();

  // Animation variants for text elements
  const textAnimation = {
    hidden: {
      opacity: 0,
      y: -50
    },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.2,
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1.0], // Custom cubic-bezier for a more natural motion
      }
    })
  };

  // Button animation variant
  const buttonAnimation = {
    hidden: {
      opacity: 0,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.8,
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1E2124] flex flex-col relative overflow-hidden">
      {/* Fixed header with centered logo and right-aligned sign in button */}
      <header className="fixed top-0 left-0 w-full py-4 px-6 flex items-center justify-between z-50">
        <div className="w-1/3 flex justify-start">
          {/* Empty div for flex spacing */}
        </div>

        <motion.div
          className="w-1/3 flex justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="w-20 h-20 pt-2">
            <Image
              src="/images/logoCardex.svg"
              alt="Cardex Logo"
              width={48}
              height={48}
              priority
              className="w-full h-full"
            />
          </div>
        </motion.div>

        <div className="w-1/3 flex justify-end">
          <motion.button
            onClick={handleGoogleSignIn}
            className="hidden md:flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-full transition-colors"
            variants={buttonAnimation}
            initial="hidden"
            animate="visible"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className='flex items-center justify-center inset-0'>
                <div className='animate-spin rounded-full h-5 w-5 border-t-2 border-gray-800'></div>
              </div>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                  </g>
                </svg>
                Accedi
              </>
            )}
          </motion.button>
        </div>
      </header>

      {/* Main content - positioned slightly above vertical center */}
      <main className="flex flex-col items-center justify-center px-4 md:pt-24 pb-32 min-h-screen z-20">
        <div className="max-w-3xl w-full flex flex-col items-center">
          {/* Titles - using clamp for more fluid typography with animations */}
          <motion.h1
            className="text-[clamp(1.5rem,3.5vw,6rem)] font-bold text-white text-center whitespace-nowrap"
            custom={0}
            variants={textAnimation}
            initial="hidden"
            animate={isAnimating ? "visible" : "hidden"}
          >
            Colleziona. Ricorda.
          </motion.h1>

          <motion.h2
            className="text-[clamp(1.75rem,4vw,6.25rem)] font-bold text-white text-center mb-4 whitespace-nowrap"
            custom={1}
            variants={textAnimation}
            initial="hidden"
            animate={isAnimating ? "visible" : "hidden"}
          >
            Registra la tua collezione!
          </motion.h2>

          {/* Subtitle - with responsive width and font size */}
          <motion.p
            className="text-[clamp(1rem,2vw,1.125rem)] text-gray-300 text-center w-[clamp(280px,80vw,640px)] mb-8 sm:mb-12 md:mb-16 px-4"
            custom={2}
            variants={textAnimation}
            initial="hidden"
            animate={isAnimating ? "visible" : "hidden"}
          >
            Crea la tua vetrina Pokémon, organizza le carte che possiedi e salva quelle che desideri.
            Tutto in un unico posto.
          </motion.p>

          {/* Error messages if present */}
          {error && (
            <motion.div
              className="mb-8 p-4 bg-red-500 text-white rounded-md w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {getErrorMessage(error)}
            </motion.div>
          )}

          {/* Mobile login button */}
          <motion.div
            className="md:hidden mt-4"
            variants={buttonAnimation}
            initial="hidden"
            animate="visible"
          >
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-full transition-colors"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
              Accedi con Google
            </button>
          </motion.div>
        </div>
      </main>

      {/* Card fan container - positioned at the bottom of the screen */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden z-10">
        <div className="relative mx-auto" style={{
          height: windowSize.height > 900 ? '50vh' : '40vh',
          minHeight: '300px',
          maxHeight: '600px'
        }}>
          {cards.map((card, index) => {
            // Calculate position based on screen width
            const totalCards = cards.length;
            const centerIndex = Math.floor(totalCards / 2);

            // Calculate horizontal spread based on viewport width
            const spreadFactorBase = windowSize.width * 0.08;
            const spreadMultiplier = Math.min(spreadFactorBase, windowSize.width > 1400 ? 130 : 100);

            // Calculate positioning values
            const angleOffset = (index - centerIndex) * 10; // Rotation angle
            const xOffset = (index - centerIndex) * spreadMultiplier; // Horizontal position
            const yOffset = Math.abs(index - centerIndex) * (windowSize.width > 1200 ? 20 : 15); // Vertical offset
            const zIndex = 5 - Math.abs(index - centerIndex); // Z-index to layer cards properly

            // Card base positional multiplier (affects card size relative to screen)
            const cardBaseSize = windowSize.width > 1600 ? 0.95 :
              windowSize.width > 1200 ? 0.9 : 0.85;

            // Card scale relative to center position
            const cardScale = index === centerIndex ?
              cardBaseSize :
              cardBaseSize - (Math.abs(index - centerIndex) * 0.05);

            return (
              <motion.div
                key={card.id}
                className="absolute bottom-0 left-1/2 origin-bottom"
                initial={{
                  x: -cardDimensions.width / 2,
                  y: 150,
                  opacity: 0,
                  scale: 0.6,
                  zIndex: zIndex
                }}
                animate={isAnimating ? {
                  x: xOffset - (cardDimensions.width / 2), // Center point adjustment
                  y: yOffset,
                  opacity: 1,
                  scale: cardScale,
                  zIndex: zIndex
                } : {}}
                transition={{
                  type: "spring",
                  stiffness: 60,
                  damping: 15,
                  delay: 0.1 * Math.abs(index - centerIndex)
                }}
                style={{
                  width: cardDimensions.width,
                  height: cardDimensions.height,
                }}
              >
                {/* Card container with rotation */}
                <motion.div
                  className="w-full h-full rounded-xl overflow-hidden shadow-xl"
                  initial={{ rotate: 0 }}
                  animate={isAnimating ? { rotate: angleOffset } : {}}
                  transition={{
                    type: "spring",
                    stiffness: 70,
                    damping: 15,
                    delay: 0.1 * Math.abs(index - centerIndex) + 0.2
                  }}
                >
                  <Image
                    src={card.image}
                    alt={card.name}
                    width={cardDimensions.width}
                    height={cardDimensions.height}
                    className="w-full h-full object-contain"
                    priority={index === centerIndex}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}