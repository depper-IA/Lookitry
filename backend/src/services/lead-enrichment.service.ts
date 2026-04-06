/**
 * Lead Enrichment Service
 * 
 * Handles:
 * - Import leads from Excel CRM
 * - Batch classification/enrichment
 * - Website verification
 * - Integration with Supabase leads table
 */

import { supabaseAdmin } from '../config/supabase';
import { leadService, type Lead } from './lead.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

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
  CAMPAÑA_ENVIADA: string;
  FECHA_CAMPAÑA: string;
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
          
          return {
            name: lead.NOMBRE_CONTACTO || lead.NOMBRE_MARCA || lead.NOMBRE_EMPRESA,
            business_type: lead.NICHO || 'unknown',
            email: lead.EMAIL || null,
            phone: lead.TELEFONO || null,
            website: lead.SITIO_WEB || null,
            instagram: null,
            tiktok: null,
            address: lead.DIRECCION || null,
            city: lead.CIUDAD || null,
            country: detectCountry(lead.CIUDAD),
            source: 'crm_import',
            source_id: `crm_${lead.ID}`,
            status: 'new',
            notes: lead.NOTAS || null,
            internal_notes: `Clasificado: ${classification.reason}`,
            // Enrichment fields
            is_fashion_relevant: classification.isFashion,
            enrichment_source: classification.isFashion !== null ? 'keyword_classification' : 'pending_verification',
            website_verified: false,
            business_type_confirmed: classification.isFashion === true ? lead.NICHO : null,
            last_enriched_at: new Date().toISOString(),
            enrichment_score: classification.isFashion === true ? 50 : classification.isFashion === false ? 0 : 25,
          };
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
}

export const leadEnrichmentService = new LeadEnrichmentService();
export default leadEnrichmentService;
