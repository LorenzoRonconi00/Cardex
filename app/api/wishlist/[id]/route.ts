// app/api/wishlist/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { WishlistItem } from '@/lib/db';
import mongoose from 'mongoose';

// DELETE - Rimuovi una carta dalla wishlist per ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    console.log("API: Attempting to delete wishlist item with ID:", id);
    
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
    
    // Rimuovi la carta dalla wishlist
    const result = await WishlistItem.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    
    console.log("API: Delete result:", result);
    
    if (result.deletedCount === 0) {
      console.log("API: Item not found with ID:", id);
      return NextResponse.json(
        { error: 'Wishlist item not found' },
        { status: 404 }
      );
    }
    
    console.log("API: Successfully deleted item with ID:", id);
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