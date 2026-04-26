/**

 * Lead Enrichment Service

 * 

 * Handles:

 * - Import leads from Excel CRM

 * - Batch classification/enrichment

 * - Website verification

 * - Social media verification (Instagram, TikTok)

 * - Integration with Supabase leads table

 */



import { supabaseAdmin } from '../config/supabase';

import { leadService, type Lead } from './lead.service';

import * as XLSX from 'xlsx';

import * as fs from 'fs';

import * as path from 'path';

import https from 'https';

import http from 'http';

import {

  type SocialVerification,

  type WebsiteVerification,

  type InstagramVerification,

  type TikTokVerification,

  SOCIAL_PATTERNS,

  FASHION_KEYWORDS_SOCIAL,

  SOCIAL_SCORE_WEIGHTS,

} from '../types/social-verification';



interface CRMLead {

  ID: number;

  NOMBRE_EMPRESA: string;

  NOMBRE_MARCA: string;

  NOMBRE_CONTACTO: string;

  EMAIL: string;

  TELEFONO: string;

  NICHO: string;

  CIUDAD: string;

  DIRECCION: string;

  REDES_SOCIALES: string;

  SITIO_WEB: string;

  CAMPAÑA_ENVIADA: string;

  FECHA_CAMPAÑA: string;

  ESTADO_LEAD: string;

  ULTIMO_CONTACTO: string;

  NOTAS: string;

  FUENTE: string;

}



export interface ImportResult {

  success: boolean;

  totalProcessed: number;

  imported: number;

  duplicates: number;

  errors: number;

  details: string[];

}



export interface ClassificationResult {

  leadId: string;

  isFashion: boolean | null;

  reason: string;

  confidence: 'high' | 'medium' | 'low';

}



export interface EnrichmentResult {

  processed: number;

  successful: number;

  failed: number;

  results: ClassificationResult[];

}



// Keywords for fashion classification

const FASHION_KEYWORDS = [

  'ropa', 'boutique', 'moda', 'fashion', 'zapato', 'calzado', 'dress', 'clothes',

  'apparel', 'accesorios', 'jewelry', 'joyeria', 'reloj', 'tienda ropa',

  'sport', 'deportivo', 'lenceria', 'ropa intima', 'shoes', 'footwear', 'bag',

  'bolso', 'optic', 'eyewear', 'perfume', 'cosmetico', 'beauty', 'cosmetic',

  'skin', 'barber', 'barbershop', 'nail', 'manicure', 'pedicure', 'estetica',

  'pijama', 'sweater', 'camisa', 'pantalon', 'jean', 'camiseta', 'morral',

  'cartera', 'billetera', 'tenis', 'sandal', 'accessories', 'wear', 'outfit',

  'style', 'trend', 'coleccion', 'temporada', 'clothing', 'shop', 'store',

  'designer', 'brand', 'luxury', 'vintage', 'activewear', 'swimwear',

  'underwear', 'lingerie', 'swimwear', 'leather', 'denim', 'silk', 'cotton',

];



const NO_FASHION_KEYWORDS = [

  'supermercado', 'bar', 'restaurant', 'cafe', 'dentista', 'constructor',

  'gimnasio', 'gym', 'farmacia', 'hotel', 'inmueble', 'vehiculo', 'auto',

  'mueble', 'cocina', 'electro', 'tecnologia', 'computador', 'lacteos',

  'alimentos', 'banco', 'finca', 'agricola', 'veterinaria', 'mascota',

  'jugueteria', 'papeleria', 'oficina', 'industrial', 'mecanica', 'taller',

  'gasolinera', 'discoteca', 'cerveza', 'licor', 'software', 'it', 'internet',

  'supermarket', 'grocery', 'pharmacy', 'hospital', 'medical', 'bank',

  'real estate', 'construction', 'automotive', 'restaurant', 'bar', 'pub',

];



function detectCountry(city: string): string {

  if (!city) return 'UNKNOWN';

  

  const cityLower = city.toLowerCase();

  const colombianCities = ['bogota', 'bogotá', 'medellin', 'medellín', 'cali', 'barranquilla', 'cartagena', 'bucaramanga', 'pereira', 'manizales', 'ibague', ' Armenia', 'neiva', 'santa marta', 'villavicencio', 'pasto', 'cartago', 'tunja', 'florencia', 'popayan', 'valledupar', 'monteria', 'sincelejo'];

  const usaCities = ['new york', 'los angeles', 'miami', 'orlando', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville'];

  const spainCities = ['madrid', 'barcelona', 'valencia', 'seville', 'sevilla', 'bilbao', 'malaga', 'murcia', 'cadiz', 'palma', 'vigo', 'granada'];

  

  if (colombianCities.some(c => cityLower.includes(c))) return 'CO';

  if (usaCities.some(c => cityLower.includes(c))) return 'US';

  if (spainCities.some(c => cityLower.includes(c))) return 'ES';

  

  return 'UNKNOWN';

}



function classifyByKeywords(nombreEmpresa: string, nicho: string, notas: string): {

  isFashion: boolean | null;

  reason: string;

  confidence: 'high' | 'medium' | 'low';

} {

  const searchText = `${nombreEmpresa} ${nicho} ${notas}`.toLowerCase();

  

  // Check NO_FASHION first

  for (const keyword of NO_FASHION_KEYWORDS) {

    if (searchText.includes(keyword.toLowerCase())) {

      return {

        isFashion: false,

        reason: `Rechazado: keyword no-fashion "${keyword}"`,

        confidence: 'high',

      };

    }

  }

  

  // Check FASHION keywords

  for (const keyword of FASHION_KEYWORDS) {

    if (searchText.includes(keyword.toLowerCase())) {

      return {

        isFashion: true,

        reason: `Aceptado: keyword fashion "${keyword}"`,

        confidence: 'high',

      };

    }

  }

  

  return {

    isFashion: null,

    reason: 'Sin keywords claras - requiere verificacion web',

    confidence: 'low',

  };

}



export class LeadEnrichmentService {

  /**

   * Import leads from CRM Excel file

   */

  async importFromCRMExcel(filePath: string): Promise<ImportResult> {

    const result: ImportResult = {

      success: false,

      totalProcessed: 0,

      imported: 0,

      duplicates: 0,

      errors: 0,

      details: [],

    };

    

    try {

      // Read Excel

      if (!fs.existsSync(filePath)) {

        throw new Error(`Excel file not found: ${filePath}`);

      }

      

      const workbook = XLSX.readFile(filePath);

      const sheetName = workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];

      const crmLeads: CRMLead[] = XLSX.utils.sheet_to_json(worksheet);

      

      result.totalProcessed = crmLeads.length;

      result.details.push(`Loaded ${crmLeads.length} records from Excel`);

      

      // Process in batches of 50

      const batchSize = 50;

      for (let i = 0; i < crmLeads.length; i += batchSize) {

        const batch = crmLeads.slice(i, i + batchSize);

        const leadsToInsert = batch.map(lead => {

          const classification = classifyByKeywords(

            lead.NOMBRE_EMPRESA,

            lead.NICHO,

            lead.NOTAS

          );

          

          const leadData: Record<string, unknown> = {

            name: lead.NOMBRE_CONTACTO || lead.NOMBRE_MARCA || lead.NOMBRE_EMPRESA,

            business_type: lead.NICHO || 'unknown',

            source: 'crm_import',

            source_id: `crm_${lead.ID}`,

            status: 'new',

            country: detectCountry(lead.CIUDAD),

          };



          // Optional fields - only add if they have values

          if (lead.EMAIL) leadData.email = lead.EMAIL;

          if (lead.TELEFONO) leadData.phone = lead.TELEFONO;

          if (lead.SITIO_WEB) leadData.website = lead.SITIO_WEB;

          if (lead.DIRECCION) leadData.address = lead.DIRECCION;

          if (lead.CIUDAD) leadData.city = lead.CIUDAD;

          if (lead.NOTAS) leadData.notes = lead.NOTAS;



          // Enrichment fields

          leadData.internal_notes = `Clasificado: ${classification.reason}`;

          leadData.is_fashion_relevant = classification.isFashion;

          leadData.enrichment_source = classification.isFashion !== null ? 'keyword_classification' : 'pending_verification';

          leadData.website_verified = false;

          if (classification.isFashion === true && lead.NICHO) {

            leadData.business_type_confirmed = lead.NICHO;

          }

          leadData.last_enriched_at = new Date().toISOString();

          leadData.enrichment_score = classification.isFashion === true ? 50 : classification.isFashion === false ? 0 : 25;



          return leadData as Partial<Lead>;

        }).filter(lead => lead.is_fashion_relevant !== false); // Exclude rejected

        

        try {

          const batchResult = await leadService.createLeadsBatch(leadsToInsert);

          result.imported += batchResult.inserted;

          result.duplicates += batchResult.duplicates;

        } catch (err) {

          result.errors += batch.length;

          result.details.push(`Batch ${i}-${i + batch.length} error: ${err}`);

        }

        

        // Progress update

        if ((i + batchSize) % 500 === 0 || i + batchSize >= crmLeads.length) {

          result.details.push(`Progress: ${Math.min(i + batchSize, crmLeads.length)}/${crmLeads.length}`);

        }

      }

      

      result.success = true;

      result.details.push(`Import completed: ${result.imported} imported, ${result.duplicates} duplicates, ${result.errors} errors`);

      

    } catch (error) {

      result.details.push(`Fatal error: ${error}`);

      result.success = false;

    }

    

    return result;

  }

  

  /**

   * Classify a single lead by its ID

   */

  async classifyLead(leadId: string): Promise<ClassificationResult> {

    const lead = await leadService.getLeadById(leadId);

    

    if (!lead) {

      throw new Error(`Lead not found: ${leadId}`);

    }

    

    const classification = classifyByKeywords(

      lead.name || '',

      lead.business_type || '',

      lead.notes || ''

    );

    

    // Update the lead with classification results

    await supabaseAdmin

      .from('leads')

      .update({

        is_fashion_relevant: classification.isFashion,

        enrichment_source: classification.isFashion !== null ? 'keyword_classification' : 'pending_verification',

        business_type_confirmed: classification.isFashion === true ? lead.business_type : null,

        last_enriched_at: new Date().toISOString(),

        enrichment_score: classification.isFashion === true ? 50 : classification.isFashion === false ? 0 : 25,

      })

      .eq('id', leadId);

    

    return {

      leadId,

      ...classification,

    };

  }

  

  /**

   * Enrich all pending leads (those with is_fashion_relevant = null)

   */

  async enrichPendingLeads(batchSize: number = 100): Promise<EnrichmentResult> {

    const result: EnrichmentResult = {

      processed: 0,

      successful: 0,

      failed: 0,

      results: [],

    };

    

    // Get pending leads (those needing verification)

    const { data: pendingLeads, error } = await supabaseAdmin

      .from('leads')

      .select('id, name, business_type, website, notes')

      .is('is_fashion_relevant', null)

      .limit(batchSize);

    

    if (error) {

      throw new Error(`Failed to fetch pending leads: ${error.message}`);

    }

    

    if (!pendingLeads || pendingLeads.length === 0) {

      result.results.push({

        leadId: 'none',

        isFashion: true,

        reason: 'No pending leads found',

        confidence: 'high',

      });

      return result;

    }

    

    for (const lead of pendingLeads) {

      try {

        const classification = await this.classifyLead(lead.id);

        result.results.push(classification);

        result.successful++;

      } catch (err) {

        result.results.push({

          leadId: lead.id,

          isFashion: null,

          reason: `Error: ${err}`,

          confidence: 'low',

        });

        result.failed++;

      }

      result.processed++;

      

      // Rate limiting

      await new Promise(resolve => setTimeout(resolve, 100));

    }

    

    return result;

  }

  

  /**

   * Get enrichment statistics

   */

  async getEnrichmentStats(): Promise<Record<string, number>> {

    const { data, error } = await supabaseAdmin

      .from('leads')

      .select('is_fashion_relevant, enrichment_source');

    

    if (error) {

      throw new Error(`Failed to get stats: ${error.message}`);

    }

    

    const stats = {

      total: (data || []).length,

      fashion_relevant: 0,

      not_fashion: 0,

      pending_verification: 0,

      by_keyword: 0,

      by_web_verification: 0,

      by_ai: 0,

    };

    

    for (const lead of data || []) {

      if (lead.is_fashion_relevant === true) {

        stats.fashion_relevant++;

      } else if (lead.is_fashion_relevant === false) {

        stats.not_fashion++;

      } else {

        stats.pending_verification++;

      }

      

      if (lead.enrichment_source === 'keyword_classification') {

        stats.by_keyword++;

      } else if (lead.enrichment_source === 'web_verification') {

        stats.by_web_verification++;

      } else if (lead.enrichment_source === 'ai_classification') {

        stats.by_ai++;

      }

    }

    

    return stats;

  }

  

  /**

   * Mark leads as verified via website content analysis

   */

  async markWebsiteVerified(leadId: string, isFashion: boolean, keywordsFound: string[]): Promise<void> {

    await supabaseAdmin

      .from('leads')

      .update({

        is_fashion_relevant: isFashion,

        enrichment_source: 'web_verification',

        website_verified: true,

        business_type_confirmed: isFashion ? 'fashion' : null,

        last_enriched_at: new Date().toISOString(),

        enrichment_score: isFashion ? 80 : 0,

        website_content: keywordsFound.join(', '),

      })

      .eq('id', leadId);

  }

  

  /**

   * Delete non-fashion leads (cleanup)

   */

  async deleteNonFashionLeads(): Promise<number> {

    const { data, error } = await supabaseAdmin

      .from('leads')

      .delete()

      .eq('is_fashion_relevant', false)

      .eq('status', 'new') // Only delete new leads

      .select('id');

    

    if (error) {

      throw new Error(`Failed to delete non-fashion leads: ${error.message}`);

    }

    

    return (data || []).length;

  }



  // =====================

  // SOCIAL VERIFICATION METHODS

  // =====================



  /**

   * Verify social media presence for a lead (website, Instagram, TikTok)

   */

  async verifySocialHandles(leadId: string): Promise<SocialVerification> {

    const lead = await leadService.getLeadById(leadId);

    

    if (!lead) {

      throw new Error(`Lead not found: ${leadId}`);

    }



    // Initialize verification objects

    const websiteVerification = await this.verifyWebsiteFashion(lead.website || '');

    const instagramVerification = await this.extractInstagramHandle(lead);

    const tiktokVerification = await this.extractTikTokHandle(lead);



    // Calculate overall social fashion score

    let overallScore = 0;

    if (websiteVerification.isFashion) {

      overallScore += SOCIAL_SCORE_WEIGHTS.websiteFashion * 100;

    }

    if (instagramVerification.handleFound) {

      overallScore += SOCIAL_SCORE_WEIGHTS.socialHandleFound * 100;

    }

    if (instagramVerification.urlVerified) {

      overallScore += SOCIAL_SCORE_WEIGHTS.socialUrlVerified * 50;

    }

    if (tiktokVerification.handleFound) {

      overallScore += SOCIAL_SCORE_WEIGHTS.socialHandleFound * 100;

    }

    if (tiktokVerification.urlVerified) {

      overallScore += SOCIAL_SCORE_WEIGHTS.socialUrlVerified * 50;

    }



    // Determine verification status

    let status: 'verified' | 'partial' | 'unverified' = 'unverified';

    if (instagramVerification.handleFound && tiktokVerification.handleFound && websiteVerification.verified) {

      status = 'verified';

    } else if (instagramVerification.handleFound || tiktokVerification.handleFound) {

      status = 'partial';

    }



    const verification: SocialVerification = {

      leadId,

      website: websiteVerification,

      instagram: instagramVerification,

      tiktok: tiktokVerification,

      socialVerificationStatus: status,

      overallFashionScore: Math.min(100, overallScore),

      verifiedAt: new Date().toISOString(),

      enrichmentSource: 'website_extraction',

    };



    // Update lead with social verification data

    await this.updateLeadSocialData(leadId, verification);



    return verification;

  }



  /**

   * Verify website content and classify as fashion/not-fashion

   */

  private async verifyWebsiteFashion(websiteUrl: string): Promise<WebsiteVerification> {

    if (!websiteUrl) {

      return {

        verified: false,

        isFashion: false,

        checkedAt: new Date().toISOString(),

      };

    }



    try {

      const content = await this.fetchWebsiteContent(websiteUrl);

      if (!content) {

        return {

          verified: false,

          isFashion: false,

          checkedAt: new Date().toISOString(),

        };

      }



      const contentLower = content.toLowerCase();

      const keywordsFound: string[] = [];

      

      for (const keyword of FASHION_KEYWORDS_SOCIAL) {

        if (contentLower.includes(keyword)) {

          keywordsFound.push(keyword);

        }

      }



      const isFashion = keywordsFound.length >= 2;



      return {

        verified: true,

        isFashion,

        contentPreview: content.substring(0, 500),

        keywordsFound,

        checkedAt: new Date().toISOString(),

      };

    } catch (error) {

      return {

        verified: false,

        isFashion: false,

        checkedAt: new Date().toISOString(),

      };

    }

  }



  /**

   * Extract Instagram handle from lead's website or existing data

   */

  private async extractInstagramHandle(lead: Lead): Promise<InstagramVerification> {

    let handleFound: string | null = null;

    let urlVerified = false;



    // First check if lead already has Instagram stored

    if (lead.instagram) {

      handleFound = lead.instagram.startsWith('@') ? lead.instagram : `@${lead.instagram}`;

    }



    // Try to extract from website

    if (lead.website && !handleFound) {

      try {

        const content = await this.fetchWebsiteContent(lead.website);

        if (content) {

          // Search for Instagram URLs

          for (const pattern of SOCIAL_PATTERNS.instagram.urlPatterns) {

            const matches = content.match(pattern);

            if (matches && matches.length > 0) {

              const username = matches[0].replace(/https?:\/\/(www\.)?instagram\.com\//gi, '').replace(/\/.*$/, '');

              if (username && SOCIAL_PATTERNS.instagram.validateHandle(username)) {

                handleFound = username.startsWith('@') ? username : `@${username}`;

                break;

              }

            }

          }



          // If no URL found, search for @mentions

          if (!handleFound) {

            const mentions = content.match(SOCIAL_PATTERNS.instagram.handlePattern);

            if (mentions && mentions.length > 0) {

              const cleanHandle = mentions[0].replace('@', '');

              if (SOCIAL_PATTERNS.instagram.validateHandle(cleanHandle)) {

                handleFound = `@${cleanHandle}`;

              }

            }

          }

        }

      } catch {

        // Continue without Instagram extraction

      }

    }



    // Verify URL if we found a handle

    if (handleFound) {

      const cleanHandle = handleFound.replace('@', '');

      urlVerified = await this.verifySocialUrl(`https://www.instagram.com/${cleanHandle}/`);

    }



    return {

      handleFound,

      urlVerified,

      formatValid: handleFound ? SOCIAL_PATTERNS.instagram.validateHandle(handleFound.replace('@', '')) : false,

      handleSource: lead.instagram ? 'excel' : handleFound ? 'website' : null,

    };

  }



  /**

   * Extract TikTok handle from lead's website or existing data

   */

  private async extractTikTokHandle(lead: Lead): Promise<TikTokVerification> {

    let handleFound: string | null = null;

    let urlVerified = false;



    // First check if lead already has TikTok stored

    if (lead.tiktok) {

      handleFound = lead.tiktok.startsWith('@') ? lead.tiktok : `@${lead.tiktok}`;

    }



    // Try to extract from website

    if (lead.website && !handleFound) {

      try {

        const content = await this.fetchWebsiteContent(lead.website);

        if (content) {

          // Search for TikTok URLs

          for (const pattern of SOCIAL_PATTERNS.tiktok.urlPatterns) {

            const matches = content.match(pattern);

            if (matches && matches.length > 0) {

              const username = matches[0].replace(/https?:\/\/(www\.|vm\.)?tiktok\.com\//gi, '').replace(/\/.*$/, '');

              if (username && SOCIAL_PATTERNS.tiktok.validateHandle(username)) {

                handleFound = username.startsWith('@') ? username : `@${username}`;

                break;

              }

            }

          }



          // If no URL found, search for @mentions

          if (!handleFound) {

            const mentions = content.match(SOCIAL_PATTERNS.tiktok.handlePattern);

            if (mentions && mentions.length > 0) {

              const cleanHandle = mentions[0].replace('@', '');

              if (SOCIAL_PATTERNS.tiktok.validateHandle(cleanHandle)) {

                handleFound = `@${cleanHandle}`;

              }

            }

          }

        }

      } catch {

        // Continue without TikTok extraction

      }

    }



    // Verify URL if we found a handle

    if (handleFound) {

      const cleanHandle = handleFound.replace('@', '');

      urlVerified = await this.verifySocialUrl(`https://www.tiktok.com/@${cleanHandle}`);

    }



    return {

      handleFound,

      urlVerified,

      formatValid: handleFound ? SOCIAL_PATTERNS.tiktok.validateHandle(handleFound.replace('@', '')) : false,

      handleSource: lead.tiktok ? 'excel' : handleFound ? 'website' : null,

    };

  }



  /**

   * Fetch website content for analysis

   */

  private fetchWebsiteContent(url: string): Promise<string | null> {

    return new Promise((resolve) => {

      if (!url || !url.startsWith('http')) {

        resolve(null);

        return;

      }



      try {

        const urlObj = new URL(url);

        const protocol = urlObj.protocol === 'https:' ? https : require('http');

        

        const req = protocol.get(url, { timeout: 10000 }, (res: http.IncomingMessage) => {

          // Handle redirects

          if (res.statusCode === 301 || res.statusCode === 302) {

            const redirectUrl = res.headers.location;

            if (redirectUrl) {

              this.fetchWebsiteContent(redirectUrl).then(resolve);

              return;

            }

          }



          if (res.statusCode !== 200) {

            resolve(null);

            return;

          }



          let data = '';

          res.on('data', (chunk) => data += chunk);

          res.on('end', () => {

            // Strip HTML tags for text analysis

            const textContent = data

              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

              .replace(/<[^>]+>/g, ' ')

              .replace(/\s+/g, ' ')

              .trim();

            resolve(textContent.substring(0, 10000)); // Limit content size

          });

        });



        req.on('error', () => resolve(null));

        req.on('timeout', () => {

          req.destroy();

          resolve(null);

        });

      } catch {

        resolve(null);

      }

    });

  }



  /**

   * Verify a social media URL exists (HTTP HEAD check)

   */

  private verifySocialUrl(url: string): Promise<boolean> {

    return new Promise((resolve) => {

      try {

        const urlObj = new URL(url);

        const protocol = urlObj.protocol === 'https:' ? https : require('http');



        const req = protocol.request({

          hostname: urlObj.hostname,

          path: urlObj.pathname,

          method: 'HEAD',

          timeout: 5000,

        }, (res: http.IncomingMessage) => {

          resolve(res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302);

        });



        req.on('error', () => resolve(false));

        req.on('timeout', () => {

          req.destroy();

          resolve(false);

        });



        req.end();

      } catch {

        resolve(false);

      }

    });

  }



  /**

   * Update lead with social verification data

   */

  private async updateLeadSocialData(leadId: string, verification: SocialVerification): Promise<void> {

    const cleanInstagramHandle = verification.instagram.handleFound?.replace('@', '') || null;

    const cleanTikTokHandle = verification.tiktok.handleFound?.replace('@', '') || null;



    await supabaseAdmin

      .from('leads')

      .update({

        instagram: cleanInstagramHandle,

        tiktok: cleanTikTokHandle,

        social_verification_status: verification.socialVerificationStatus,

        social_verification_score: verification.overallFashionScore,

        website_verified: verification.website.verified,

        is_fashion_relevant: verification.website.isFashion || verification.overallFashionScore >= 50,

        last_enriched_at: new Date().toISOString(),

        updated_at: new Date().toISOString(),

      })

      .eq('id', leadId);

  }



  /**

   * Batch verify social handles for multiple leads

   */

  async batchVerifySocialHandles(leadIds: string[]): Promise<{ processed: number; successful: number; failed: number }> {

    let processed = 0;

    let successful = 0;

    let failed = 0;



    for (const leadId of leadIds) {

      try {

        await this.verifySocialHandles(leadId);

        successful++;

      } catch (error) {

        failed++;

        console.error(`[SocialVerification] Failed for lead ${leadId}:`, error);

      }

      processed++;



      // Rate limiting to avoid overwhelming servers

      await new Promise(resolve => setTimeout(resolve, 500));

    }



    return { processed, successful, failed };

  }



  /**

   * Enrich all leads with social verification

   */

  async enrichAllPendingSocialVerification(batchSize: number = 50): Promise<{

    processed: number; 

    results: Array<{ leadId: string; success: boolean; score: number }>

  }> {

    const { data: leads, error } = await supabaseAdmin

      .from('leads')

      .select('id, website, instagram, tiktok')

      .or(`social_verification_status.is.null,social_verification_status.eq.unverified`)

      .limit(batchSize);



    if (error) {

      throw new Error(`Failed to fetch leads: ${error.message}`);

    }



    const results: Array<{ leadId: string; success: boolean; score: number }> = [];



    for (const lead of leads || []) {

      try {

        const verification = await this.verifySocialHandles(lead.id);

        results.push({

          leadId: lead.id,

          success: true,

          score: verification.overallFashionScore,

        });

      } catch {

        results.push({

          leadId: lead.id,

          success: false,

          score: 0,

        });

      }



      // Rate limiting

      await new Promise(resolve => setTimeout(resolve, 300));

    }



    return {

      processed: (leads || []).length,

      results,

    };

  }



  /**

   * Find email for a lead using DuckDuckGo dorking

   * Searches for email patterns on the business website

   */

  async findEmailForLead(leadId: string): Promise<{ found: boolean; email: string | null; source: string }> {

    const lead = await leadService.getLeadById(leadId);



    if (!lead) {

      throw new Error(`Lead not found: ${leadId}`);

    }



    if (!lead.website) {

      return { found: false, email: null, source: 'none' };

    }



    if (lead.email) {

      // Already has email

      return { found: true, email: lead.email, source: 'existing' };

    }



    try {

      const domain = this.extractDomain(lead.website);

      if (!domain) {

        return { found: false, email: null, source: 'invalid_domain' };

      }



      // Try to find email via website content analysis first

      const websiteEmail = await this.findEmailInWebsite(lead.website);

      if (websiteEmail) {

        await this.updateLeadEmail(leadId, websiteEmail, 'website_scraping');

        return { found: true, email: websiteEmail, source: 'website_scraping' };

      }



      // Fallback: try DuckDuckGo dorking

      const dorkEmail = await this.findEmailViaDorking(domain);

      if (dorkEmail) {

        await this.updateLeadEmail(leadId, dorkEmail, 'duckduckgo_dorking');

        return { found: true, email: dorkEmail, source: 'duckduckgo_dorking' };

      }



      return { found: false, email: null, source: 'not_found' };

    } catch (error: any) {

      console.error(`[EmailEnrich] Error finding email for ${leadId}:`, error.message);

      return { found: false, email: null, source: 'error' };

    }

  }



  /**

   * Extract domain from URL

   */

  private extractDomain(website: string): string | null {

    try {

      const url = website.startsWith('http') ? website : `https://${website}`;

      const hostname = new URL(url).hostname;

      return hostname.replace(/^www\./, '');

    } catch {

      return null;

    }

  }



  /**

   * Find email by scraping the website directly

   */

  private async findEmailInWebsite(websiteUrl: string): Promise<string | null> {

    try {

      const content = await this.fetchWebsiteContent(websiteUrl);

      if (!content) return null;



      // Common email patterns

      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

      const emails = content.match(emailRegex) || [];



      // Filter out common false positives

      const filteredEmails = emails.filter(email => {

        const lower = email.toLowerCase();

        return !lower.includes('noreply') &&

               !lower.includes('no-reply') &&

               !lower.includes('example') &&

               !lower.includes('test') &&

               !lower.includes('domain') &&

               !lower.includes('localhost');

      });



      if (filteredEmails.length > 0) {

        // Return the first email that's likely a contact email

        const contactEmail = filteredEmails.find(e =>

          e.startsWith('contact') ||

          e.startsWith('info') ||

          e.startsWith('hello') ||

          e.startsWith('ventas') ||

          e.startsWith('admin')

        ) || filteredEmails[0];



        return contactEmail.toLowerCase();

      }



      return null;

    } catch {

      return null;

    }

  }



  /**

   * Find email using DuckDuckGo dorking

   */

  private async findEmailViaDorking(domain: string): Promise<string | null> {

    // Using a simpler approach - check if domain has a common contact email pattern

    // Full DuckDuckGo scraping would require more complex implementation

    // For now, we rely on website scraping which is more reliable



    // Alternative: check for mailto: links in website

    return null;

  }



  /**

   * Update lead email

   */

  private async updateLeadEmail(leadId: string, email: string, source: string): Promise<void> {

    await supabaseAdmin

      .from('leads')

      .update({

        email,

        enrichment_source: source,

        last_enriched_at: new Date().toISOString(),

        updated_at: new Date().toISOString(),

      })

      .eq('id', leadId);

  }



  /**

   * Batch find emails for leads without email

   */

  async batchFindEmails(limit: number = 50): Promise<{

    processed: number;

    found: number;

    failed: number;

  }> {

    const { data: leads } = await supabaseAdmin

      .from('leads')

      .select('id, website, email')

      .is('email', null)

      .not('website', 'is', null)

      .limit(limit);



    if (!leads || leads.length === 0) {

      return { processed: 0, found: 0, failed: 0 };

    }



    let found = 0;

    let failed = 0;



    for (const lead of leads) {

      try {

        const result = await this.findEmailForLead(lead.id);

        if (result.found) {

          found++;

        } else {

          failed++;

        }

      } catch {

        failed++;

      }



      // Rate limiting - be respectful to servers

      await new Promise(resolve => setTimeout(resolve, 1000));

    }



    return {

      processed: leads.length,

      found,

      failed,

    };

  }

}



export const leadEnrichmentService = new LeadEnrichmentService();

export default leadEnrichmentService;

