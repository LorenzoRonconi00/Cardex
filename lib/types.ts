// Types for our application

export interface Card {
  id: string;
  name: string;
  imageUrl: string;
  expansion: string;
  isCollected: boolean;
  dateCollected?: Date;
  type?: string;
}

export interface Expansion {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  releaseDate?: string;
}

export interface CardUpdatePayload {
  id: string;
  isCollected: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pokémon TCG API related types
export interface PokemonTCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  level?: string;
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  abilities?: {
    name: string;
    text: string;
    type: string;
  }[];
  attacks?: {
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }[];
  weaknesses?: {
    type: string;
    value: string;
  }[];
  resistances?: {
    type: string;
    value: string;
  }[];
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    legalities: Record<string, string>;
    ptcgoCode?: string;
    releaseDate: string;
    updatedAt: string;
    images: {
      symbol: string;
      logo: string;
    };
  };
  number: string;
  artist?: string;
  rarity: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities: Record<string, string>;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices: Record<string, {
      low: number;
      mid: number;
      high: number;
      market: number;
      directLow: number;
    }>;
  };
  cardmarket?: {
    url: string;
    updatedAt: string;
    prices: Record<string, number>;
  };
}

export interface PokemonTCGSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities: Record<string, string>;
  ptcgoCode?: string;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}

export interface Binder {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt?: Date;
}

// Filter options for Alt Art cards
export const ALT_ART_IDENTIFIERS = [
  'Alternate Art', 
  'Alt Art', 
  'Special Illustration', 
  'Illustration Rare',
  'SAR', 
  'SIR',
  'AR', 
  'TG',
  'Trainer Gallery',
  'Full Art',
  'Secret Rare',
  'Ultra Rare'
];