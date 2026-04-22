'use client';

import { Lead, LeadStatus, STATUS_COLORS, cleanLeadName } from '../types';
import { IconStar, IconEye, IconEdit, IconTrash } from './LeadIcons';

interface LeadsTableProps {
  leads: Lead[];
  actionLoading: string | null;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onDelete: (leadId: string) => void;
  onViewDetail: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
}

export default function LeadsTable({
  leads,
  actionLoading,
  onStatusChange,
  onDelete,
  onViewDetail,
  onEdit,
}: LeadsTableProps) {
  return (
    <tbody>
      {leads.map((lead) => (
        <tr
          key={lead.id}
          style={{ borderBottom: '1px solid var(--border-color)' }}
          className="hover:bg-[var(--bg-hover)] transition-colors"
        >
          <td className="px-6 py-4">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{cleanLeadName(lead.name)}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{lead.business_type || '—'}</p>
            </div>
          </td>
          <td className="px-6 py-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {lead.city || '—'}, {lead.country}
            </p>
            {lead.rating != null && (
              <div className="flex items-center gap-1 mt-1">
                <IconStar className="h-3 w-3" style={{ color: '#FBBD23' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.rating.toFixed(1)}</span>
              </div>
            )}
          </td>
          <td className="px-6 py-4">
            <div className="flex flex-col gap-1">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>{lead.email}</a>
              )}
              {lead.phone && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.phone}</span>
              )}
            </div>
          </td>
          <td className="px-6 py-4">
            <select
              value={lead.status}
              onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
              disabled={actionLoading === lead.id}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-base)] px-2 py-1.5 text-xs font-medium outline-none"
              style={{ color: STATUS_COLORS[lead.status], backgroundColor: `${STATUS_COLORS[lead.status]}20` }}
            >
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="qualified">Cualificado</option>
              <option value="interested">Interesado</option>
              <option value="not_interested">No interesado</option>
              <option value="client">Cliente</option>
            </select>
          </td>
          <td className="px-6 py-4">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.source}</span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewDetail(lead)}
                className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                title="Ver detalle"
              >
                <IconEye />
              </button>
              <button
                onClick={() => onEdit(lead)}
                className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                title="Editar"
              >
                <IconEdit />
              </button>
              <button
                onClick={() => onDelete(lead.id)}
                disabled={actionLoading === lead.id}
                className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-50"
                title="Eliminar"
              >
                <IconTrash />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
