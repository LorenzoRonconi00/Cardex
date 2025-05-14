// app/api/wishlist/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { WishlistItem } from '@/lib/db';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// DELETE - Rimuovi una carta specifica dalla wishlist dell'utente corrente
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const id = params.id;
    
    console.log("API: Attempting to delete wishlist item with ID:", id, "for user:", userId);
    
    if (!id) {
      console.log("API: No ID provided");
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Verifica che l'ID sia valido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("API: Invalid ObjectId format:", id);
      return NextResponse.json(
        { error: 'Invalid wishlist item ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Rimuovi SOLO la carta specifica dalla wishlist dell'utente corrente
    const result = await WishlistItem.deleteOne({ 
      _id: new mongoose.Types.ObjectId(id),
      userId: userId  // Assicura che l'elemento appartenga all'utente
    });
    
    console.log("API: Delete result:", result);
    
    if (result.deletedCount === 0) {
      console.log("API: Item not found with ID:", id, "for user:", userId);
      return NextResponse.json(
        { error: 'Wishlist item not found or not owned by the current user' },
        { status: 404 }
      );
    }
    
    console.log("API: Successfully deleted item with ID:", id, "for user:", userId);
    return NextResponse.json(
      { message: 'Wishlist item removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('API: Error removing card from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove card from wishlist' },
      { status: 500 }
    );
  }
}