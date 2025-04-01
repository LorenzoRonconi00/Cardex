import mongoose from 'mongoose';

// Definizione dell'interfaccia per la cache di mongoose
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Estensione del tipo global di NodeJS
declare global {
  var mongoose: MongooseCache | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const MONGODB_URI = process.env.MONGODB_URI;

// Inizializzazione della cache
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
    required: true, 
    unique: true 
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
  }
});

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
  card: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    expansion: { type: String, required: true }
  },
  price: { 
    type: Number, 
    required: true 
  },
  dateAdded: { 
    type: Date, 
    default: Date.now 
  }
});

// Controlla se il modello esiste già prima di crearlo (evita errori in hot-reload)
export const Card = mongoose.models.Card || mongoose.model('Card', cardSchema);
export const Expansion = mongoose.models.Expansion || mongoose.model('Expansion', expansionSchema);
export const WishlistItem = mongoose.models.WishlistItem || mongoose.model('WishlistItem', wishlistItemSchema);

export default connectToDatabase;