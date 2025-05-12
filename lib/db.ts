// lib/db.ts
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

// IMPORTANTE: Per evitare problemi con hot-reload, verifichiamo se i modelli esistono già
// prima di definirli

// Card Schema
const cardSchema = !mongoose.models.Card 
  ? new mongoose.Schema({
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
    })
  : mongoose.models.Card.schema;

if (!mongoose.models.Card) {
  cardSchema.index({ id: 1, userId: 1 }, { unique: true });
}

// Expansion Schema
const expansionSchema = !mongoose.models.Expansion 
  ? new mongoose.Schema({
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
    })
  : mongoose.models.Expansion.schema;

// Wishlist Schema
const wishlistItemSchema = !mongoose.models.WishlistItem 
  ? new mongoose.Schema({
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
    }, { timestamps: true })
  : mongoose.models.WishlistItem.schema;

if (!mongoose.models.WishlistItem) {
  wishlistItemSchema.index({ userId: 1, 'card.id': 1 }, { unique: true });
}

// User Schema
const userSchema = !mongoose.models.User 
  ? new mongoose.Schema({
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
    })
  : mongoose.models.User.schema;

// Binder Schema - QUESTO È QUELLO CHE DOBBIAMO MODIFICARE
const binderSchema = !mongoose.models.Binder
  ? new mongoose.Schema({
      name: {
        type: String,
        required: true
      },
      color: {
        type: String,
        required: true,
        default: 'red'
      },
      slotCount: {
        type: Number,
        required: true,
        default: 180,
        enum: [180, 360, 540, 720]  // Solo questi valori sono consentiti
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
    })
  : mongoose.models.Binder.schema;

if (!mongoose.models.Binder) {
  binderSchema.index({ userId: 1, name: 1 }, { unique: true });
}

// Binder Slot Schema
const binderSlotSchema = !mongoose.models.BinderSlot
  ? new mongoose.Schema({
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
    })
  : mongoose.models.BinderSlot.schema;

if (!mongoose.models.BinderSlot) {
  binderSlotSchema.index({ binderId: 1, slotNumber: 1 }, { unique: true });
}

// Controlla se il modello esiste già prima di crearlo (evita errori in hot-reload)
export const Card = mongoose.models.Card || mongoose.model('Card', cardSchema);
export const Expansion = mongoose.models.Expansion || mongoose.model('Expansion', expansionSchema);
export const WishlistItem = mongoose.models.WishlistItem || mongoose.model('WishlistItem', wishlistItemSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Binder = mongoose.models.Binder || mongoose.model('Binder', binderSchema);
export const BinderSlot = mongoose.models.BinderSlot || mongoose.model('BinderSlot', binderSlotSchema);

export default connectToDatabase;