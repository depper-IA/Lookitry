'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  MapPin, 
  Shield, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff, 
  Lock,
  Phone,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CreditCard,
  Building2,
  Receipt,
  Globe,
  Command,
  Smartphone,
  Cpu,
  Package,
  Layout,
  AlertCircle,
  X
} from 'lucide-react';
import { Country, State, City } from 'country-state-city';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { brandsService } from '@/services/brands.service';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/utils/currency';

function formatDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Animaciones ──────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// ── Tipos ────────────────────────────────────────────────────────────────────
type Tab = 'personal' | 'billing' | 'security';

export default function ProfilePage() {
  const { brand, refreshBrand } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [name, setName] = useState(brand?.name || '');
  const [email, setEmail] = useState(brand?.email || '');
  const [phone, setPhone] = useState(brand?.phone || '');
  const [address, setAddress] = useState(brand?.address || '');

  // Location states
  const [countryCode, setCountryCode] = useState(brand?.country === 'Colombia' ? 'CO' : '');
  const [stateCode, setStateCode] = useState('');
  const [city, setCity] = useState(brand?.city || '');
  const [stateProvince, setStateProvince] = useState(brand?.stateProvince || '');
  const [postalCode, setPostalCode] = useState(brand?.postalCode || '');

  // Billing states
  const [nit, setNit] = useState(brand?.nit || '');
  const [billingEmail, setBillingEmail] = useState(brand?.billingEmail || brand?.email || '');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // UI state
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Location Data
  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => countryCode ? State.getStatesOfCountry(countryCode) : [], [countryCode]);
  const cities = useMemo(() => (countryCode && stateCode) ? City.getCitiesOfState(countryCode, stateCode) : [], [countryCode, stateCode]);

  // Sync initial state with brand data
  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setEmail(brand.email);
      setPhone(brand.phone || '');
      setAddress(brand.address || '');
      setCity(brand.city || '');
      setPostalCode(brand.postalCode || '');
      setNit(brand.nit || '');
      setBillingEmail(brand.billingEmail || brand.email || '');

      // Try to find country code by name
      if (brand.country) {
        const foundCountry = countries.find(c => c.name === brand.country);
        if (foundCountry) {
          setCountryCode(foundCountry.isoCode);
          
          // Try to find state code by name once country is set
          if (brand.stateProvince) {
            const stateName = brand.stateProvince;
            setStateProvince(stateName);
            const foundState = State.getStatesOfCountry(foundCountry.isoCode).find(s => s.name === stateName);
            if (foundState) {
              setStateCode(foundState.isoCode);
            }
          }
        }
      }
    }
  }, [brand, countries]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const selectedCountry = countries.find(c => c.isoCode === countryCode)?.name || brand?.country || '';

      await brandsService.updateMe({
        name,
        phone,
        address,
        country: selectedCountry,
        city,
        state_province: stateProvince,
        postal_code: postalCode,
        nit,
        billing_email: billingEmail
      });
      setSuccessMsg('Perfil actualizado con éxito');
      refreshBrand();
      
      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setSuccessMsg('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-6xl mx-auto space-y-12 pb-24 px-4"
    >
      {/* ══ HEADER ORBITAL ══ */}
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          {brand?.emailVerified && (
            <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full w-fit mb-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
               <p className="text-[10px] font-[950] text-emerald-500 uppercase tracking-widest italic leading-none">Email Verificado</p>
            </div>
          )}
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
                <User className="w-5 h-5 text-[#FF5C3A]" />
             </div>
             <h1 className="text-4xl font-[900] tracking-tighter text-[var(--text-primary)] italic uppercase leading-none font-jakarta">Mi Perfil</h1>
          </div>
          <p className="text-[11px] font-black tracking-[0.2em] text-[var(--text-muted)] uppercase opacity-60">Información de cuenta y facturación</p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

        {/* ══ SIDEBAR / RESUMEN ══ */}
        <div className="lg:col-span-4 space-y-8">

          {/* USER CARD PREMIUM (GLASS) */}
          <motion.div
            variants={itemVariants}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] p-8 space-y-8 relative overflow-hidden shadow-2xl group"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C3A]/5 blur-3xl rounded-full" />

             <div className="flex flex-col items-center text-center space-y-4 pt-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF5C3A] to-[#D13C1C] flex items-center justify-center text-white text-3xl font-black shadow-[0_0_40px_rgba(255,92,58,0.3)]">
                   {name.charAt(0).toUpperCase()}
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">{name}</h2>
                   <p className="text-sm font-bold text-[var(--text-muted)] opacity-60">@{brand?.slug}</p>
                </div>

                {brand?.emailVerified ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                     <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-jakarta">Email Verificado</span>
                  </div>
                ) : (
                  <button className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full hover:bg-amber-500/20 transition-all">
                     <Shield className="w-4 h-4 text-amber-500" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Verificar Ahora</span>
                  </button>
                )}
             </div>

             <div className="h-px bg-[var(--border-color)] w-full opacity-50" />

             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)]"><Mail size={18} /></div>
                   <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Email</p>
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{email}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)]"><Phone size={18} /></div>
                   <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Teléfono</p>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{phone || 'Pendiente'}</p>
                   </div>
                </div>
             </div>
          </motion.div>

          {/* PLAN CARD PREMIUM (METALLIC) */}
          <motion.div
            variants={itemVariants}
            className="bg-zinc-900 text-white rounded-[3rem] p-10 space-y-6 relative overflow-hidden shadow-3xl ring-1 ring-white/10"
          >
             <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#FF5C3A] blur-[80px] opacity-20" />
             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500 blur-[80px] opacity-20" />

             <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10">
                      <Layout className="w-6 h-6 text-indigo-500" />
                    </div>  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Mi Suscripción</span>
                   </div>
                   <h3 className="text-4xl font-[950] tracking-tighter italic uppercase text-white leading-tight">
                      Lookitry<br/>
                      <span className="text-[#FF5C3A]">{brand?.plan || 'BASIC'}</span>
                   </h3>
                </div>

                <div className="flex items-end justify-between border-t border-white/10 pt-6">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 italic">Estado</p>
                      <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Activo</p>
                   </div>
                   <button 
                     onClick={() => (window.location.href = '/dashboard/subscription')} 
                     className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-95"
                   >
                      <ChevronRight className="w-4 h-4 text-white" />
                   </button>
                </div>
             </div>
          </motion.div>
        </div>

        {/* ══ MAIN PANEL ══ */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* TABS SELECTOR */}
          <div className="flex bg-[var(--bg-card)] p-2 rounded-3xl border border-[var(--border-color)] shadow-xl overflow-x-auto no-scrollbar">
            {(['personal', 'billing', 'security'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 min-w-[120px] px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${activeTab === t ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
              >
                {t === 'personal' && <User size={14} />}
                {t === 'billing' && <Receipt size={14} />}
                {t === 'security' && <Lock size={14} />}
                {t === 'personal' ? 'Perfil Base' : t === 'billing' ? 'Facturación' : 'Seguridad'}
              </button>
            ))}
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3.5rem] p-10 shadow-2xl min-h-[500px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'personal' && (
                <motion.form
                  key="personal"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleUpdateProfile}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Nombre de la Marca</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
                        <input
                          type="text" value={name} onChange={e => setName(e.target.value)} required
                          className="w-full pl-12 pr-4 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)]"
                          placeholder="Ej: Wilkiedevs Couture"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Email (No Editable)</label>
                      <div className="relative opacity-50">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                          type="email" value={email} disabled
                          className="w-full pl-12 pr-4 py-4 bg-[var(--bg-base)] border-2 border-transparent rounded-2xl font-medium text-sm tracking-tight outline-none text-[var(--text-primary)] cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Teléfono de Contacto</label>
                      <div className="relative group">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
                        <input
                          type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)]"
                          placeholder="Ej: +57 300 123 4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-[var(--border-color)] w-full opacity-30" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">País</label>
                      <select 
                        value={countryCode} 
                        onChange={e => { setCountryCode(e.target.value); setStateCode(''); setCity(''); }}
                        className="w-full px-5 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)] appearance-none"
                      >
                         <option value="">Seleccionar...</option>
                         {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Departamento / Estado</label>
                      <select 
                        value={stateCode} 
                        onChange={e => { setStateCode(e.target.value); setCity(''); setStateProvince(states.find(s => s.isoCode === e.target.value)?.name || ''); }}
                        disabled={!countryCode}
                        className="w-full px-5 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)] appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                         <option value="">Seleccionar...</option>
                         {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Municipio / Ciudad</label>
                      <select 
                        value={city} 
                        onChange={e => setCity(e.target.value)}
                        disabled={!stateCode}
                        className="w-full px-5 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)] appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                         <option value="">Seleccionar...</option>
                         {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                         {/* Fallback override */}
                         {cities.length === 0 && stateCode && <option value="">Cargando ciudades...</option>}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Dirección</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
                      <input
                        type="text" value={address} onChange={e => setAddress(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)]"
                        placeholder="Calle, Número, Oficina/Local"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit" disabled={loading}
                      className="px-10 py-5 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-[#FF5C3A]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Guardar Cambios
                    </button>
                  </div>
                </motion.form>
              )}

              {activeTab === 'billing' && (
                <motion.form
                  key="billing"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleUpdateProfile}
                  className="space-y-10"
                >
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl flex gap-4">
                     <Building2 className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                     <p className="text-[11px] font-medium text-emerald-600/70 leading-relaxed italic">
                        La información de facturación es necesaria para generar tus reportes legales y mantener la trazabilidad de tus ciclos de inversión.
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">NIT / RUT / Tax ID</label>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
                        <input
                          type="text" value={nit} onChange={e => setNit(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)]"
                          placeholder="Número de identificación tributaria"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Email de Facturación</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
                        <input
                          type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)]"
                          placeholder="Donde lleguen los recibos..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-center pt-20 pb-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] mb-4">Plan Activo</p>
                    <div className="inline-block px-12 py-8 bg-zinc-50 rounded-[3rem] border border-zinc-200/60 shadow-deep">
                      <span className="text-4xl font-[950] tracking-tighter italic uppercase text-zinc-800">Lookitry <span className="text-[#FF5C3A]">{brand?.plan}</span></span>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-3">Próximo vencimiento: {formatDate(brand?.subscriptionEndDate)}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit" disabled={loading}
                      className="px-10 py-5 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-[#FF5C3A]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
                      Actualizar Facturación
                    </button>
                  </div>
                </motion.form>
              )}

              {activeTab === 'security' && (
                <motion.form
                  key="security"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleChangePassword}
                  className="space-y-10"
                >
                  <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-3xl flex gap-4">
                     <Shield className="w-8 h-8 text-rose-500 flex-shrink-0" />
                     <p className="text-[11px] font-medium text-rose-600/70 leading-relaxed italic">
                        Mantén tu cuenta segura. Recomendamos actualizar tu contraseña periódicamente.
                     </p>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Contraseña Actual</label>
                        <div className="relative group">
                           <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
                           <input
                              type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                              className="w-full pl-12 pr-12 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)]"
                           />
                           <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[#FF5C3A] transition-colors">
                              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Nueva Contraseña</label>
                           <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
                              <input
                                 type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                                 className="w-full pl-12 pr-12 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)]"
                              />
                              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[#FF5C3A] transition-colors">
                                 {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Confirmar Nueva Clave</label>
                           <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
                              <input
                                 type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                                 className="w-full pl-12 pr-12 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)]"
                              />
                              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[#FF5C3A] transition-colors">
                                 {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit" disabled={loading}
                      className="px-10 py-5 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-rose-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                      Cambiar Contraseña
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* FEEDBACK OVERLAYS */}
            <AnimatePresence>
               {(successMsg || errorMsg) && (
                  <motion.div 
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                     className={`absolute bottom-8 left-10 right-10 p-4 rounded-2xl border flex items-center justify-between backdrop-blur-3xl z-50 ${successMsg ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}
                  >
                     <div className="flex items-center gap-3">
                        {successMsg ? <CheckCircle2 size={18} /> : <AlertCircle className="w-4.5 h-4.5" />}
                        <p className="text-[10px] font-black uppercase tracking-widest">{successMsg || errorMsg}</p>
                     </div>
                     <button onClick={() => { setSuccessMsg(''); setErrorMsg(''); }} className="opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
                  </motion.div>
               )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
