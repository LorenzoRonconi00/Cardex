'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-[#1E2124] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-[#2C2F33] rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Errore di autenticazione</h1>
        
        <div className="bg-red-600/20 border border-red-600 rounded-md p-4 mb-6">
          <p className="text-white">Si è verificato un errore durante l'autenticazione:</p>
          <p className="font-mono text-sm text-red-400 mt-2">{error || 'Errore sconosciuto'}</p>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-300">
            Informazioni di debug che possono aiutare a risolvere il problema:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
            <li>Controlla se le credenziali OAuth sono configurate correttamente</li>
            <li>Verifica che NEXTAUTH_URL sia impostato correttamente nell'env</li>
            <li>Assicurati che gli URI di redirect siano configurati in Google Cloud Console</li>
            <li>Controlla che MongoDB sia accessibile e funzionante</li>
          </ul>
          
          <div className="mt-6">
            <Link href="/auth/signin" className="text-blue-400 hover:underline">
              Torna alla pagina di login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}