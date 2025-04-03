// app/auth/signin/page.tsx
'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);
  
  // Funzione per gestire il login forzando la selezione dell'account
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn('google', { 
      callbackUrl: callbackUrl,
      redirect: true,
      // Questo parametro forza Google a mostrare la schermata di selezione account
      prompt: 'select_account'
    });
  };

  return (
    <div className="min-h-screen bg-[#1E2124] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-[#2C2F33] rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-8">
          <h1 className="text-3xl font-bold text-white">CARDEX</h1>
        </div>
        
        <h2 className="text-xl text-center text-white mb-6">
          Accedi al tuo account
        </h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-500 text-white rounded-md">
            {error === 'OAuthSignin' && "Errore durante l'accesso con Google. Riprova."}
            {error === 'OAuthCallback' && "Errore durante la callback OAuth. Riprova."}
            {error === 'OAuthCreateAccount' && "Errore durante la creazione dell'account. Riprova."}
            {error === 'EmailCreateAccount' && "Errore durante la creazione dell'account email. Riprova."}
            {error === 'Callback' && "Errore durante la callback. Riprova."}
            {error === 'OAuthAccountNotLinked' && "Account non collegato. Utilizza lo stesso metodo usato in precedenza."}
            {error === 'EmailSignin' && "Errore durante l'invio dell'email. Riprova."}
            {error === 'CredentialsSignin' && "Le credenziali di accesso non sono valide."}
            {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin'].includes(error) && 
              "Si è verificato un errore durante l'accesso. Riprova."}
          </div>
        )}
        
        {/* Pulsante di accesso con Google con stato di caricamento */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 ${
            isLoading ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-100 cursor-pointer'
          } text-gray-800 font-semibold py-3 px-4 rounded-md mb-4 transition-colors`}
        >
          {isLoading ? (
            <div className="w-6 h-6 animate-spin rounded-full border-4 border-gray-400 border-t-blue-500"></div>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              Accedi con Google
            </>
          )}
        </button>

        <p className="text-center text-gray-400 text-sm">
          Accedi per gestire la tua collezione di carte Pokémon
        </p>
      </div>
    </div>
  );
}