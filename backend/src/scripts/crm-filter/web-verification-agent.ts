/**
 * Web Verification Agent
 * 
 * Uses CheerioCrawler (Crawlee) to scrape websites and verify
 * if they are fashion/ apparel related businesses.
 * 
 * This is a LOCAL agent that runs without Apify cloud.
 * For production with higher volume, use Apify MCP.
 */

import { CheerioCrawler, type CheerioCrawlingContext } from 'crawlee';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

interface VerificationResult {
  url: string;
  isFashion: boolean | null;
  reason: string;
  title?: string;
  description?: string;
  keywordsFound: string[];
  screenshot?: string;
  error?: string;
  responseTime: number;
}

// Fashion keywords to look for in website content
const FASHION_CONTENT_KEYWORDS = [
  // Products
  'ropa', 'vestido', 'camisa', 'pantalon', 'blusa', 'falda', 'short',
  'zapato', 'calzado', 'tenis', 'sandal', 'bota', 'botin', 'zapatilla',
  'bolso', 'cartera', 'morral', 'mochila', 'accesorios', 'joyeria',
  'collar', 'arete', 'pulcera', 'anillo', 'reloj', 'gafas', 'lentes',
  'perfume', 'cosmetico', 'maquillaje', 'labial', 'base', 'polvo',
  // Services
  'boutique', 'tienda', 'shop', 'store', 'fashion', 'moda', 'style',
  'look', 'outfit', 'trend', 'coleccion', 'temporada', 'designer',
  'brand', 'marca', 'label', 'apparel', 'clothing', 'garment', 'wear',
  // Categories
  'mujer', 'hombre', 'nina', 'nino', 'bebe', 'infantil', 'juvenil',
  'adulto', 'senor', 'senora', 'caballero', 'dama', 'unisex',
  // Materials
  'cuero', 'piel', 'seda', 'algodon', 'lino', 'denim', 'jean', 'poliester',
  'lana', 'cashmere', 'viscosa', 'nylon', 'spandex', 'elastano',
  // Actions
  'comprar', 'compras', 'tienda online', 'envio', 'envios', 'domicilio',
  'catalogo', 'coleccion', 'nuevo', 'nueva', 'oferta', 'descuento', 'sale',
  'buy', 'shop', 'cart', 'checkout', 'payment', 'shipping',
];

// Keywords that suggest NOT fashion
const NO_FASHION_CONTENT = [
  'restaurant', 'cafe', 'bar', 'food', 'comida', 'restaurante',
  'dentista', 'doctor', 'medico', 'hospital', 'clinica', 'pharmacy',
  'gym', 'gimnasio', 'fitness', 'gymnasium', 'sport', 'deporte',
  'bank', 'banco', 'finance', 'finanza', 'accounting', 'contable',
  'real estate', 'inmueble', 'casa', 'apartamento', 'property',
  'hotel', 'hostel', 'tourism', 'turismo', 'travel', 'viaje',
  'auto', 'car', 'vehiculo', 'mecanico', 'repair', 'taller',
  'hardware', 'ferreteria', 'tools', 'herramientas', 'construction',
  'software', 'technology', 'tech', 'informatica', 'computer',
];

class WebVerificationAgent {
  private crawler: CheerioCrawler;
  private processedUrls: Set<string> = new Set();
  
  constructor() {
    this.crawler = new CheerioCrawler({
      maxConcurrency: 3,
      maxRequestRetries: 1,
      requestTimeoutSecs: 15,
      
      // Don't use proxy for local development (cost saving)
      proxyConfiguration: undefined,
      
      async requestHandler({ page, request }: CheerioCrawlingContext) {
        const startTime = Date.now();
        
        // Get page title
        const title = await page.title();
        
        // Get meta description
        const description = await page.$eval(
          'meta[name="description"]', 
          (el) => el.getAttribute('content') || ''
        ).catch(() => '');
        
        // Get all text content from body
        const bodyText = await page.$eval('body', (el) => el.innerText).catch(() => '');
        
        // Also get meta keywords if available
        const metaKeywords = await page.$eval(
          'meta[name="keywords"]',
          (el) => el.getAttribute('content') || ''
        ).catch(() => '');
        
        // Combine all text for analysis
        const fullText = `${title} ${description} ${bodyText} ${metaKeywords}`.toLowerCase();
        
        return {
          title,
          description,
          fullText,
          responseTime: Date.now() - startTime,
        };
      },
    });
  }
  
  /**
   * Check if URL is valid and accessible
   */
  private isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  /**
   * Normalize URL (add https if missing)
   */
  private normalizeUrl(urlString: string): string {
    urlString = urlString.trim();
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }
    return urlString;
  }
  
  /**
   * Analyze website content for fashion relevance
   */
  private analyzeContent(title: string, description: string, fullText: string): {
    isFashion: boolean | null;
    reason: string;
    keywordsFound: string[];
  } {
    const lowerText = fullText.toLowerCase();
    
    // Count fashion keywords found
    const fashionKeywordsFound = FASHION_CONTENT_KEYWORDS.filter(kw => 
      lowerText.includes(kw.toLowerCase())
    );
    
    // Count no-fashion keywords
    const noFashionFound = NO_FASHION_CONTENT.filter(kw =>
      lowerText.includes(kw.toLowerCase())
    );
    
    // Decision logic
    if (noFashionFound.length > 0 && fashionKeywordsFound.length === 0) {
      return {
        isFashion: false,
        reason: `No-fashion content detected: ${noFashionFound.slice(0, 3).join(', ')}`,
        keywordsFound: [],
      };
    }
    
    if (fashionKeywordsFound.length >= 2) {
      return {
        isFashion: true,
        reason: `Fashion content confirmed. Keywords: ${fashionKeywordsFound.slice(0, 5).join(', ')}`,
        keywordsFound: fashionKeywordsFound,
      };
    }
    
    if (fashionKeywordsFound.length === 1) {
      return {
        isFashion: null, // Uncertain
        reason: `Single fashion keyword found: ${fashionKeywordsFound[0]}`,
        keywordsFound: fashionKeywordsFound,
      };
    }
    
    return {
      isFashion: null,
      reason: 'No clear fashion indicators found',
      keywordsFound: [],
    };
  }
  
  /**
   * Verify a single website
   */
  async verifyWebsite(url: string): Promise<VerificationResult> {
    const startTime = Date.now();
    
    // Normalize and validate URL
    const normalizedUrl = this.normalizeUrl(url);
    
    if (!this.isValidUrl(normalizedUrl)) {
      return {
        url,
        isFashion: null,
        reason: 'Invalid URL format',
        error: 'Invalid URL',
        responseTime: 0,
        keywordsFound: [],
      };
    }
    
    // Skip if already processed
    if (this.processedUrls.has(normalizedUrl)) {
      return {
        url,
        isFashion: null,
        reason: 'URL already processed in this session',
        error: 'Duplicate URL',
        responseTime: 0,
        keywordsFound: [],
      };
    }
    
    this.processedUrls.add(normalizedUrl);
    
    try {
      const result = await this.crawler.run([normalizedUrl]);
      
      // Get the first result (if any)
      const pageResult = result?.results?.[0];
      
      if (!pageResult || pageResult.error) {
        return {
          url,
          isFashion: null,
          reason: 'Failed to fetch website',
          error: pageResult?.error?.message || 'Unknown error',
          responseTime: Date.now() - startTime,
          keywordsFound: [],
        };
      }
      
      const data = pageResult.data as {
        title?: string;
        description?: string;
        fullText?: string;
        responseTime?: number;
      };
      
      const analysis = this.analyzeContent(
        data.title || '',
        data.description || '',
        data.fullText || ''
      );
      
      return {
        url: normalizedUrl,
        isFashion: analysis.isFashion,
        reason: analysis.reason,
        title: data.title,
        description: data.description,
        keywordsFound: analysis.keywordsFound,
        responseTime: data.responseTime || (Date.now() - startTime),
      };
    } catch (error) {
      return {
        url,
        isFashion: null,
        reason: 'Exception during scraping',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        keywordsFound: [],
      };
    }
  }
  
  /**
   * Verify multiple websites in batch
   */
  async verifyBatch(urls: string[], onProgress?: (current: number, total: number, result: VerificationResult) => void): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    
    for (let i = 0; i < urls.length; i++) {
      const result = await this.verifyWebsite(urls[i]);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, urls.length, result);
      }
      
      // Rate limiting - be nice to servers
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
  
  /**
   * Quick health check for a URL (just checks if it responds)
   */
  async quickCheck(url: string): Promise<{ isReachable: boolean; statusCode?: number }> {
    const normalizedUrl = this.normalizeUrl(url);
    
    return new Promise((resolve) => {
      const protocol = normalizedUrl.startsWith('https') ? https : http;
      
      const req = protocol.get(normalizedUrl, { timeout: 5000 }, (res) => {
        resolve({ isReachable: true, statusCode: res.statusCode });
      });
      
      req.on('error', () => {
        resolve({ isReachable: false });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ isReachable: false });
      });
    });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
ð¯ Web Verification Agent for Lookitry CRM

Usage:
  npx ts-node src/scripts/crm-filter/web-verification-agent.ts <url>
  npx ts-node src/scripts/crm-filter/web-verification-agent.ts --batch <file.txt>
  npx ts-node src/scripts/crm-filter/web-verification-agent.ts --check <url>

Examples:
  npx ts-node src/scripts/crm-filter/web-verification-agent.ts https://example.com/boutique
  cat urls.txt | npx ts-node src/scripts/crm-filter/web-verification-agent.ts --batch
`);
    process.exit(0);
  }
  
  const agent = new WebVerificationAgent();
  
  if (args[0] === '--check') {
    // Quick health check
    const result = await agent.quickCheck(args[1]);
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === '--batch') {
    // Batch mode - read URLs from stdin
    const urls: string[] = [];
    
    process.stdin.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      urls.push(...lines.filter(l => l.trim()));
    });
    
    process.stdin.on('end', async () => {
      console.log(`\nð Verifying ${urls.length} URLs...\n`);
      
      const results = await agent.verifyBatch(urls, (current, total, result) => {
        const icon = result.isFashion === true ? 'â' : result.isFashion === false ? 'â' : 'â ï¸';
        console.log(`[${current}/${total}] ${icon} ${result.url}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        } else {
          console.log(`   ${result.reason}`);
        }
      });
      
      console.log('\nð SUMMARY:');
      const accepted = results.filter(r => r.isFashion === true).length;
      const rejected = results.filter(r => r.isFashion === false).length;
      const uncertain = results.filter(r => r.isFashion === null).length;
      
      console.log(`   â Accepted: ${accepted}`);
      console.log(`   â Rejected: ${rejected}`);
      console.log(`   â ï¸  Uncertain: ${uncertain}`);
    });
  } else {
    // Single URL verification
    const result = await agent.verifyWebsite(args[0]);
    console.log('\nð VERIFICATION RESULT:');
    console.log('ââââââââââââââââââââââââââââââââââââââââ');
    console.log(`URL:       ${result.url}`);
    console.log(`Status:    ${result.isFashion === true ? 'â FASHION' : result.isFashion === false ? 'â NOT FASHION' : 'â ï¸ UNCERTAIN'}`);
    console.log(`Reason:    ${result.reason}`);
    if (result.title) console.log(`Title:     ${result.title}`);
    if (result.keywordsFound.length) console.log(`Keywords:  ${result.keywordsFound.join(', ')}`);
    if (result.error) console.log(`Error:     ${result.error}`);
    console.log(`Response:  ${result.responseTime}ms`);
  }
}

export { WebVerificationAgent, type VerificationResult };
export default WebVerificationAgent;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
