/**
 * Prospecting Script - Google Places Lead Generation
 * Run: npx ts-node scripts/prospect-google-places.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../src/config/supabase';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  geometry?: { location: { lat: number; lng: number } };
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
}

interface GooglePlacesResponse {
  results?: GooglePlaceResult[];
  status: string;
  next_page_token?: string;
}

const CITIES = [
  { query: 'tienda ropa Cali', city: 'Cali', country: 'Colombia', priority: 1 },
  { query: 'tienda ropa latina Miami', city: 'Miami', country: 'USA', priority: 2 },
  { query: 'boutique Medellín', city: 'Medellín', country: 'Colombia', priority: 3 },
  { query: 'zapatería Bogotá', city: 'Bogotá', country: 'Colombia', priority: 4 },
  { query: 'boutique ropa Madrid', city: 'Madrid', country: 'España', priority: 5 },
  { query: 'boutique hispana Los Angeles', city: 'Los Angeles', country: 'USA', priority: 6 },
  { query: 'tienda moda Barcelona', city: 'Barcelona', country: 'España', priority: 7 },
];

const MAX_RESULTS_PER_CITY = 50;
const DAILY_LIMIT = 500;

async function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const https = require('https');
    https
      .get(url, (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

async function searchPlaces(query: string): Promise<GooglePlaceResult[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=store|clothing_store|fashion_accessories_store&key=${GOOGLE_PLACES_API_KEY}`;
  
  const data = await httpGet(url);
  const response = JSON.parse(data) as GooglePlacesResponse;
  
  if (response.status !== 'OK' && response.status !== 'ZERO_RESULTS') {
    console.error(`[Google Places] Error: ${response.status}`);
    return [];
  }
  
  return response.results || [];
}

async function getQuotaStatus(): Promise<{ daily_used: number; remaining: number }> {
  const { data } = await supabaseAdmin
    .from('google_places_quota')
    .select('daily_used')
    .eq('id', 1)
    .single();
  
  const used = data?.daily_used || 0;
  return { daily_used: used, remaining: DAILY_LIMIT - used };
}

async function incrementQuota(count: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.substring(0, 7) + '-01';
  
  const { data } = await supabaseAdmin
    .from('google_places_quota')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  
  let dailyUsed = data?.daily_used || 0;
  const lastReset = data?.last_reset_date;
  
  if (lastReset !== today) {
    dailyUsed = 0;
  }
  
  dailyUsed += count;
  
  await supabaseAdmin
    .from('google_places_quota')
    .upsert({
      id: 1,
      daily_used: dailyUsed,
      monthly_used: (data?.monthly_used || 0) + count,
      last_reset_date: today,
      last_month_reset: firstOfMonth,
    });
}

async function saveLead(place: GooglePlaceResult, city: string, country: string): Promise<{ id: string; isNew: boolean } | null> {
  // Check if already exists
  const { data: existing } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('source_id', place.place_id)
    .maybeSingle();
  
  if (existing) {
    return { id: existing.id, isNew: false };
  }
  
  // Insert new lead
  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({
      name: place.name,
      business_type: place.types?.[0] || 'store',
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      source: 'google_places',
      source_id: place.place_id,
      country,
      city,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      rating: place.rating,
      reviews_count: place.user_ratings_total,
      status: 'new',
      is_fashion_relevant: null,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error(`Error saving lead ${place.name}:`, error.message);
    return null;
  }
  
  return { id: data.id, isNew: true };
}

async function runProspecting() {
  console.log('🚀 Starting Google Places Prospecting...\n');
  
  // Check quota
  const quota = await getQuotaStatus();
  console.log(`📊 Quota Status: ${quota.daily_used}/${DAILY_LIMIT} used, ${quota.remaining} remaining\n`);
  
  if (quota.remaining <= 0) {
    console.error('❌ Daily quota exhausted. Try again tomorrow.');
    return;
  }
  
  const results: Record<string, { found: number; saved: number; duplicates: number }> = {};
  
  // Process each city
  for (const cityConfig of CITIES) {
    if (quota.remaining <= 0) {
      console.log('⚠️ Quota limit reached, stopping.');
      break;
    }
    
    console.log(`🔍 [${cityConfig.priority}/7] Searching: "${cityConfig.query}"...`);
    
    try {
      const places = await searchPlaces(cityConfig.query);
      console.log(`   Found ${places.length} places`);
      
      results[cityConfig.city] = { found: places.length, saved: 0, duplicates: 0 };
      
      // Increment quota for the search
      await incrementQuota(1);
      quota.daily_used++;
      quota.remaining--;
      
      // Save leads (up to MAX_RESULTS_PER_CITY)
      const placesToSave = places.slice(0, MAX_RESULTS_PER_CITY);
      
      for (const place of placesToSave) {
        const result = await saveLead(place, cityConfig.city, cityConfig.country);
        
        if (result) {
          if (result.isNew) {
            results[cityConfig.city].saved++;
          } else {
            results[cityConfig.city].duplicates++;
          }
        }
        
        // Small delay to avoid overwhelming Supabase
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`   ✓ Saved: ${results[cityConfig.city].saved}, Duplicates: ${results[cityConfig.city].duplicates}\n`);
      
      // Delay between cities
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  // Final summary
  console.log('\n📈 PROSPECTING SUMMARY');
  console.log('='.repeat(50));
  
  let totalFound = 0;
  let totalSaved = 0;
  let totalDuplicates = 0;
  
  for (const [city, stats] of Object.entries(results)) {
    console.log(`${city.padEnd(15)} | Found: ${String(stats.found).padStart(3)} | Saved: ${String(stats.saved).padStart(3)} | Dups: ${stats.duplicates}`);
    totalFound += stats.found;
    totalSaved += stats.saved;
    totalDuplicates += stats.duplicates;
  }
  
  console.log('='.repeat(50));
  console.log(`TOTAL             | Found: ${String(totalFound).padStart(3)} | Saved: ${String(totalSaved).padStart(3)} | Dups: ${totalDuplicates}`);
  console.log(`\n📊 Final Quota Used: ${quota.daily_used}/${DAILY_LIMIT}`);
  console.log('\n✅ Prospecting complete!');
}

runProspecting().catch(console.error);
