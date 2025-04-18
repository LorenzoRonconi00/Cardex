// lib/stats.ts
import mongoose from 'mongoose';
import connectToDatabase from './db';
import { Card } from './db';
import { fetchExpansions, fetchCardsByExpansion } from '@/lib/pokemon-api';

// Define the Stats schema with support for expansion-specific card counts
const statsSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    unique: true 
  },
  totalCount: { 
    type: Number,
    default: 0
  },
  counts: {
    type: Map,
    of: Number,
    default: new Map()
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

export interface ExpansionCardStats {
  [key: string]: {
    total: number;
    collected: number;
    percentage: number;
    name: string;
  }
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

/**
 * Gets statistics for each expansion
 */
export async function getExpansionStats(userId: string): Promise<ExpansionCardStats> {
  await connectToDatabase();
  
  // Get all expansions
  const expansions = await fetchExpansions();
  
  // Initialize the stats object
  const expansionStats: ExpansionCardStats = {};
  
  // Check if we have cached expansion counts that are recent (less than 1 day old)
  const cachedStats = await Stats.findOne({ type: 'expansionCardCounts' });
  const now = new Date();
  let expansionCardCounts: Record<string, number> = {};
  
  // If we have recent stats, use them
  if (cachedStats && 
      now.getTime() - new Date(cachedStats.lastUpdated).getTime() < 24 * 60 * 60 * 1000) {
    expansionCardCounts = cachedStats.counts?.toObject() || {};
  } else {
    // No recent stats, calculate card counts for each expansion
    for (const expansion of expansions) {
      const expansionCards = await fetchCardsByExpansion(expansion.id);
      expansionCardCounts[expansion.slug] = expansionCards.length;
    }
    
    // Store the updated counts
    await Stats.findOneAndUpdate(
      { type: 'expansionCardCounts' },
      { 
        counts: expansionCardCounts,
        lastUpdated: now
      },
      { upsert: true, new: true }
    );
  }
  
  // Get all collected cards for this user in a single query
  const collectedCards = await Card.find({ 
    userId: userId,
    isCollected: true
  }).lean();
  
  // Group collected cards by expansion
  const collectedByExpansion: Record<string, number> = {};
  
  collectedCards.forEach(card => {
    const expansionSlug = card.expansion;
    if (!collectedByExpansion[expansionSlug]) {
      collectedByExpansion[expansionSlug] = 0;
    }
    collectedByExpansion[expansionSlug]++;
  });
  
  // Calculate stats for each expansion
  for (const expansion of expansions) {
    const total = expansionCardCounts[expansion.slug] || 0;
    const collected = collectedByExpansion[expansion.slug] || 0;
    const percentage = total > 0 ? Math.round((collected / total) * 100) : 0;
    
    expansionStats[expansion.slug] = {
      total,
      collected,
      percentage,
      name: expansion.name
    };
  }
  
  return expansionStats;
}