// app/api/users/[userId]/cards/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Card } from '@/lib/db';

interface RouteParams {
  params: {
    userId: string;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    const userId = params.userId;
    
    // Verifica che l'utente stia richiedendo le proprie statistiche
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Non autorizzato ad accedere alle statistiche di un altro utente' },
        { status: 403 }
      );
    }
    
    // Connettiti al database
    const client = await clientPromise;
    const db = client.db();
    
    // Ottieni il conteggio totale delle carte (comune a tutti gli utenti)
    const statsCollection = db.collection('stats');
    const globalStats = await statsCollection.findOne({ type: 'illustrationRareCount' });
    
    let totalCount = 0;
    if (globalStats && globalStats.totalCount) {
      totalCount = globalStats.totalCount;
    } else {
      // Se non hai ancora il conteggio globale, puoi calcolarlo e memorizzarlo
      // Ma questo dovrebbe essere già gestito dalla tua funzione getCardStats
      totalCount = 0; // Imposta un valore di default
    }
    
    // Ottieni il conteggio delle carte raccolte da questo specifico utente
    let collectedCount = 0;
    
    // Se usi Mongoose
    if (typeof Card !== 'undefined') {
      collectedCount = await Card.countDocuments({ 
        userId: userId,
        isCollected: true 
      });
    } else {
      // Altrimenti usa MongoDB direttamente
      const cardsCollection = db.collection('cards');
      collectedCount = await cardsCollection.countDocuments({ 
        userId: userId,
        isCollected: true 
      });
    }
    
    return NextResponse.json({
      totalCount,
      collectedCount,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore durante il recupero delle statistiche:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore durante il recupero delle statistiche' },
      { status: 500 }
    );
  }
}