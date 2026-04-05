import { supabaseAdmin } from '../config/supabase';
import { LeadSearch } from './lead.service';

export interface CreateSearchParams {
  name: string;
  country: string;
  city?: string;
  keywords: string[];
  business_types?: string[];
  search_radius_km?: number;
  max_results?: number;
  schedule_enabled?: boolean;
  schedule_cron?: string;
  created_by: string;
}

export class LeadSearchService {
  async getSearches(): Promise<LeadSearch[]> {
    const { data, error } = await supabaseAdmin
      .from('lead_searches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data as LeadSearch[]) || [];
  }

  async getSearchById(id: string): Promise<LeadSearch | null> {
    const { data, error } = await supabaseAdmin
      .from('lead_searches')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as LeadSearch | null;
  }

  async createSearch(params: CreateSearchParams): Promise<LeadSearch> {
    const { data, error } = await supabaseAdmin
      .from('lead_searches')
      .insert({
        name: params.name,
        country: params.country,
        city: params.city || null,
        keywords: params.keywords,
        business_types: params.business_types || [],
        search_radius_km: params.search_radius_km || 10,
        max_results: params.max_results || 50,
        schedule_enabled: params.schedule_enabled || false,
        schedule_cron: params.schedule_cron || null,
        created_by: params.created_by,
      })
      .select()
      .single();

    if (error) throw error;
    return data as LeadSearch;
  }

  async updateSearch(id: string, updates: Partial<LeadSearch>): Promise<LeadSearch> {
    const { data, error } = await supabaseAdmin
      .from('lead_searches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as LeadSearch;
  }

  async deleteSearch(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('lead_searches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async markSearchRun(id: string, resultsCount: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('lead_searches')
      .update({
        last_run_at: new Date().toISOString(),
        last_results_count: resultsCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  async getScheduledSearches(): Promise<LeadSearch[]> {
    const { data, error } = await supabaseAdmin
      .from('lead_searches')
      .select('*')
      .eq('schedule_enabled', true);

    if (error) throw error;
    return (data as LeadSearch[]) || [];
  }

  async getSearchStats(): Promise<{
    total_searches: number;
    scheduled: number;
    total_leads_found: number;
  }> {
    const { data: searches } = await supabaseAdmin
      .from('lead_searches')
      .select('id, last_results_count, schedule_enabled');

    const { count: totalLeads } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact' });

    const scheduled = (searches || []).filter((s: any) => s.schedule_enabled).length;

    return {
      total_searches: (searches || []).length,
      scheduled,
      total_leads_found: totalLeads || 0,
    };
  }
}

export const leadSearchService = new LeadSearchService();
