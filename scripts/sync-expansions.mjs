// scripts/sync-all-expansions.mjs
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configura dirname per ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica le variabili d'ambiente
dotenv.config();

// Configura axios con la tua API key
const api = axios.create({
  baseURL: 'https://api.pokemontcg.io/v2',
  headers: {
    'X-Api-Key': process.env.POKEMON_TCG_API_KEY || '',
  },
});

// Schema per Card
const cardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  expansion: { type: String, required: true },
  isCollected: { type: Boolean, default: false }
});

// Schema per Expansion
const expansionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  logo: { type: String, required: true },
  releaseDate: { type: String }
});

function getCorrectMongoUri() {
  const uri = process.env.MONGODB_URI || '';
  
  // Se l'URI non specifica un database, aggiungi 'cardex'
  if (uri && !uri.includes('/cardex')) {
    // Se l'URI termina con '/', aggiungi 'cardex'
    if (uri.endsWith('/')) {
      return `${uri}cardex`;
    }
    // Altrimenti aggiungi '/cardex'
    return `${uri}/cardex`;
  }
  
  return uri;
}

// Connect to MongoDB
async function connectToDB() {
  try {
    const uri = getCorrectMongoUri();
    console.log(`Connecting to: ${uri}`);
    
    await mongoose.connect(uri);
    
    // Verifica a quale database siamo connessi
    const db = mongoose.connection.db;
    console.log(`Connected to MongoDB - Database: ${db.databaseName}`);
    
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Fetch cards by set ID
async function fetchCardsBySet(setId) {
  try {
    const response = await api.get('/cards', {
      params: {
        q: `set.id:${setId}`,
        orderBy: 'number',
        pageSize: 250,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching cards for set ${setId}:`, error);
    return [];
  }
}

// Process cards - include more types of special cards
function processCards(cards) {
  // Prima cerca Illustration Rare e altre carte speciali
  const specialCards = cards.filter(card => {
    return card.rarity === 'Illustration Rare' || 
           card.rarity === 'Special Illustration Rare' ||
           card.name.includes('ex') || 
           card.name.includes('EX') ||
           card.name.includes('V') ||
           card.name.includes('VMAX') ||
           card.name.includes('VSTAR') ||
           card.name.includes('GX') ||
           card.subtypes?.includes('ex') ||
           card.subtypes?.includes('EX') ||
           card.subtypes?.includes('V') ||
           card.subtypes?.includes('VMAX') ||
           card.subtypes?.includes('VSTAR') ||
           card.subtypes?.includes('GX');
  }).map(formatCard);
  
  console.log(`Found ${specialCards.length} special cards`);
  
  // Se non troviamo carte speciali, prendiamo le prime 30 carte normali
  if (specialCards.length === 0) {
    console.log('No special cards found, selecting regular cards');
    return cards.slice(0, 30).map(formatCard);
  }
  
  return specialCards;
}

function formatCard(card) {
  // Formatta per il tuo schema
  let imageUrl = card.images.large;
  if (imageUrl.includes('_hires')) {
    imageUrl = imageUrl.replace('_hires', '');
  }
  
  return {
    id: card.id,
    name: card.name,
    imageUrl: imageUrl,
    expansion: card.set.id,
    isCollected: false
  };
}

// Cerca Reshiram nelle carte
function findReshiram(cards) {
  return cards.filter(card => 
    card.name.toLowerCase().includes('reshiram')
  );
}

// Il nodo principale della sincronizzazione
async function syncAllExpansions() {
  // Connect to database
  const connected = await connectToDB();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  // Crea o ottieni i modelli
  const Card = mongoose.models.Card || mongoose.model('Card', cardSchema);
  const Expansion = mongoose.models.Expansion || mongoose.model('Expansion', expansionSchema);
  
  // Ottieni tutte le espansioni dal database
  const dbExpansions = await Expansion.find({}).sort({ releaseDate: -1 });
  console.log(`Found ${dbExpansions.length} expansions in database:`);
  dbExpansions.forEach(exp => console.log(`- ${exp.name} (${exp.id})`));
  
  // Sincronizza TUTTE le espansioni nel database
  for (const expansion of dbExpansions) {
    console.log(`\nProcessing expansion: ${expansion.name} (${expansion.id})`);
    
    // Controlla se l'espansione ha già carte nel DB
    const existingCount = await Card.countDocuments({ expansion: expansion.id });
    console.log(`Found ${existingCount} existing cards for ${expansion.id} in database`);
    
    // Fetch cards from API
    console.log(`Fetching cards for ${expansion.id} from API...`);
    try {
      const apiCards = await fetchCardsBySet(expansion.id);
      console.log(`Found ${apiCards.length} total cards in API for ${expansion.id}`);
      
      if (apiCards.length === 0) {
        console.log(`No cards found for ${expansion.id} in API, skipping...`);
        continue;
      }
      
      // Cerca Reshiram (per debug)
      const reshiramCards = findReshiram(apiCards);
      if (reshiramCards.length > 0) {
        console.log(`!!! Found ${reshiramCards.length} Reshiram cards in ${expansion.id}:`);
        reshiramCards.forEach(card => console.log(`  - ${card.name} (${card.id})`));
      }
      
      // Process cards
      const cardsToAdd = processCards(apiCards);
      console.log(`Adding ${cardsToAdd.length} cards to database for ${expansion.id}`);
      
      // Save cards one by one to avoid bulk errors
      let addedCount = 0;
      for (const card of cardsToAdd) {
        try {
          await Card.updateOne(
            { id: card.id },
            { $set: card },
            { upsert: true }
          );
          addedCount++;
          
          // Log progress for large sets
          if (addedCount % 10 === 0) {
            console.log(`Added ${addedCount}/${cardsToAdd.length} cards...`);
          }
        } catch (err) {
          console.error(`Error saving card ${card.id}:`, err.message);
        }
      }
      
      console.log(`Successfully added/updated ${addedCount} cards for ${expansion.id}`);
    } catch (error) {
      console.error(`Failed to process expansion ${expansion.id}:`, error.message);
      continue; // Passa alla prossima espansione
    }
    
    // Count cards after syncing
    const newCount = await Card.countDocuments({ expansion: expansion.id });
    console.log(`After sync: ${newCount} cards for ${expansion.id} in database`);
  }
  
  // Cerca specificamente Reshiram in tutto il database
  const reshiramCards = await Card.find({ name: { $regex: 'reshiram', $options: 'i' } });
  console.log(`\nFound ${reshiramCards.length} Reshiram cards in database after sync:`);
  reshiramCards.forEach(card => {
    console.log(`- ${card.name} (${card.id}) in expansion ${card.expansion}`);
  });
  
  // Riassunto delle espansioni nel database
  const expansionsWithCards = await Card.aggregate([
    { $group: { _id: "$expansion", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log('\nExpansions with cards in database:');
  expansionsWithCards.forEach(exp => {
    console.log(`- ${exp._id}: ${exp.count} cards`);
  });
  
  console.log('\nSync complete!');
  await mongoose.connection.close();
}

// Esegui la sincronizzazione
syncAllExpansions().catch(error => {
  console.error('Error during sync:', error);
  process.exit(1);
});