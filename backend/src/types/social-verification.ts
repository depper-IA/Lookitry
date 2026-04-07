/**
 * Social Verification Types
 * 
 * Interfaces para verificación de presencia social de leads
 * Instagram y TikTok requieren extracción desde website o APIs de terceros
 */

export interface WebsiteVerification {
  verified: boolean;
  isFashion: boolean;
  contentPreview?: string;
  keywordsFound?: string[];
  checkedAt: string;
}

export interface InstagramVerification {
  handleFound: string | null;      // @handle extraído del website
  urlVerified: boolean;            // El link funciona (HTTP check)
  formatValid: boolean;            // Formato correcto de handle Instagram
  url?: string;                    // URL completa si se encontró
  handleSource?: 'website' | 'excel' | 'manual' | null;
}

export interface TikTokVerification {
  handleFound: string | null;
  urlVerified: boolean;
  formatValid: boolean;
  url?: string;
  handleSource?: 'website' | 'excel' | 'manual' | null;
}

export interface SocialVerification {
  leadId: string;
  
  // Website análisis
  website: WebsiteVerification;
  
  // Instagram
  instagram: InstagramVerification;
  
  // TikTok
  tiktok: TikTokVerification;
  
  // Scores y status
  socialVerificationStatus: 'verified' | 'partial' | 'unverified';
  overallFashionScore: number;     // 0-100
  verifiedAt: string;
  
  // Metadata
  enrichmentSource: 'website_extraction' | 'api_enrichment' | 'manual';
}

export interface SocialVerificationResult {
  success: boolean;
  leadId: string;
  verification: SocialVerification;
  error?: string;
}

// Patterns para extraer handles de redes sociales
export const SOCIAL_PATTERNS = {
  instagram: {
    // Handle de Instagram (@username)
    handlePattern: /@[a-zA-Z0-9._]{1,30}\b/g,
    // URLs de Instagram
    urlPatterns: [
      /instagram\.com\/([a-zA-Z0-9._]{1,30})/gi,
      /instagr\.am\/([a-zA-Z0-9._]{1,30})/gi,
    ],
    // Validación de formato handle
    validateHandle: (handle: string): boolean => {
      const cleanHandle = handle.replace('@', '');
      return /^[a-zA-Z0-9._]{1,30}$/.test(cleanHandle) && 
             !cleanHandle.includes('..') &&
             !cleanHandle.startsWith('.') &&
             !cleanHandle.endsWith('.');
    },
  },
  tiktok: {
    // TikTok handles (@username)
    handlePattern: /@[a-zA-Z0-9_-]{1,40}\b/g,
    // URLs de TikTok
    urlPatterns: [
      /tiktok\.com\/@([a-zA-Z0-9_-]{1,40})/gi,
      /vm\.tiktok\.com\/([a-zA-Z0-9_-]{1,40})/gi,
    ],
    // Validación
    validateHandle: (handle: string): boolean => {
      const cleanHandle = handle.replace('@', '');
      return /^[a-zA-Z0-9_-]{1,40}$/.test(cleanHandle);
    },
  },
} as const;

// Keywords para clasificar contenido como FASHION
export const FASHION_KEYWORDS_SOCIAL = [
  'moda', 'fashion', 'ropa', 'boutique', 'estilo', 'style', 'wear',
  'clothing', 'dress', 'outfit', 'zapato', 'shoes', 'accessories',
  'jewelry', 'joyeria', 'bolso', 'bag', 'calzado', 'camisa', 'pants',
  'jeans', 'tienda', 'shop', 'store', 'collection', 'temporada',
  'designer', 'brand', 'luxury', 'vintage', 'streetwear', 'sneakers',
  'nike', 'adidas', 'zara', 'hm', 'uniqlo', 'gucci', 'prada', 'lv',
];

// Score weights para cálculo final
export const SOCIAL_SCORE_WEIGHTS = {
  websiteFashion: 0.40,      // 40% - Website clasificado como fashion
  socialHandleFound: 0.25,   // 25% - Se encontró handle de social
  socialUrlVerified: 0.15,   // 15% - La URL social funciona
  websiteContentMatch: 0.20, // 20% - Contenido del website coincide con fashion
};