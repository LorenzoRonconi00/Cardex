// app/cardtrader-debug/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function CardTraderDebug() {
  const [expansions, setExpansions] = useState<any[]>([]);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExpansions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/cardtrader/find-expansions');
        
        if (!response.ok) {
          throw new Error(`Errore HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        setExpansions(data.allPokemonExpansions || []);
        setMatchResults(data.matchResults || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Si è verificato un errore');
        console.error('Errore nel recupero delle espansioni:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpansions();
  }, []);

  // Filtra le espansioni in base al termine di ricerca
  const filteredExpansions = expansions.filter(exp => 
    exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug CardTrader Expansions</h1>
      
      {isLoading && <p>Caricamento delle espansioni...</p>}
      {error && <p className="text-red-500">Errore: {error}</p>}
      
      {!isLoading && !error && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Possibili corrispondenze con le nostre espansioni</h2>
            
            {matchResults.map((match, idx) => (
              <div key={idx} className="mb-4 p-4 border rounded">
                <h3 className="font-medium">Nostra espansione: {match.ourExpansion}</h3>
                
                {match.possibleMatches.length === 0 ? (
                  <p className="text-red-500 mt-2">Nessuna corrispondenza trovata</p>
                ) : (
                  <div className="mt-2">
                    <p className="font-medium">Possibili corrispondenze:</p>
                    <ul className="list-disc pl-5 mt-1">
                      {match.possibleMatches.map((m: any, midx: number) => (
                        <li key={midx} className="mt-1">
                          <code className="bg-gray-100 p-1 rounded">ID: {m.id}</code> - 
                          <span className="font-medium ml-1">{m.name}</span> 
                          <span className="text-gray-500 ml-1">({m.code})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Tutte le Espansioni Pokémon ({expansions.length})</h2>
            
            <div className="mb-4">
              <input 
                type="text"
                placeholder="Cerca espansione..."
                className="p-2 border rounded w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExpansions.map((exp, idx) => (
                <div key={idx} className="p-3 border rounded">
                  <div className="font-medium">{exp.name}</div>
                  <div className="text-sm mt-1">
                    <code className="bg-gray-100 p-1 rounded">ID: {exp.id}</code>
                    <span className="text-gray-500 ml-2">Code: {exp.code}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredExpansions.length === 0 && (
              <p>Nessuna espansione trovata con il termine di ricerca: &quot;{searchTerm}&quot;</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}