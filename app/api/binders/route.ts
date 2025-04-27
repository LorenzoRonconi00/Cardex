// app/api/binders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase, { Binder } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/route';

// GET /api/binders - Get all binders for the logged in user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    await connectToDatabase();
    
    const binders = await Binder.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: binders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching binders:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch binders' }, { status: 500 });
  }
}

// POST /api/binders - Create a new binder
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    
    if (!body.name || !body.color) {
      return NextResponse.json({ success: false, error: 'Name and color are required' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Check if binder with the same name already exists for this user
    const existingBinder = await Binder.findOne({ userId, name: body.name });
    if (existingBinder) {
      return NextResponse.json({ success: false, error: 'A binder with this name already exists' }, { status: 409 });
    }
    
    const newBinder = new Binder({
      name: body.name,
      color: body.color,
      userId,
    });
    
    await newBinder.save();
    
    return NextResponse.json({ success: true, data: newBinder }, { status: 201 });
  } catch (error) {
    console.error('Error creating binder:', error);
    return NextResponse.json({ success: false, error: 'Failed to create binder' }, { status: 500 });
  }
}