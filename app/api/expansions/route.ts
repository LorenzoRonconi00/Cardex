import { NextResponse } from 'next/server';
import connectToDatabase, { Expansion } from '@/lib/db';
import { fetchExpansions } from '@/lib/pokemon-api';

// Lista di ID di espansioni da escludere
const EXCLUDED_EXPANSIONS = ['sv8pt5', 'sve', 'svp']; // Prismatic Evolutions

// GET /api/expansions
export async function GET() {
  try {
    await connectToDatabase();
    
    // Controlla se abbiamo espansioni nel database
    const existingExpansions = await Expansion.find({ 
      id: { $regex: /^sv/, $nin: EXCLUDED_EXPANSIONS } 
    }).sort({ releaseDate: -1 }).limit(13);
    
    // Se ne abbiamo abbastanza, restituiscile
    if (existingExpansions.length >= 13) {
      return NextResponse.json(existingExpansions);
    }
    
    // Altrimenti, recupera dall'API
    const allExpansions = await fetchExpansions();
    console.log("Available expansions (before filtering):", allExpansions.length);
    
    // Filtra solo le espansioni della serie SV (escludendo quelle specifiche)
    const filteredExpansions = allExpansions.filter(exp => 
      exp.id.startsWith('sv') && !EXCLUDED_EXPANSIONS.includes(exp.id)
    );
    
    console.log("Filtered expansions:", filteredExpansions.map(exp => exp.id + " (" + exp.name + ")"));
    
    // Non limitiamo ulteriormente, restituiamo tutte le espansioni SV filtrate
    
    // Salva nel database se non sono già presenti
    for (const expansion of filteredExpansions) {
      await Expansion.findOneAndUpdate(
        { id: expansion.id },
        expansion,
        { upsert: true, new: true }
      );
    }
    
    return NextResponse.json(filteredExpansions);
  } catch (error) {
    console.error('Error fetching expansions:', error);
    return NextResponse.json({ error: 'Failed to fetch expansions' }, { status: 500 });
  }
}