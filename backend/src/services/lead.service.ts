import { supabaseAdmin } from '../config/supabase';

export interface Lead {
  id: string;
  name: string;
  business_type?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  facebook_url?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviews_count?: number;
  source: string;
  source_id?: string;
  search_id?: string;
  status: string;
  notes?: string;
  internal_notes?: string;
  assigned_to?: string;
  email_sent_at?: string;
  email_campaign_id?: string;
  dm_sent_at?: string;
  dm_platform?: string;
  created_at: string;
  updated_at: string;
  // Enrichment fields
  is_fashion_relevant?: boolean | null;
  enrichment_source?: string | null;
  website_verified?: boolean;
  business_type_confirmed?: string | null;
  last_enriched_at?: string | null;
  website_content?: string | null;
  enrichment_score?: number;
}

// Extended interface for CRM import
export interface CRMLead extends Partial<Lead> {
  source_id: string;
}

export interface LeadSearch {
  id: string;
  name: string;
  country: string;
  city?: string;
  keywords: string[];
  business_types: string[];
  search_radius_km: number;
  max_results: number;
  schedule_enabled: boolean;
  schedule_cron?: string;
  last_run_at?: string;
  last_results_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LeadOutreachLog {
  id: string;
  lead_id: string;
  outreach_type: string;
  details: Record<string, any>;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface SocialApiConfig {
  id: string;
  platform: string;
  config: Record<string, any>;
  is_active: boolean;
  last_test_at?: string;
  last_test_result?: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LeadFilters {
  country?: string;
  city?: string;
  status?: string;
  source?: string;
  search_id?: string;
  created_after?: string;
  assigned_to?: string;
}

export class LeadService {
  async getLeads(
    filters: LeadFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ leads: Lead[]; total: number }> {
    let query = supabaseAdmin.from('leads').select('*', { count: 'exact' });

    if (filters.country) query = query.eq('country', filters.country);
    if (filters.city) query = query.ilike('city', `%${filters.city}%`);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.source) query = query.eq('source', filters.source);
    if (filters.search_id) query = query.eq('search_id', filters.search_id);
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
    if (filters.created_after) query = query.gte('created_at', filters.created_after);

    query = query.order('created_at', { ascending: false });
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { leads: (data as Lead[]) || [], total: count || 0 };
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as Lead | null;
  }

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(lead)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  }

  async createLeadsBatch(leads: Partial<Lead>[]): Promise<{ inserted: number; duplicates: number }> {
    let inserted = 0;
    let duplicates = 0;

    for (const lead of leads) {
      try {
        if (lead.source_id) {
          const { data: existing } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('source_id', lead.source_id)
            .maybeSingle();

          if (existing) {
            duplicates++;
            continue;
          }
        }

        const { error } = await supabaseAdmin.from('leads').insert(lead);
        if (error) throw error;
        inserted++;
      } catch {
        duplicates++;
      }
    }

    return { inserted, duplicates };
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  }

  async deleteLead(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('leads').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteLeadsBySearchId(searchId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('search_id', searchId)
      .eq('status', 'new');
    if (error) throw error;
  }

  async getLeadStats(): Promise<Record<string, number>> {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('status');

    if (error) throw error;

    const stats: Record<string, number> = {
      total: (data || []).length,
      new: 0,
      qualified: 0,
      contacted: 0,
      interested: 0,
      not_interested: 0,
      client: 0,
    };

    for (const lead of data || []) {
      if (lead.status in stats) {
        stats[lead.status]++;
      }
    }

    return stats;
  }

  async getOutreachLogs(leadId: string): Promise<LeadOutreachLog[]> {
    const { data, error } = await supabaseAdmin
      .from('lead_outreach_log')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as LeadOutreachLog[]) || [];
  }

  async addOutreachLog(
    leadId: string,
    outreachType: string,
    details: Record<string, any> = {},
    notes?: string,
    createdBy?: string
  ): Promise<LeadOutreachLog> {
    const { data, error } = await supabaseAdmin
      .from('lead_outreach_log')
      .insert({
        lead_id: leadId,
        outreach_type: outreachType,
        details,
        notes,
        created_by: createdBy || 'admin',
      })
      .select()
      .single();

    if (error) throw error;
    return data as LeadOutreachLog;
  }

  async updateLeadFromOutreach(leadId: string, outreachType: string): Promise<void> {
    const updates: Partial<Lead> = {};

    if (outreachType === 'email') {
      updates.email_sent_at = new Date().toISOString();
    } else if (outreachType === 'dm_instagram' || outreachType === 'dm_tiktok') {
      updates.dm_sent_at = new Date().toISOString();
      updates.dm_platform = outreachType.replace('dm_', '');
    }

    if (Object.keys(updates).length > 0) {
      if (updates.status === undefined) {
        updates.status = 'contacted';
      }
      await this.updateLead(leadId, updates);
    }
  }

  async getLeadsByCity(country: string): Promise<Record<string, number>> {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('city')
      .eq('country', country);

    if (error) throw error;

    const cityCounts: Record<string, number> = {};
    for (const lead of data || []) {
      if (lead.city) {
        cityCounts[lead.city] = (cityCounts[lead.city] || 0) + 1;
      }
    }

    return cityCounts;
  }

  async getLeadFilterOptions(): Promise<{
    cities: string[];
    countries: string[];
    businessTypes: string[];
    statuses: string[];
  }> {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('city, country, business_type, status');

    if (error) throw error;

    const cities = new Set<string>();
    const countries = new Set<string>();
    const businessTypes = new Set<string>();
    const statuses = new Set<string>();

    (data || []).forEach((lead: any) => {
      if (lead.city) cities.add(lead.city);
      if (lead.country) countries.add(lead.country);
      if (lead.business_type) businessTypes.add(lead.business_type);
      if (lead.status) statuses.add(lead.status);
    });

    return {
      cities: Array.from(cities).sort(),
      countries: Array.from(countries).sort(),
      businessTypes: Array.from(businessTypes).sort(),
      statuses: Array.from(statuses).sort(),
    };
  }
}

export const leadService = new LeadService();
