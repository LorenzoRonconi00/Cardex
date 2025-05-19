// Approccio 2: Creare un tipo distinto senza estendere Binder
// app/api/binders/[id]/slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { BinderSlot, Card, Binder } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Creiamo un tipo distinto invece di estendere Binder
interface DatabaseBinder {
  _id?: string | ObjectId;
  id?: string;
  name: string;
  color: string;
  slotCount: number;
  userId: string | ObjectId;
  createdAt: Date;
  __v?: number;
  [key: string]: any;
}

// POST /api/binders/:id/slots - Add/update a card in a binder slot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: binderId } = await params;
    
    // Verify user authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // User ID from session
    const userId = session.user.id;
    
    // Read data from request body
    const { slotNumber, cardId } = await request.json();
    
    if (!slotNumber || !cardId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Slot number and card ID are required' 
      }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Try finding the binder by different ID fields
    let binder: DatabaseBinder | null = null;
    
    if (ObjectId.isValid(binderId)) {
      const result = await Binder.findOne({ _id: new ObjectId(binderId) });
      binder = result ? result.toObject() as DatabaseBinder : null;
    }
    
    if (!binder) {
      const result = await Binder.findOne({ id: binderId });
      binder = result ? result.toObject() as DatabaseBinder : null;
    }
    
    if (!binder) {
      return NextResponse.json({ 
        success: false, 
        error: 'Binder not found' 
      }, { status: 404 });
    }
    
    // Check if the binder belongs to the user
    if (binder.userId.toString() !== userId.toString()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }
    
    // Verify that the card exists and belongs to the user
    const card = await Card.findOne({ id: cardId });
    
    if (!card) {
      return NextResponse.json({ 
        success: false, 
        error: 'Card not found' 
      }, { status: 404 });
    }
    
    // Check if the slot already has a card
    const existingSlot = await BinderSlot.findOne({ 
      binderId, 
      slotNumber,
    });
    
    if (existingSlot) {
      // Update the existing slot
      existingSlot.cardId = cardId;
      await existingSlot.save();
    } else {
      // Create a new slot entry
      await BinderSlot.create({
        binderId,
        slotNumber,
        cardId,
        userId,
        addedAt: new Date()
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Card successfully added to slot ${slotNumber}` 
    });
  } catch (error) {
    console.error('Error updating binder slot:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update binder slot' 
    }, { status: 500 });
  }
}

// GET /api/binders/:id/slots - Get all cards in a binder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: binderId } = await params;
    
    // Verify user authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // User ID from session
    const userId = session.user.id;
    
    // Connect to the database
    await connectToDatabase();
    
    // Try finding the binder by different ID fields
    let binder: DatabaseBinder | null = null;
    
    if (ObjectId.isValid(binderId)) {
      const result = await Binder.findOne({ _id: new ObjectId(binderId) });
      binder = result ? result.toObject() as DatabaseBinder : null;
    }
    
    if (!binder) {
      const result = await Binder.findOne({ id: binderId });
      binder = result ? result.toObject() as DatabaseBinder : null;
    }
    
    if (!binder) {
      return NextResponse.json({ 
        success: false, 
        error: 'Binder not found' 
      }, { status: 404 });
    }
    
    // Check if the binder belongs to the user
    if (binder.userId.toString() !== userId.toString()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }
    
    // Find all slots for this binder
    const binderSlots = await BinderSlot.find({ 
      binderId
    }).lean();
    
    // Get all card IDs from the slots
    const cardIds = binderSlots.map(slot => slot.cardId);
    
    // Fetch the cards data
    const cards = await Card.find({
      id: { $in: cardIds }
    }).lean();
    
    // Create a map of card IDs to card data for easy lookup
    const cardMap = cards.reduce<Record<string, any>>((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {});
    
    // Combine slot data with card data
    const slotsWithCards = binderSlots.map(slot => ({
      ...slot,
      card: cardMap[slot.cardId] || null
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: slotsWithCards 
    });
  } catch (error) {
    console.error('Error fetching binder slots:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch binder slots' 
    }, { status: 500 });
  }
}