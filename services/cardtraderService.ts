// services/cardtraderService.ts
import { Card } from '@/lib/types';

// Mappatura completa delle espansioni del nostro database a quelle di CardTrader
const EXPANSION_MAPPING: Record<string, { id: number; name: string; code: string }> = {
  // Scarlet & Violet Base Set
  'sv1': { id: 3239, name: 'Scarlet & Violet', code: 'svi' },
  
  // Paldea Evolved
  'sv2': { id: 3316, name: 'Paldea Evolved', code: 'pal' },
  
  // Obsidian Flames
  'sv3': { id: 3371, name: 'Obsidian Flames', code: 'obf' },
  
  // 151
  'sv3pt5': { id: 3387, name: 'Pokémon Card 151', code: 'sv2a' },
  
  // Paradox Rift
  'sv4': { id: 3468, name: 'Paradox Rift', code: 'par' },
  
  // Paldean Fates
  'sv4pt5': { id: 3561, name: 'Paldean Fates', code: 'paf' },
  
  // Twilight Masquerade
  'sv6': { id: 3674, name: 'Twilight Masquerade', code: 'twm' },
  
  // Shrouded Fable
  'sv6pt5': { id: 3763, name: 'Shrouded Fable', code: 'sfa' },
  
  // Stellar Crown
  'sv7': { id: 3787, name: 'Stellar Crown', code: 'scr' },
  
  // Surging Sparks
  'sv8': { id: 3878, name: 'Surging Sparks', code: 'ssp' },
  
  // Journey Together
  'sv9': { id: 4008, name: 'Journey Together', code: 'jtg' }
};

// Interfacce per le risposte di CardTrader
interface CardTraderExpansion {
  id: number;
  game_id: number;
  code: string;
  name: string;
}

interface CardTraderProductPrice {
  cents: number;
  currency: string;
}

interface CardTraderProductExpansion {
  id: number;
  code: string;
  name_en: string;
}

interface CardTraderProductUser {
  id: number;
  username: string;
  can_sell_via_hub: boolean;
  country_code: string;
  user_type: string;
  max_sellable_in24h_quantity: number | null;
}

interface CardTraderProductProperties {
  condition?: string;
  pokemon_language?: string;
  signed?: boolean;
  altered?: boolean;
}

export interface CardTraderProduct {
  id: number;
  blueprint_id: number;
  name_en: string;
  quantity: number;
  price: CardTraderProductPrice;
  description?: string;
  properties_hash: CardTraderProductProperties;
  expansion: CardTraderProductExpansion;
  user: CardTraderProductUser;
  graded: boolean;
  on_vacation: boolean;
  bundle_size: number;
}

type CardTraderProductsResponse = Record<string, CardTraderProduct[]>;

export class CardTraderService {
  private static readonly API_BASE_URL = 'https://api.cardtrader.com/api/v2';
  private static readonly AUTH_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJjYXJkdHJhZGVyLXByb2R1Y3Rpb24iLCJzdWIiOiJhcHA6MTQ4NjIiLCJhdWQiOiJhcHA6MTQ4NjIiLCJleHAiOjQ5MDExOTkwMzYsImp0aSI6IjMzMjRjOGJhLWQ0YmUtNDdlYS05NmMzLTJiODRjZDdiNGNiNSIsImlhdCI6MTc0NTUyNTQzNiwibmFtZSI6IkZyYW5rMzAgQXBwIDIwMjUwNDEzMTM0MTUzIn0.SnlfnwnZN5zwTFwlfqHCHdkBgXZ76j9-_vAmZ1kc0R4D2qlG4w9h7vO8nB6o3WqjhH3UVG563V3dUpIqC3A7MuKnctkjQXfFTnQoFraFY0KhHqMC3Ao5kAN6QOBe_t9_cPvCS17Elv7CBjATT_R7P8ZBPKjNg8S2nrfTAqGPfy5Q636Ic6dMhhtoEQdZBsuXCFujlAYRG5uMSOHuuvh0N8k6tyLhaH7AOq8sH3yewKOAXjsUVkLLv6DAQMc7pAFi9fEZQspEvyDRbITFxwr-5m-8ftTNS_WHaGQWyaIIASCB3x_BcBDQOIhKGXTGGcY2OXPX5fjO0uGGJ0VR1fGYHA';

  /**
   * Esegue una chiamata autenticata all'API di CardTrader
   */
  private static async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Authorization': `Bearer ${this.AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`CardTrader API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Recupera tutte le espansioni disponibili su CardTrader
   */
  static async getExpansions(): Promise<CardTraderExpansion[]> {
    return this.fetchWithAuth<CardTraderExpansion[]>('/expansions');
  }

  /**
   * Ottiene l'ID dell'espansione CardTrader corrispondente al codice dell'espansione del nostro database
   */
  static getCardTraderExpansionId(expansionCode: string): number | null {
    const mapping = EXPANSION_MAPPING[expansionCode];
    return mapping ? mapping.id : null;
  }

  /**
   * Normalizza il nome della carta per una migliore corrispondenza
   * (es. rimuove "ex", "V", "VMAX", ecc. dal nome)
   */
  private static normalizeCardName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s*ex\s*$/i, '')
      .replace(/\s*v\s*$/i, '')
      .replace(/\s*vmax\s*$/i, '')
      .replace(/\s*vstar\s*$/i, '')
      .replace(/\s*gx\s*$/i, '')
      .replace(/\s*alt art\s*/i, '')
      .replace(/\s*special art\s*/i, '')
      .replace(/\s*full art\s*/i, '')
      .replace(/\s*illustration rare\s*/i, '')
      .replace(/\s*special illustration rare\s*/i, '')
      .replace(/\s*trainer gallery\s*/i, '')
      .replace(/\s*pokemon\s*/i, '')
      .replace(/[^a-z0-9]/gi, '')
      .trim();
  }

  /**
   * Controlla se un prodotto è probabilmente una "illustration rare" o una carta speciale
   * basandosi sul nome, descrizione e altre proprietà
   */
  private static isIllustrationRare(product: CardTraderProduct): boolean {
    const nameEn = product.name_en.toLowerCase();
    const description = (product.description || '').toLowerCase();
    
    // Verifica nei nomi
    const isAltArtInName = 
      nameEn.includes('illustration rare')
    
    // Verifica nelle descrizioni
    const isAltArtInDescription = 
      description.includes('illustration rare')

    // Verifica il prezzo (le carte speciali tendono ad avere un prezzo più alto)
    // Le illustration rare solitamente hanno un prezzo più elevato rispetto alle comuni
    const hasHigherPrice = product.price.cents > 500; // 5 euro/dollari come soglia indicativa
    
    // Se il nome è esplicitamente marcato come alt art o illustration rare, ha la priorità
    if (isAltArtInName) {
      return true;
    }
    
    // Altrimenti, consideriamo la descrizione e il prezzo
    return isAltArtInDescription || hasHigherPrice;
  }

  /**
   * Cerca i prodotti in base all'ID dell'espansione
   */
  static async getProductsByExpansion(expansionId: number): Promise<CardTraderProduct[]> {
    try {
      const response = await this.fetchWithAuth<CardTraderProductsResponse>(
        `/marketplace/products?expansion_id=${expansionId}`
      );
      
      // Estrai tutti i prodotti dall'oggetto di risposta
      return Object.values(response).flat();
    } catch (error) {
      console.error('Errore nel recupero dei prodotti:', error);
      return [];
    }
  }

  /**
   * Cerca una carta specifica su CardTrader
   * @param card La carta dal nostro database
   * @returns I prodotti trovati, filtrati per quelli in condizione Near Mint, disponibili via hub e tipo "illustration rare"
   */
  static async searchCard(card: Card): Promise<CardTraderProduct[]> {
    try {
      console.log(`Ricerca carta: ${card.name} (Espansione: ${card.expansion}, Tipo: ${card.type || 'non specificato'})`);
      
      // Ottieni l'ID dell'espansione mappata
      const expansionId = this.getCardTraderExpansionId(card.expansion);
      
      if (!expansionId) {
        console.error(`Espansione non mappata: ${card.expansion}`);
        return [];
      }
      
      console.log(`ID espansione mappata: ${expansionId}`);
      
      // Recupera i prodotti per questa espansione
      const products = await this.getProductsByExpansion(expansionId);
      console.log(`Trovati ${products.length} prodotti per l'espansione`);
      
      // Normalizza il nome della carta per la ricerca
      const normalizedCardName = this.normalizeCardName(card.name);
      console.log(`Nome carta normalizzato: "${normalizedCardName}"`);
      
      // Filtra i prodotti che corrispondono al nome della carta
      const matchingProducts = products.filter(product => {
        const productNameNormalized = this.normalizeCardName(product.name_en);
        const match = productNameNormalized.includes(normalizedCardName) || 
                     normalizedCardName.includes(productNameNormalized);
        
        if (match) {
          console.log(`Corrispondenza trovata: "${product.name_en}" (${productNameNormalized})`);
        }
        
        return match;
      });
      
      console.log(`Trovate ${matchingProducts.length} carte corrispondenti al nome`);
      
      // Filtra per "illustration rare" se la carta ha questo tipo
      let filteredProducts = matchingProducts;
      if (card.type === 'illustration_rare' || card.type === 'special_illustration_rare') {
        filteredProducts = matchingProducts.filter(product => this.isIllustrationRare(product));
        console.log(`Filtrate per illustration rare: ${filteredProducts.length} carte`);
      }
      
      // Filtra solo i prodotti in condizione Near Mint e disponibili via hub
      const nearMintHubProducts = filteredProducts.filter(product => {
        const condition = product.properties_hash.condition?.toLowerCase() || '';
        const isNearMint = condition === 'near mint' || condition === 'nm' || condition === 'mint' || condition === 'mint/near mint';
        const isAvailableViaHub = product.user.can_sell_via_hub === true;
        
        return isNearMint && isAvailableViaHub;
      });
      
      console.log(`Trovate ${nearMintHubProducts.length} carte in condizione Near Mint e disponibili via hub`);
      
      // Ordina per prezzo (dal più basso al più alto)
      return nearMintHubProducts.sort((a, b) => a.price.cents - b.price.cents);
    } catch (error) {
      console.error('Errore nella ricerca della carta su CardTrader:', error);
      return [];
    }
  }

  /**
   * Trova il miglior prezzo per una carta specifica
   * @param card La carta dal nostro database
   * @returns Il prodotto con il prezzo migliore (più basso) in condizione Near Mint disponibile via hub
   */
  static async findBestPrice(card: Card): Promise<CardTraderProduct | null> {
    // Otteniamo tutti i prodotti corrispondenti, già filtrati e ordinati
    const products = await this.searchCard(card);
    
    // Prendiamo solo il primo risultato (il più economico)
    return products.length > 0 ? products[0] : null;
  }
}

export default CardTraderService;