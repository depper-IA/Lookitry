'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, Edit2, Check, X, Search, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

interface WhitelistedIp {
  id: string;
  ip_address: string;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
}

export default function WidgetIpWhitelistPage() {
  const [ips, setIps] = useState<WhitelistedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [checkIp, setCheckIp] = useState('');
  const [checkResult, setCheckResult] = useState<{ ip: string; is_whitelisted: boolean } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchIps();
  }, []);

  const fetchIps = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/widget-ip-whitelist`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cargar IPs');
      setIps(data.ips || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newIp.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/widget-ip-whitelist`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip_address: newIp.trim(), description: newDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError('Esta IP ya está en la whitelist');
        } else {
          throw new Error(data.message || 'Error al agregar IP');
        }
        return;
      }
      setIps([data.ip, ...ips]);
      setNewIp('');
      setNewDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta IP de la whitelist?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/widget-ip-whitelist/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error al eliminar');
      setIps(ips.filter(ip => ip.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/widget-ip-whitelist/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip_address: editValue,
          description: editDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar');
      setIps(ips.map(ip => ip.id === id ? data.ip : ip));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEdit = (ip: WhitelistedIp) => {
    setEditingId(ip.id);
    setEditValue(ip.ip_address);
    setEditDesc(ip.description || '');
  };

  const handleCheckIp = async () => {
    if (!checkIp.trim()) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/widget-ip-whitelist/check/${encodeURIComponent(checkIp.trim())}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setCheckResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Widget IP Whitelist</h1>
        <p className="text-[#999]">IPs que pueden usar el widget de try-on sin límites de prueba</p>
      </div>

      {/* Check IP Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141414] border border-[#333] rounded-lg p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Verificar IP
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ej: 161.18.87.45"
            value={checkIp}
            onChange={(e) => setCheckIp(e.target.value)}
            className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-[#666] focus:border-[#FF5C3A] focus:outline-none"
          />
          <button
            onClick={handleCheckIp}
            disabled={checking}
            className="px-6 py-2 bg-[#FF5C3A] text-white rounded-lg font-medium hover:bg-[#ff7a5c] transition-colors disabled:opacity-50"
          >
            {checking ? 'Verificando...' : 'Verificar'}
          </button>
        </div>
        {checkResult && (
          <div className={`mt-4 p-4 rounded-lg ${checkResult.is_whitelisted ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
            <p className={`font-semibold ${checkResult.is_whitelisted ? 'text-green-400' : 'text-red-400'}`}>
              {checkResult.is_whitelisted ? '✓ IP WHITELISTED' : '✗ IP NO ENCONTRADA'}
            </p>
            <p className="text-[#999] text-sm mt-1">IP: {checkResult.ip}</p>
          </div>
        )}
      </motion.div>

      {/* Add New IP Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141414] border border-[#333] rounded-lg p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Agregar Nueva IP
        </h2>
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Dirección IP (Ej: 161.18.87.45)"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-[#666] focus:border-[#FF5C3A] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-[#666] focus:border-[#FF5C3A] focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newIp.trim()}
            className="px-6 py-2 bg-[#FF5C3A] text-white rounded-lg font-medium hover:bg-[#ff7a5c] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {adding ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </motion.div>

      {/* IP List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141414] border border-[#333] rounded-lg overflow-hidden"
      >
        <div className="p-4 border-b border-[#333]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#FF5C3A]" />
            IPs Whitelisted ({ips.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#999]">Cargando...</div>
        ) : ips.length === 0 ? (
          <div className="p-8 text-center text-[#999]">No hay IPs en la whitelist</div>
        ) : (
          <div className="divide-y divide-[#333]">
            {ips.map((ip) => (
              <div key={ip.id} className="p-4 flex items-center justify-between hover:bg-[#1a1a1a]">
                {editingId === ip.id ? (
                  <div className="flex-1 flex gap-3 items-center">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-1.5 text-white text-sm focus:border-[#FF5C3A] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Descripción"
                      className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-1.5 text-white text-sm focus:border-[#FF5C3A] focus:outline-none"
                    />
                    <button onClick={() => handleUpdate(ip.id)} className="p-1.5 text-green-400 hover:text-green-300">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-red-400 hover:text-red-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-white font-mono">{ip.ip_address}</p>
                      {ip.description && (
                        <p className="text-[#999] text-sm">{ip.description}</p>
                      )}
                      <p className="text-[#666] text-xs mt-1">
                        Agregada: {ip.created_at ? new Date(ip.created_at).toLocaleDateString('es-CO') : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${ip.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {ip.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => startEdit(ip)}
                        className="p-2 text-[#999] hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ip.id)}
                        disabled={deletingId === ip.id}
                        className="p-2 text-[#999] hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
