import https from 'https';

import http from 'http';

import { supabaseAdmin } from '../config/supabase';

import { leadService } from './lead.service';

import { leadSearchService } from './lead-search.service';

import { leadEnrichmentService } from './lead-enrichment.service';



const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

const MAX_DAILY_QUERIES = 500;

const MAX_MONTHLY_QUERIES = 28000;



interface GooglePlaceResult {

  place_id: string;

  name: string;

  formatted_address?: string;

  formatted_phone_number?: string;

  website?: string;

  geometry?: {

    location: { lat: number; lng: number };

  };

  reviews?: Array<{ author_name: string; text: string }>;

  types?: string[];

  photos?: Array<{ photo_reference: string }>;

  rating?: number;

  user_ratings_total?: number;

}



interface GooglePlacesResponse {

  results?: GooglePlaceResult[];

  status: string;

  next_page_token?: string;

}



export interface QuotaStatus {

  daily_used: number;

  monthly_used: number;

  daily_limit: number;

  monthly_limit: number;

  daily_remaining: number;

  monthly_remaining: number;

}



export interface ProspectingResult {

  found: number;

  inserted: number;

  duplicates: number;

  skippedNoSocial: number;

  enriched: number;

}



export class LeadGenerationService {

  private dailyUsed = 0;

  private monthlyUsed = 0;

  private lastReset = '';



  async getQuotaStatus(): Promise<QuotaStatus> {

    const today = new Date().toISOString().split('T')[0];

    const firstOfMonth = today.substring(0, 7) + '-01';



    const { data, error } = await supabaseAdmin

      .from('google_places_quota')

      .select('*')

      .eq('id', 1)

      .maybeSingle();



    if (error || !data) {

      return {

        daily_used: 0,

        monthly_used: 0,

        daily_limit: MAX_DAILY_QUERIES,

        monthly_limit: MAX_MONTHLY_QUERIES,

        daily_remaining: MAX_DAILY_QUERIES,

        monthly_remaining: MAX_MONTHLY_QUERIES,

      };

    }



    let dailyUsed = data.daily_used || 0;

    let monthlyUsed = data.monthly_used || 0;

    const lastReset = data.last_reset_date;

    const lastMonthReset = data.last_month_reset;



    if (lastReset !== today) {

      dailyUsed = 0;

    }



    if (lastMonthReset !== firstOfMonth) {

      monthlyUsed = 0;

    }



    return {

      daily_used: dailyUsed,

      monthly_used: monthlyUsed,

      daily_limit: MAX_DAILY_QUERIES,

      monthly_limit: MAX_MONTHLY_QUERIES,

      daily_remaining: Math.max(0, MAX_DAILY_QUERIES - dailyUsed),

      monthly_remaining: Math.max(0, MAX_MONTHLY_QUERIES - monthlyUsed),

    };

  }



  private async incrementQuota(count = 1): Promise<void> {

    const today = new Date().toISOString().split('T')[0];

    const firstOfMonth = today.substring(0, 7) + '-01';



    const { data } = await supabaseAdmin

      .from('google_places_quota')

      .select('*')

      .eq('id', 1)

      .maybeSingle();



    let dailyUsed = data?.daily_used || 0;

    let monthlyUsed = data?.monthly_used || 0;

    const lastReset = data?.last_reset_date;

    const lastMonthReset = data?.last_month_reset;



    if (lastReset !== today) {

      dailyUsed = 0;

    }



    if (lastMonthReset !== firstOfMonth) {

      monthlyUsed = 0;

    }



    dailyUsed += count;

    monthlyUsed += count;



    await supabaseAdmin

      .from('google_places_quota')

      .upsert({

        id: 1,

        daily_used: dailyUsed,

        monthly_used: monthlyUsed,

        last_reset_date: today,

        last_month_reset: firstOfMonth,

      });

  }



  async canMakeRequest(): Promise<boolean> {

    const quota = await this.getQuotaStatus();

    return quota.daily_remaining > 0 && quota.monthly_remaining > 0;

  }



  async searchPlaces(

    query: string,

    location?: { lat: number; lng: number },

    radius?: number

  ): Promise<GooglePlaceResult[]> {

    if (!(await this.canMakeRequest())) {

      throw new Error('Quota límite alcanzado para Google Places');

    }



    const params: Record<string, string> = {

      key: GOOGLE_PLACES_API_KEY,

      query,

      type: 'store|clothing_store|fashion_accessories_store',

    };



    if (location) {

      params.location = `${location.lat},${location.lng}`;

      params.radius = String(radius || 50000);

    }



    const queryString = Object.entries(params)

      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)

      .join('&');



    try {

      const result = await this.httpGet(

        `https://maps.googleapis.com/maps/api/place/textsearch/json?${queryString}`

      );



      const data = JSON.parse(result) as GooglePlacesResponse;



      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {

        console.error('[LeadGen] Google Places error:', data.status);

        return [];

      }



      await this.incrementQuota();

      return data.results || [];

    } catch (error: any) {

      console.error('[LeadGen] Error searching places:', error.message);

      return [];

    }

  }



  /**

   * Get Place Details - retrieves phone and website which are not returned by Text Search

   */

  async getPlaceDetails(placeId: string): Promise<{ phone?: string; website?: string }> {

    if (!(await this.canMakeRequest())) {

      console.warn('[LeadGen] Quota límite alcanzado, saltando Place Details para:', placeId);

      return {};

    }



    try {

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}`;

      const result = await this.httpGet(url);

      const data = JSON.parse(result) as any;



      await this.incrementQuota();



      if (data.status !== 'OK') {

        console.warn('[LeadGen] Place Details error:', data.status, 'for:', placeId);

        return {};

      }



      const result_ = data.result || {};

      return {

        phone: result_.formatted_phone_number || undefined,

        website: result_.website || undefined,

      };

    } catch (error: any) {

      console.error('[LeadGen] Error getting place details:', error.message);

      return {};

    }

  }



  async runSearch(searchId: string): Promise<{ found: number; inserted: number; duplicates: number }> {

    const search = await leadSearchService.getSearchById(searchId);

    if (!search) throw new Error('Search not found');



    let found = 0;

    let inserted = 0;

    let duplicates = 0;



    for (const keyword of search.keywords) {

      const query = this.buildQuery(keyword, search.country, search.city);

      const results = await this.searchPlaces(

        query,

        undefined,

        search.search_radius_km * 1000

      );



      found += results.length;



      // Enrich each place with details (phone/website) from Place Details API

      const enrichedLeads = [];



      for (const place of results.slice(0, search.max_results)) {

        // Get additional details not available in Text Search

        const details = await this.getPlaceDetails(place.place_id);



        enrichedLeads.push({

          name: place.name,

          business_type: place.types?.[0] || 'store',

          address: place.formatted_address,

          phone: details.phone || place.formatted_phone_number,

          website: details.website || place.website,

          source: 'google_places',

          source_id: place.place_id,

          search_id: search.id,

          country: search.country,

          city: search.city,

          latitude: place.geometry?.location?.lat,

          longitude: place.geometry?.location?.lng,

          rating: place.rating,

          reviews_count: place.user_ratings_total,

          status: 'new',

        });



        // Rate limit between Place Details calls

        await new Promise(resolve => setTimeout(resolve, 100));

      }



      const result = await leadService.createLeadsBatch(enrichedLeads);

      inserted += result.inserted;

      duplicates += result.duplicates;

    }



    await leadSearchService.markSearchRun(searchId, inserted);



    return { found, inserted, duplicates };

  }



  private buildQuery(keyword: string, country: string, city?: string): string {

    const parts = [keyword, country];

    if (city) {

      parts.push(city);

    }

    return parts.join(', ');

  }



  async processScheduledSearches(): Promise<string[]> {

    const searches = await leadSearchService.getScheduledSearches();

    const processed: string[] = [];



    for (const search of searches) {

      if (!search.schedule_cron) continue;



      const lastRun = search.last_run_at ? new Date(search.last_run_at) : null;

      const now = new Date();



      if (this.shouldRun(search.schedule_cron, lastRun, now)) {

        try {

          await this.runSearch(search.id);

          processed.push(search.id);

        } catch (error: any) {

          console.error(`[LeadGen] Error running scheduled search ${search.id}:`, error.message);

        }

      }

    }



    return processed;

  }



  private shouldRun(cron: string, lastRun: Date | null, now: Date): boolean {

    if (!lastRun) return true;



    const intervals: Record<string, number> = {

      '0 * * * *': 60 * 60 * 1000,

      '0 0 * * *': 24 * 60 * 60 * 1000,

      '0 0 * * 0': 7 * 24 * 60 * 60 * 1000,

    };



    const interval = intervals[cron];

    if (!interval) return true;



    return now.getTime() - lastRun.getTime() >= interval;

  }



  // =====================

  // PROSPECTING WITH SOCIAL VERIFICATION

  // =====================



  /**

   * Run search with social verification - only creates leads that have social presence

   */

  async runSearchWithSocialVerification(searchId: string): Promise<ProspectingResult> {

    const search = await leadSearchService.getSearchById(searchId);

    if (!search) throw new Error('Search not found');



    const result: ProspectingResult = {

      found: 0,

      inserted: 0,

      duplicates: 0,

      skippedNoSocial: 0,

      enriched: 0,

    };



    for (const keyword of search.keywords) {

      const query = this.buildQuery(keyword, search.country, search.city);

      const places = await this.searchPlaces(

        query,

        undefined,

        search.search_radius_km * 1000

      );



      result.found += places.length;



      // Process each place

      for (const place of places.slice(0, search.max_results)) {

        // Get additional details not available in Text Search (phone/website)

        const details = await this.getPlaceDetails(place.place_id);

        const website = details.website || place.website;

        const phone = details.phone || place.formatted_phone_number;



        // Check if this place has website (required for social verification)

        if (!website) {

          result.skippedNoSocial++;

          continue;

        }



        // Create the lead first

        const leadData = {

          name: place.name,

          business_type: place.types?.[0] || 'store',

          address: place.formatted_address,

          phone: phone,

          website: website,

          source: 'google_places',

          source_id: place.place_id,

          search_id: search.id,

          country: search.country,

          city: search.city,

          latitude: place.geometry?.location?.lat,

          longitude: place.geometry?.location?.lng,

          rating: place.rating,

          reviews_count: place.user_ratings_total,

          status: 'new',

        };



        try {

          const createResult = await leadService.createLeadsBatch([leadData]);

          

          if (createResult.inserted > 0) {

            result.inserted++;

            

            // Find the lead we just created

            const { data: newLead } = await supabaseAdmin

              .from('leads')

              .select('id')

              .eq('source_id', place.place_id)

              .single();



            if (newLead) {

              // Run social verification on this lead

              try {

                await leadEnrichmentService.verifySocialHandles(newLead.id);

                result.enriched++;

              } catch (enrichError) {

                console.error(`[LeadGen] Social verification failed for ${newLead.id}:`, enrichError);

              }



              // Small delay to avoid rate limiting

              await new Promise(resolve => setTimeout(resolve, 500));

            }

          } else {

            result.duplicates++;

          }

        } catch (error) {

          console.error(`[LeadGen] Failed to create lead for ${place.name}:`, error);

        }

      }

    }



    await leadSearchService.markSearchRun(searchId, result.inserted);



    return result;

  }



  /**

   * Search places and immediately enrich with social verification

   * Returns leads that have website AND social presence indicators

   */

  async searchAndEnrichPlaces(

    query: string,

    location?: { lat: number; lng: number },

    radius?: number,

    requireSocialPresence: boolean = true

  ): Promise<GooglePlaceResult[]> {

    const places = await this.searchPlaces(query, location, radius);

    

    if (!requireSocialPresence) {

      return places;

    }



    // Filter places that have website AND potential social presence

    const enrichedPlaces: GooglePlaceResult[] = [];



    for (const place of places) {

      if (!place.website) continue;



      try {

        // Quick check if website exists and has content

        const hasContent = await this.quickWebsiteCheck(place.website);

        if (hasContent) {

          enrichedPlaces.push(place);

        }

      } catch {

        // Skip this place if website check fails

      }



      // Rate limit

      await new Promise(resolve => setTimeout(resolve, 300));

    }



    return enrichedPlaces;

  }



  /**

   * Quick check if website is accessible and has content

   */

  private quickWebsiteCheck(url: string): Promise<boolean> {

    return new Promise((resolve) => {

      try {

        const urlObj = new URL(url);

        const protocol = urlObj.protocol === 'https:' ? https : http;



        const req = protocol.request({

          hostname: urlObj.hostname,

          path: urlObj.pathname || '/',

          method: 'HEAD',

          timeout: 5000,

        }, (res: http.IncomingMessage) => {

          resolve(res.statusCode === 200);

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

   * Batch process leads for social verification

   */

  async batchEnrichLeadsWithSocial(limit: number = 100): Promise<{

    processed: number;

    enriched: number;

    failed: number;

  }> {

    // Get leads that have website but no social verification

    const { data: leads } = await supabaseAdmin

      .from('leads')

      .select('id, website')

      .eq('source', 'google_places')

      .is('social_verification_status', null)

      .not('website', 'is', null)

      .limit(limit);



    if (!leads || leads.length === 0) {

      return { processed: 0, enriched: 0, failed: 0 };

    }



    let enriched = 0;

    let failed = 0;



    for (const lead of leads) {

      try {

        await leadEnrichmentService.verifySocialHandles(lead.id);

        enriched++;

      } catch {

        failed++;

      }



      // Rate limiting

      await new Promise(resolve => setTimeout(resolve, 500));

    }



    return {

      processed: leads.length,

      enriched,

      failed,

    };

  }



  private httpGet(url: string): Promise<string> {

    return new Promise((resolve, reject) => {

      https

        .get(url, (res) => {

          let data = '';

          res.on('data', (chunk) => (data += chunk));

          res.on('end', () => resolve(data));

        })

        .on('error', reject);

    });

  }

}



export const leadGenerationService = new LeadGenerationService();

