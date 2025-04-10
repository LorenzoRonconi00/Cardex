// lib/models/stats.ts
import mongoose from 'mongoose';
import connectToDatabase from './db';
import { Card } from './db';
import { fetchExpansions, fetchCardsByExpansion } from '@/lib/pokemon-api';

// Define the Stats schema
const statsSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    unique: true 
  },
  totalCount: { 
    type: Number, 
    required: true 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

// Create the model
export const Stats = mongoose.models.Stats || mongoose.model('Stats', statsSchema);

export interface CardStats {
  totalCount: number;
  collectedCount: number;
  lastUpdated: Date;
}

/**
 * Retrieves card statistics or calculates them if needed
 */
export async function getCardStats(): Promise<CardStats> {
  await connectToDatabase();
  
  // Check if we have cached stats that are recent (less than 1 day old)
  const cachedStats = await Stats.findOne({ type: 'illustrationRareCount' });
  const now = new Date();
  
  // Get current collected count (always fresh from database)
  const collectedCount = await Card.countDocuments({ isCollected: true });
  
  // If we have recent stats, just return them with updated collected count
  if (cachedStats && 
      now.getTime() - new Date(cachedStats.lastUpdated).getTime() < 24 * 60 * 60 * 1000) {
    return {
      totalCount: cachedStats.totalCount,
      collectedCount,
      lastUpdated: cachedStats.lastUpdated
    };
  }
  
  // No recent stats, calculate everything from scratch
  const expansions = await fetchExpansions();
  
  // Fetch all Illustration Rare cards from each expansion in parallel
  const allCardPromises = expansions.map(expansion => fetchCardsByExpansion(expansion.id));
  const allExpansionCards = await Promise.all(allCardPromises);
  
  // Calculate total count
  const totalCount = allExpansionCards.reduce(
    (total, expansionCards) => total + expansionCards.length, 
    0
  );
  
  // Store the updated stats
  await Stats.findOneAndUpdate(
    { type: 'illustrationRareCount' },
    { 
      totalCount,
      lastUpdated: now
    },
    { upsert: true, new: true }
  );
  
  return {
    totalCount,
    collectedCount,
    lastUpdated: now
  };
}