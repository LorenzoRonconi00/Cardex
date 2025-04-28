//lib/db.ts

import mongoose from 'mongoose';

// Definizione dell'interfaccia per la cache di mongoose
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Estensione del tipo global di NodeJS
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const MONGODB_URI = process.env.MONGODB_URI;

// Inizializzazione della cache
// eslint-disable-next-line prefer-const
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Se la cache non esiste, la creiamo
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectToDatabase() {
  // Se abbiamo già una connessione, la restituiamo
  if (cached.conn) {
    return cached.conn;
  }

  // Se non abbiamo una promessa in corso, creiamo una nuova connessione
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    // Attendi che la promessa sia risolta
    cached.conn = await cached.promise;
  } catch (e) {
    // In caso di errore, resettiamo la promessa
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Card Schema
const cardSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  expansion: {
    type: String,
    required: true
  },
  isCollected: {
    type: Boolean,
    default: false
  },
  dateCollected: {
    type: Date,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
});

cardSchema.index({ id: 1, userId: 1 }, { unique: true });

// Expansion Schema
const expansionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  logo: String,
  releaseDate: String
});

const wishlistItemSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true  // Aggiunge un indice per migliorare le prestazioni delle query
  },
  card: {
    type: Object,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

wishlistItemSchema.index({ userId: 1, 'card.id': 1 }, { unique: true });

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  emailVerified: Date,
  image: String,
  accounts: [
    {
      provider: String,
      providerAccountId: String,
      type: String,
      access_token: String,
      expires_at: Number,
      token_type: String,
      id_token: String,
      scope: String,
    }
  ],
  sessions: [
    {
      expires: Date,
      sessionToken: String,
    }
  ],
});

// Binder Schema
const binderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true,
    default: 'red'
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

binderSchema.index({ userId: 1, name: 1 }, { unique: true });

const binderSlotSchema = new mongoose.Schema({
  binderId: { 
    type: String, 
    required: true,
    index: true
  },
  slotNumber: { 
    type: Number, 
    required: true 
  },
  cardId: { 
    type: String, 
    required: true 
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

binderSlotSchema.index({ binderId: 1, slotNumber: 1 }, { unique: true });

// Controlla se il modello esiste già prima di crearlo (evita errori in hot-reload)
export const Card = mongoose.models.Card || mongoose.model('Card', cardSchema);
export const Expansion = mongoose.models.Expansion || mongoose.model('Expansion', expansionSchema);
export const WishlistItem = mongoose.models.WishlistItem || mongoose.model('WishlistItem', wishlistItemSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Binder = mongoose.models.Binder || mongoose.model('Binder', binderSchema);
export const BinderSlot = mongoose.models.BinderSlot || mongoose.model('BinderSlot', binderSlotSchema);

export default connectToDatabase;