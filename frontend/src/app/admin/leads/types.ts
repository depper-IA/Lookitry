// Types and constants for Leads page

export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'interested' | 'not_interested' | 'client';

export interface Lead {
  id: string;
  name: string;
  business_type?: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  facebook_url?: string;
  address?: string;
  city?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  user_ratings_total?: number;
  status: LeadStatus;
  source: string;
  notes?: string;
  created_at: string;
}

export interface Stats {
  total: number;
  new: number;
  qualified: number;
  contacted: number;
  interested: number;
  not_interested: number;
  client: number;
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nuevo',
  qualified: 'Cualificado',
  contacted: 'Contactado',
  interested: 'Interesado',
  not_interested: 'No interesado',
  client: 'Cliente',
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: '#6b7280',
  qualified: '#3b82f6',
  contacted: '#f59e0b',
  interested: '#10b981',
  not_interested: '#ef4444',
  client: '#8b5cf6',
};

// Utility functions
export function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Limpia el nombre del lead (guiones bajos -> espacios, limpia espacios extra)
export function cleanLeadName(name: string): string {
  return name
    .replace(/_/g, ' ')           // Reemplazar guiones bajos con espacios
    .replace(/\s+/g, ' ')         // Limpiar espacios múltiples
    .trim();
}
