// app/api/wishlist/clear/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase, { WishlistItem } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// DELETE - Rimuovi tutte le carte dalla wishlist dell'utente corrente
export async function DELETE() {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Ottieni l'ID dell'utente
    const userId = session.user.id;
    
    console.log("API: Attempting to delete all wishlist items for user:", userId);
    
    await connectToDatabase();
    
    // Rimuovi tutte le carte dalla wishlist dell'utente corrente
    const result = await WishlistItem.deleteMany({ 
      userId: userId
    });
    
    console.log("API: Delete result:", result);
    
    if (result.deletedCount === 0) {
      console.log("API: No items found for user:", userId);
      return NextResponse.json(
        { message: 'No wishlist items found for the current user' },
        { status: 200 }
      );
    }
    
    console.log("API: Successfully deleted all items for user:", userId, "Count:", result.deletedCount);
    return NextResponse.json(
      { 
        message: 'All wishlist items removed successfully',
        count: result.deletedCount 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API: Error removing all cards from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove all cards from wishlist' },
      { status: 500 }
    );
  }
}