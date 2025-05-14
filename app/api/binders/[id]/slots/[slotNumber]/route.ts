import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { BinderSlot } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// DELETE /api/binders/:id/slots/:slotNumber - Remove a card from a slot
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string, slotNumber: string } }
) {
  try {
    const binderId = params.id;
    const slotNumber = parseInt(params.slotNumber);
    
    if (isNaN(slotNumber)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid slot number' 
      }, { status: 400 });
    }
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Connect to database
    await connectToDatabase();
    
    // Delete the slot
    const result = await BinderSlot.deleteOne({ 
      binderId, 
      slotNumber, 
      userId 
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Slot not found or already empty' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Card removed from slot ${slotNumber}` 
    });
  } catch (error) {
    console.error('Error removing card from slot:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove card from slot' 
    }, { status: 500 });
  }
}