// app/api/cardtrader/find-expansions/route.ts
import { NextResponse } from 'next/server';
import { CardTraderService } from '@/services/cardtraderService';

// Nomi delle espansioni Pokémon dal nostro database
const OUR_EXPANSIONS = [
  // Espansioni precedentemente specificate
  "Paldean Fates",
  "Paradox Rift",
  "151",
  "Obsidian Flames",
  "Paldea Evolved",
  "Scarlet & Violet",
  // Nuove espansioni
  "Journey Together",
  "Surging Sparks",
  "Stellar Crown",
  "Shrouded Fable",
  "Twilight Masquerade"
];

export async function GET() {
  try {
    // Recupera tutte le espansioni da CardTrader
    const allExpansions = await CardTraderService.getExpansions();

    // Filtra solo le espansioni Pokémon
    // Nota: potrebbe essere necessario utilizzare un'euristica più complessa
    // poiché CardTrader potrebbe non etichettare chiaramente le espansioni Pokémon
    const pokemonExpansions = allExpansions.filter(exp => {
      // Cerca espansioni con nome che potrebbe essere Pokémon
      // Questa è un'euristica approssimativa, potrebbe richiedere adattamenti
      const name = exp.name.toLowerCase();
      return (
        name.includes('pokemon') || 
        name.includes('pok') || 
        name.includes('paldea') || 
        name.includes('scarlet') || 
        name.includes('violet') || 
        name.includes('rift') || 
        name.includes('obsidian') || 
        name.includes('flames') || 
        name.includes('fates') ||
        name.includes('journey') ||
        name.includes('spark') ||
        name.includes('stellar') ||
        name.includes('crown') ||
        name.includes('shroud') ||
        name.includes('fable') ||
        name.includes('twilight') ||
        name.includes('masquerade')
      );
    });

    // Cerca possibili corrispondenze con le nostre espansioni
    const matchResults = OUR_EXPANSIONS.map(ourExpName => {
      const ourNameLower = ourExpName.toLowerCase();
      
      // Cerca espansioni simili
      const possibleMatches = pokemonExpansions.filter(exp => {
        const expNameLower = exp.name.toLowerCase();
        return (
          expNameLower.includes(ourNameLower) || 
          ourNameLower.includes(expNameLower) ||
          // Logica aggiuntiva per gestire nomi specifici
          (ourNameLower === "151" && (expNameLower.includes("151") || expNameLower.includes("one hundred fifty one")))
        );
      });

      return {
        ourExpansion: ourExpName,
        possibleMatches: possibleMatches.map(m => ({
          id: m.id,
          name: m.name,
          code: m.code
        }))
      };
    });

    // Ritorna tutte le espansioni Pokémon trovate e le possibili corrispondenze
    return NextResponse.json({
      success: true,
      allPokemonExpansions: pokemonExpansions.map(exp => ({
        id: exp.id,
        name: exp.name,
        code: exp.code
      })),
      matchResults
    });
  } catch (error) {
    console.error('Errore nel recupero delle espansioni:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle espansioni' },
      { status: 500 }
    );
  }
}