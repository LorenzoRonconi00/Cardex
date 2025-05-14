// app/api/binders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase, { Binder } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/binders - Get all binders for the logged in user
export async function GET() {
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
    
    console.log("API - Received request body:", body);
    
    if (!body.name || !body.color) {
      return NextResponse.json({ success: false, error: 'Name and color are required' }, { status: 400 });
    }

    // Validate slotCount
    const validSlotCounts = [180, 360, 540, 720];
    
    // Conversione a numero con parseInt per essere super sicuri
    let slotCount = parseInt(body.slotCount, 10);
    
    // Validazione finale del valore
    if (isNaN(slotCount) || !validSlotCounts.includes(slotCount)) {
      slotCount = 180; // Default se invalido
    }
    
    console.log("API - Final slotCount value:", slotCount, "type:", typeof slotCount);

    await connectToDatabase();
    
    // Check if binder with the same name already exists for this user
    const existingBinder = await Binder.findOne({ userId, name: body.name });
    if (existingBinder) {
      return NextResponse.json({ success: false, error: 'A binder with this name already exists' }, { status: 409 });
    }
    
    // Mostra lo schema Binder per debug
    console.log("API - Binder schema paths:", Object.keys(Binder.schema.paths));
    
    // Creiamo il documento esplicitamente con i campi
    const binderData = {
      name: body.name,
      color: body.color,
      slotCount: slotCount,  // Assicurati che questo campo sia definito correttamente
      userId
    };
    
    console.log("API - Creating binder with data:", binderData);
    
    // Creazione del nuovo documento
    const newBinder = new Binder(binderData);
    
    // Log il documento prima del salvataggio
    console.log("API - New binder document before save:", newBinder);
    console.log("API - Binder properties:", Object.keys(newBinder));
    console.log("API - slotCount present in document:", newBinder.slotCount, typeof newBinder.slotCount);
    
    // Salvataggio
    await newBinder.save();
    
    // Log il documento dopo il salvataggio
    console.log("API - Saved binder document:", newBinder);
    
    return NextResponse.json({ success: true, data: newBinder }, { status: 201 });
  } catch (error) {
    console.error('Error creating binder:', error);
    return NextResponse.json({ success: false, error: 'Failed to create binder' }, { status: 500 });
  }
}