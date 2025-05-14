// app/api/binders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase, { Binder } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/binders/[id] - Get a specific binder
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const binderId = params.id;
    
    if (!binderId || binderId === 'undefined') {
      return NextResponse.json({ success: false, error: 'Invalid binder ID' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Verifica se l'ID è un ObjectID valido
    if (!mongoose.Types.ObjectId.isValid(binderId)) {
      return NextResponse.json({ success: false, error: 'Invalid binder ID format' }, { status: 400 });
    }
    
    // Find the binder and ensure it belongs to the current user
    const binder = await Binder.findOne({ _id: binderId, userId });
    
    if (!binder) {
      return NextResponse.json({ success: false, error: 'Binder not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: binder }, { status: 200 });
  } catch (error) {
    console.error('Error fetching binder:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch binder' }, { status: 500 });
  }
}

// DELETE /api/binders/[id] - Delete a specific binder
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const binderId = params.id;
    
    console.log("DELETE API called with ID:", binderId);
    
    if (!binderId || binderId === 'undefined') {
      return NextResponse.json({ success: false, error: 'Invalid binder ID' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Verifica se l'ID è un ObjectID valido
    if (!mongoose.Types.ObjectId.isValid(binderId)) {
      return NextResponse.json({ success: false, error: 'Invalid binder ID format' }, { status: 400 });
    }
    
    // Find the binder and ensure it belongs to the current user
    const binder = await Binder.findOne({ _id: binderId, userId });
    
    if (!binder) {
      return NextResponse.json({ success: false, error: 'Binder not found' }, { status: 404 });
    }
    
    // Delete the binder
    await Binder.deleteOne({ _id: binderId });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting binder:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete binder' }, { status: 500 });
  }
}