// scripts/update-illustration-rare-type.mjs
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
const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-Api-Key': API_KEY || '',
  },
});

// Schema per Card (aggiornato con campo type)
const cardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  expansion: { type: String, required: true },
  isCollected: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String } // Nuovo campo per il tipo di carta
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

// Funzione per verificare se una carta è Illustration Rare
function isIllustrationRare(card) {
  return card.rarity === 'Illustration Rare';
}

// Funzione per recuperare le carte di un'espansione dall'API
async function fetchCardsBySet(setId) {
  try {
    console.log(`Fetching cards for expansion ${setId}...`);
    
    const response = await api.get('/cards', {
      params: {
        q: `set.id:${setId}`,
        orderBy: 'number',
        pageSize: 250, // Maximum allowed by the API
      },
    });
    
    const allCards = response.data.data;
    console.log(`Found ${allCards.length} total cards in set ${setId}`);
    
    // Log info about Illustration Rare cards
    const illustrationRareCards = allCards.filter(card => isIllustrationRare(card));
    console.log(`Set ${setId} has ${illustrationRareCards.length} Illustration Rare cards`);
    
    return allCards;
  } catch (error) {
    console.error(`Error fetching cards for expansion ${setId}:`, error);
    return [];
  }
}

// Funzione principale per aggiornare il type delle carte
async function updateCardsType() {
  // Connect to database
  const connected = await connectToDB();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  // Ottieni i modelli
  const Card = mongoose.models.Card || mongoose.model('Card', cardSchema);
  const Expansion = mongoose.models.Expansion || mongoose.model('Expansion', expansionSchema);
  
  // Ottieni tutte le espansioni dal database
  const expansions = await Expansion.find({}).sort({ releaseDate: -1 });
  console.log(`Found ${expansions.length} expansions in database`);
  
  // Mappa per tracciare le carte che sono Illustration Rare
  const illustrationRareCards = new Map();
  
  // Per ogni espansione, recupera le carte dall'API e identifica le Illustration Rare
  for (const expansion of expansions) {
    console.log(`\nProcessing expansion: ${expansion.name} (${expansion.id})`);
    
    const apiCards = await fetchCardsBySet(expansion.id);
    
    // Identifica le carte Illustration Rare
    for (const card of apiCards) {
      if (isIllustrationRare(card)) {
        illustrationRareCards.set(card.id, true);
      }
    }
    
    console.log(`Identified ${apiCards.filter(isIllustrationRare).length} Illustration Rare cards in ${expansion.id}`);
  }
  
  console.log(`\nTotal Illustration Rare cards identified: ${illustrationRareCards.size}`);
  
  // Ora aggiorniamo tutte le carte nel database
  // Prima quelle senza userId (template cards)
  const templateCards = await Card.find({ userId: { $exists: false } });
  console.log(`Found ${templateCards.length} template cards to update`);
  
  let updatedCount = 0;
  let illustrationRareUpdateCount = 0;
  
  for (const card of templateCards) {
    try {
      if (illustrationRareCards.has(card.id)) {
        card.type = 'illustration_rare';
        illustrationRareUpdateCount++;
      } else {
        card.type = 'regular';
      }
      
      await card.save();
      updatedCount++;
      
      // Log progress
      if (updatedCount % 50 === 0) {
        console.log(`Updated ${updatedCount}/${templateCards.length} template cards...`);
      }
    } catch (err) {
      console.error(`Error updating card ${card.id}:`, err.message);
    }
  }
  
  console.log(`Updated ${updatedCount} template cards`);
  console.log(`Set type='illustration_rare' for ${illustrationRareUpdateCount} cards`);
  
  // Ora aggiorniamo le carte utente basandoci sulle carte template
  const userCards = await Card.find({ userId: { $exists: true } });
  console.log(`Found ${userCards.length} user cards to update`);
  
  // Crea una mappa delle carte template per un accesso più veloce
  const templateMap = new Map();
  const updatedTemplateCards = await Card.find({ userId: { $exists: false } });
  updatedTemplateCards.forEach(card => {
    templateMap.set(card.id, card.type);
  });
  
  let userUpdatedCount = 0;
  let userIllustrationRareCount = 0;
  
  for (const card of userCards) {
    try {
      // Ottieni il tipo dalla carta template corrispondente
      const cardType = templateMap.get(card.id) || 'regular';
      card.type = cardType;
      
      if (cardType === 'illustration_rare') {
        userIllustrationRareCount++;
      }
      
      await card.save();
      userUpdatedCount++;
      
      // Log progress
      if (userUpdatedCount % 50 === 0) {
        console.log(`Updated ${userUpdatedCount}/${userCards.length} user cards...`);
      }
    } catch (err) {
      console.error(`Error updating user card ${card.id}:`, err.message);
    }
  }
  
  console.log(`Updated ${userUpdatedCount} user cards`);
  console.log(`Set type='illustration_rare' for ${userIllustrationRareCount} user cards`);
  
  // Statistiche finali
  const illustrationRareStats = await Card.countDocuments({ type: 'illustration_rare' });
  const regularCardStats = await Card.countDocuments({ type: 'regular' });
  
  console.log('\nFinal statistics:');
  console.log(`- Total Illustration Rare cards: ${illustrationRareStats}`);
  console.log(`- Total regular cards: ${regularCardStats}`);
  console.log(`- Total updated cards: ${illustrationRareStats + regularCardStats}`);
  
  console.log('\nUpdate completed!');
  await mongoose.connection.close();
}

// Esegui l'aggiornamento
updateCardsType().catch(error => {
  console.error('Error during update:', error);
  process.exit(1);
});