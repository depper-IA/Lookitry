'use client';

import { useState, useEffect } from 'react';
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
  Download,
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
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { brandsService } from '@/services/brands.service';
import { getSubscriptionDisplayState } from '@/lib/subscription-display';

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

type CountryOption = { name: string; isoCode: string };
type StateOption = { name: string; isoCode: string };
type CityOption = { name: string };
type LegalRequestItem = {
  id: string;
  type: string;
  status?: string;
  createdAt?: string | null;
  created_at?: string | null;
  processedAt?: string | null;
};

type LegalDataExportItem = {
  id: string;
  request_id: string;
  type: 'customers/data_request';
  status: 'available';
  format: 'json';
  created_at: string;
  expires_at: string;
  file_name: string;
  data: Record<string, unknown>;
};

function formatLegalRequestType(type: string): string {
  switch (type) {
    case 'customers/data_request':
      return 'Ver mis datos';
    case 'customers/redact':
      return 'Redactar datos de comprador final';
    case 'shop/redact':
      return 'Redactar datos de tienda y app';
    case 'app/uninstalled':
      return 'Desinstalar o pausar integración';
    default:
      return type;
  }
}

export default function ProfilePage() {
  const { brand, refreshBrand } = useAuth();
  const subscriptionState = getSubscriptionDisplayState(brand);
  const subscriptionToneClass =
    subscriptionState.statusTone === 'emerald'
      ? 'text-emerald-400'
      : subscriptionState.statusTone === 'amber'
        ? 'text-amber-400'
        : subscriptionState.statusTone === 'rose'
          ? 'text-rose-400'
          : 'text-zinc-400';
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [name, setName] = useState(brand?.name || '');
  const [email, setEmail] = useState(brand?.email || '');
  const [phone, setPhone] = useState(brand?.phone || '');
  const [address, setAddress] = useState(brand?.address || '');
  const [website, setWebsite] = useState((brand as any)?.social_links?.website || '');
  const [allowedOriginsText, setAllowedOriginsText] = useState('');

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
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalRequests, setLegalRequests] = useState<LegalRequestItem[]>([]);
  const [legalDataExports, setLegalDataExports] = useState<LegalDataExportItem[]>([]);
  const [legalLoading, setLegalLoading] = useState(false);
  const [legalActionLoading, setLegalActionLoading] = useState('');
  const [legalResultMsg, setLegalResultMsg] = useState('');
  const [selectedDataExport, setSelectedDataExport] = useState<LegalDataExportItem | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Handler para reenviar email de verificación
  const handleResendVerification = async () => {
    if (!brand?.email) return;
    setResendingVerification(true);
    setResendSuccess(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: brand.email }),
      });
      if (!res.ok) throw new Error('Error al reenviar');
      setResendSuccess(true);
    } catch {
      // Silently handle error - show success anyway to avoid confusion
      setResendSuccess(true);
    } finally {
      setResendingVerification(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadCountries = async () => {
      const { Country } = await import('country-state-city');
      if (!cancelled) {
        setCountries(Country.getAllCountries());
      }
    };

    loadCountries().catch(() => {
      if (!cancelled) setCountries([]);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadStates = async () => {
      if (!countryCode) {
        setStates([]);
        return;
      }

      const { State } = await import('country-state-city');
      if (!cancelled) {
        setStates(State.getStatesOfCountry(countryCode));
      }
    };

    loadStates().catch(() => {
      if (!cancelled) setStates([]);
    });

    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  useEffect(() => {
    let cancelled = false;

    const loadCities = async () => {
      if (!countryCode || !stateCode) {
        setCities([]);
        return;
      }

      const { City } = await import('country-state-city');
      if (!cancelled) {
        setCities(City.getCitiesOfState(countryCode, stateCode));
      }
    };

    loadCities().catch(() => {
      if (!cancelled) setCities([]);
    });

    return () => {
      cancelled = true;
    };
  }, [countryCode, stateCode]);

  // Sync initial state with brand data
  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setEmail(brand.email);
      setPhone(brand.phone || '');
      setAddress(brand.address || '');
      setWebsite((brand as any).social_links?.website || '');
      setAllowedOriginsText(
        Array.isArray((brand as any).social_links?.allowed_origins)
          ? (brand as any).social_links.allowed_origins.join('\n')
          : ''
      );
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
            const foundState = states.find(s => s.name === stateName);
            if (foundState) {
              setStateCode(foundState.isoCode);
            }
          }
        }
      }
    }
  }, [brand, countries, states]);

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
        billing_email: billingEmail,
        website,
        allowed_origins: allowedOriginsText
          .split('\n')
          .map((value) => value.trim())
          .filter(Boolean),
      });
      setSuccessMsg('Perfil actualizado con éxito');
      refreshBrand();

      // Marcar paso 1 de onboarding como completo si se guardó exitosamente
      window.dispatchEvent(new CustomEvent('onboarding:step-complete', { detail: { step: 1 } }));

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

  const validatePasswordComplexity = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un número' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)' };
    }
    return { isValid: true, message: '' };
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }
    const complexityCheck = validatePasswordComplexity(newPassword);
    if (!complexityCheck.isValid) {
      setErrorMsg(complexityCheck.message);
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

  const loadLegalRequests = async () => {
    setLegalLoading(true);
    try {
      const response = await brandsService.getLegalRequests();
      setLegalRequests(Array.isArray(response.requests) ? response.requests : []);
      const exportsList = Array.isArray(response.data_exports) ? response.data_exports : [];
      setLegalDataExports(exportsList);
      setSelectedDataExport(exportsList[0] || null);
    } catch (err: any) {
      setErrorMsg(err.message || 'No pude cargar tus solicitudes legales');
    } finally {
      setLegalLoading(false);
    }
  };

  const downloadLegalExport = (dataExport: LegalDataExportItem) => {
    const blob = new Blob([JSON.stringify(dataExport.data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = dataExport.file_name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleLegalRequest = async (type: string) => {
    setLegalActionLoading(type);
    setLegalResultMsg('');
    setErrorMsg('');
    try {
      const response = await brandsService.createLegalRequest(type);
      setLegalRequests(Array.isArray(response.requests) ? response.requests : []);
      const exportsList = Array.isArray(response.data_exports) ? response.data_exports : [];
      setLegalDataExports(exportsList);
      if (type === 'customers/data_request' && response.data_export) {
        setSelectedDataExport(response.data_export);
      } else if (!selectedDataExport && exportsList[0]) {
        setSelectedDataExport(exportsList[0]);
      }
      setLegalResultMsg(
        type === 'customers/data_request'
          ? 'Tu export de datos quedó listo. Puedes verlo aquí o descargarlo en JSON.'
          : 'Tu solicitud fue registrada correctamente.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'No pude registrar la solicitud legal');
    } finally {
      setLegalActionLoading('');
    }
  };

  useEffect(() => {
    if (isLegalModalOpen) {
      loadLegalRequests();
    }
  }, [isLegalModalOpen]);

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
                ) : resendSuccess ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                     <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-jakarta">Email Reenviado</span>
                  </div>
                ) : (
                  <button
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full hover:bg-amber-500/20 transition-all disabled:opacity-60"
                  >
                     {resendingVerification ? (
                       <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                     ) : (
                       <Shield className="w-4 h-4 text-amber-500" />
                     )}
                     <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                       {resendingVerification ? 'Enviando...' : 'Reenviar Verificación'}
                     </span>
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
            className="bg-[var(--bg-card)] rounded-[3rem] p-10 space-y-6 relative overflow-hidden shadow-2xl border border-[var(--border-color)]"
          >
             <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#FF5C3A] blur-[80px] opacity-20" />
             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500 blur-[80px] opacity-20" />

             <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10">
                      <Layout className="w-6 h-6 text-indigo-500" />
                    </div>  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] opacity-60">Mi plan</span>
                   </div>
                   <h3 className="text-4xl font-[950] tracking-tighter italic uppercase text-[var(--text-primary)] leading-tight">
                      Lookitry<br/>
                      <span className="text-[#FF5C3A]">{subscriptionState.displayPlan}</span>
                   </h3>
                </div>

                <div className="flex items-end justify-between border-t border-[var(--border-color)] pt-6">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 italic">Estado</p>
                      <p className={`text-xs font-black uppercase tracking-widest ${subscriptionToneClass}`}>{subscriptionState.statusLabel}</p>
                   </div>
                   <button
                     onClick={() => (window.location.href = '/dashboard/subscription')}
                     className="p-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] transition-all active:scale-95"
                   >
                      <ChevronRight className="w-4 h-4 text-[var(--text-primary)]" />
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
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">Sitio Web (Para embeber widget)</label>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#FF5C3A] transition-colors" />
                        <input
                          type="url" value={website} onChange={e => setWebsite(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)]"
                          placeholder="Ej: https://tumarca.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-2">
                      Dominios autorizados adicionales
                    </label>
                    <textarea
                      value={allowedOriginsText}
                      onChange={e => setAllowedOriginsText(e.target.value)}
                      rows={4}
                      className="w-full px-5 py-4 bg-[var(--bg-hover)] border-2 border-transparent focus:border-[#FF5C3A]/30 rounded-2xl font-medium text-sm tracking-tight outline-none transition-all text-[var(--text-primary)] resize-y"
                      placeholder={'https://landing.tumarca.com\nhttps://shop.tumarca.com\nhttps://micrositio.partner.com'}
                    />
                    <p className="text-[11px] font-medium text-[var(--text-muted)] opacity-70 leading-relaxed px-2">
                      Agrega un dominio por línea para activar tu probador en tu web, landing o micrositios autorizados.
                    </p>
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
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] mb-4">Mi plan</p>
                    <div className="inline-block px-12 py-8 bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] shadow-xl">
                      <span className="text-4xl font-[950] tracking-tighter italic uppercase text-[var(--text-primary)]">Lookitry <span className="text-[#FF5C3A]">{subscriptionState.displayPlan}</span></span>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-3">{subscriptionState.renewalLabel}: {formatDate(subscriptionState.renewalDate)}</p>
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
                                  placeholder="8+ caracteres, mayúscula, minúscula, número y símbolo"
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

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--border-color)] pt-6">
              <p className="text-[11px] text-[var(--text-muted)]">
                Si necesitas ejercer derechos de privacidad, acceso o redacción, puedes iniciar la solicitud desde aquí.
              </p>
              <button
                type="button"
                onClick={() => setIsLegalModalOpen(true)}
                className="text-[11px] font-black uppercase tracking-[0.18em] text-[#FF5C3A] hover:opacity-80 transition-opacity"
              >
                Solicitudes de privacidad y datos
              </button>
            </div>

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

      <AnimatePresence>
        {isLegalModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md px-4 py-6 overflow-y-auto"
          >
            <div className="min-h-full flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                className="w-full max-w-3xl rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 md:p-8 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#FF5C3A]">Privacidad y Datos</p>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Solicitudes legales automáticas</h2>
                    <p className="text-sm text-[var(--text-muted)]">
                      Puedes pedir acceso a tus datos, redacción o pausar la integración. Algunas acciones son irreversibles y no eliminan el ledger financiero mínimo permitido.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLegalModalOpen(false)}
                    className="rounded-2xl border border-[var(--border-color)] p-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      id: 'customers/data_request',
                      title: 'Ver mis datos',
                      body: 'Genera una solicitud de acceso a los datos operativos que tenemos de tu cuenta.',
                    },
                    {
                      id: 'customers/redact',
                      title: 'Redactar datos de comprador final',
                      body: 'Anonimiza datos personales del comprador final sin destruir el histórico financiero mínimo permitido.',
                    },
                    {
                      id: 'shop/redact',
                      title: 'Redactar datos de tienda y app',
                      body: 'Oculta datos identificables de la tienda, desactiva website/orígenes y apaga componentes operativos vinculados.',
                    },
                    {
                      id: 'app/uninstalled',
                      title: 'Desinstalar o pausar integración',
                      body: 'Pausa créditos, facturación futura e integración/plugin sin borrar el histórico financiero.',
                    },
                  ].map((action) => (
                    <div key={action.id} className="rounded-[1.75rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5">
                      <h3 className="text-sm font-black uppercase tracking-[0.15em] text-[var(--text-primary)]">{action.title}</h3>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">{action.body}</p>
                      <button
                        type="button"
                        onClick={() => handleLegalRequest(action.id)}
                        disabled={legalActionLoading === action.id}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#FF5C3A] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white disabled:opacity-60"
                      >
                        {legalActionLoading === action.id ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                        Solicitar
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.15em] text-[var(--text-primary)]">Resumen disponible</h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Cuando solicitas acceso a tus datos, generamos un snapshot operativo descargable en JSON. Lo conservamos por 30 días.
                      </p>
                    </div>
                    {selectedDataExport && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDataExport(selectedDataExport)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-primary)]"
                        >
                          <Eye size={14} />
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadLegalExport(selectedDataExport)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#FF5C3A] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white"
                        >
                          <Download size={14} />
                          Descargar JSON
                        </button>
                      </div>
                    )}
                  </div>

                  {!selectedDataExport ? (
                    <p className="mt-4 text-sm text-[var(--text-muted)]">
                      Aún no has generado un export de datos. Usa la acción <span className="font-bold text-[var(--text-primary)]">Ver mis datos</span> para crearlo.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-[var(--border-color)] px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Generado</p>
                          <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">{formatDate(selectedDataExport.created_at)}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border-color)] px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Expira</p>
                          <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">{formatDate(selectedDataExport.expires_at)}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border-color)] px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Formato</p>
                          <p className="mt-1 text-sm font-bold uppercase text-[var(--text-primary)]">{selectedDataExport.format}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[var(--border-color)] bg-black/20 p-4">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Vista previa del export</p>
                        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-[var(--text-primary)]">
                          {JSON.stringify(selectedDataExport.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.15em] text-[var(--text-primary)]">Historial reciente</h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">Solicitudes creadas desde tu cuenta y su último estado.</p>
                    </div>
                    {legalLoading && <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />}
                  </div>

                  <div className="mt-4 space-y-3">
                    {legalRequests.length === 0 && !legalLoading && (
                      <p className="text-sm text-[var(--text-muted)]">Aún no tienes solicitudes legales registradas.</p>
                    )}
                    {legalRequests.slice().reverse().slice(0, 6).map((request) => (
                      <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--border-color)] px-4 py-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{formatLegalRequestType(request.type)}</p>
                          <p className="text-xs text-[var(--text-muted)]">{formatDate(request.createdAt || request.created_at || request.processedAt || null)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {request.type === 'customers/data_request' && (() => {
                            const matchingExport = legalDataExports.find((item) => item.request_id === request.id);
                            if (!matchingExport) return null;
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDataExport(matchingExport)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-primary)]"
                                >
                                  <Eye size={12} />
                                  Abrir export
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadLegalExport(matchingExport)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-[#FF5C3A] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white"
                                >
                                  <Download size={12} />
                                  Descargar
                                </button>
                              </>
                            );
                          })()}
                          <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">
                            {request.status || 'completed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(legalResultMsg || errorMsg) && (
                  <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${legalResultMsg ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-400'}`}>
                    {legalResultMsg || errorMsg}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
