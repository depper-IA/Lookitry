import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Política de Cookies — Lookitry',
  description: 'Información sobre las cookies que usa Lookitry, su propósito, duración y cómo gestionarlas.',
};

const COOKIES = [
  {
    name: 'JWT de sesión',
    purpose: 'Autenticación del usuario. Mantiene la sesión activa en el dashboard y la plataforma.',
    duration: 'Sesión (se elimina al cerrar el navegador o al cerrar sesión)',
    controller: 'Lookitry',
    type: 'Estrictamente necesaria',
  },
  {
    name: 'Preferencias de tema',
    purpose: 'Almacena la preferencia de tema (oscuro / claro) del usuario.',
    duration: '1 año',
    controller: 'Lookitry',
    type: 'Funcional',
  },
  {
    name: 'Cloudflare Turnstile',
    purpose: 'Verificación anti-bot durante el registro y formularios. Protege la plataforma de registros automatizados.',
    duration: 'Sesión',
    controller: 'Cloudflare Inc.',
    type: 'Estrictamente necesaria',
  },
  {
    name: 'Analytics de uso',
    purpose: 'Métricas anónimas de navegación (páginas visitadas, tiempo en sesión) para mejorar el servicio. No se asocian a datos personales identificables.',
    duration: '30 días',
    controller: 'Lookitry',
    type: 'Analítica (anónima)',
  },
  {
    name: 'Token de referido',
    purpose: 'Registra el código de referido para acreditar créditos al referente cuando un nuevo usuario completa su primer pago.',
    duration: '30 días',
    controller: 'Lookitry',
    type: 'Funcional',
  },
];

const TYPE_COLORS: Record<string, string> = {
  'Estrictamente necesaria': 'text-[#FF5C3A]',
  'Funcional': 'text-blue-400',
  'Analítica (anónima)': 'text-emerald-400',
};

export default function CookiesPage() {
  return (
    <div className="overflow-x-clip">
      <LandingNav />
      <main className="min-h-screen theme-bg-base">

        {/* Header */}
        <section className="px-6 md:px-8 py-16 md:py-24 border-b theme-border">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl theme-text tracking-tight">
              Política de cookies
            </h1>
            <p className="text-sm md:text-base mt-3 max-w-3xl theme-text-muted">
              Lookitry solo utiliza cookies estrictamente necesarias, funcionales y analíticas anónimas. No usamos cookies de publicidad ni rastreo invasivo.
            </p>
          </div>
        </section>

        {/* Resumen de tipos */}
        <section className="px-6 md:px-8 py-10 border-b theme-border">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border theme-border theme-bg-card p-5">
              <p className="text-[#FF5C3A] text-[11px] uppercase tracking-wider font-semibold mb-2">Estrictamente necesarias</p>
              <p className="text-sm theme-text-muted leading-relaxed">Autenticación, seguridad de sesión y protección anti-bot. Sin estas cookies el sitio no funciona.</p>
            </div>
            <div className="rounded-2xl border theme-border theme-bg-card p-5">
              <p className="text-blue-400 text-[11px] uppercase tracking-wider font-semibold mb-2">Funcionales</p>
              <p className="text-sm theme-text-muted leading-relaxed">Almacenan preferencias del usuario (tema, referidos) para mejorar la experiencia.</p>
            </div>
            <div className="rounded-2xl border theme-border theme-bg-card p-5">
              <p className="text-emerald-400 text-[11px] uppercase tracking-wider font-semibold mb-2">Analíticas anónimas</p>
              <p className="text-sm theme-text-muted leading-relaxed">Métricas de uso agregadas y anónimas. No identifican a ningún usuario. No usamos Google Analytics.</p>
            </div>
          </div>
        </section>

        {/* Tabla de cookies */}
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-jakarta font-bold text-xl theme-text mb-6">Detalle de cookies utilizadas</h2>

            <div className="theme-bg-card border theme-border rounded-2xl overflow-hidden divide-y theme-border">
              {COOKIES.map((cookie) => (
                <div key={cookie.name} className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                    <p className="font-jakarta font-bold text-sm theme-text">{cookie.name}</p>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${TYPE_COLORS[cookie.type] ?? 'theme-text-muted'}`}>
                      {cookie.type}
                    </span>
                  </div>
                  <p className="text-[13px] theme-text-muted leading-relaxed mb-3">{cookie.purpose}</p>
                  <div className="flex flex-col sm:flex-row gap-3 text-[12px] theme-text-muted">
                    <span><strong className="theme-text">Duración:</strong> {cookie.duration}</span>
                    <span className="hidden sm:inline theme-text-muted">·</span>
                    <span><strong className="theme-text">Controlador:</strong> {cookie.controller}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Gestión */}
            <div className="mt-10 theme-bg-card border theme-border rounded-2xl p-6 md:p-8">
              <h2 className="font-jakarta font-bold text-base theme-text mb-4">Cómo gestionar o eliminar cookies</h2>
              <p className="text-[13px] theme-text-muted leading-relaxed mb-4">
                Puedes bloquear o eliminar cookies desde la configuración de tu navegador. Ten en cuenta que bloquear cookies estrictamente necesarias puede impedir el funcionamiento de la plataforma.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] theme-text-muted">
                <div>
                  <strong className="theme-text">Chrome:</strong> Configuración → Privacidad y seguridad → Cookies
                </div>
                <div>
                  <strong className="theme-text">Firefox:</strong> Opciones → Privacidad y Seguridad
                </div>
                <div>
                  <strong className="theme-text">Safari:</strong> Preferencias → Privacidad
                </div>
                <div>
                  <strong className="theme-text">Edge:</strong> Configuración → Cookies y permisos del sitio
                </div>
              </div>
            </div>

            {/* Nota legal */}
            <div className="mt-8 pt-6 border-t theme-border text-center">
              <p className="text-[11px] theme-text-muted">
                Última actualización: mayo 2026 · Lookitry / Samuel Wilkie · NIT 700.403.166-3
              </p>
            </div>
          </div>
        </section>

      </main>
      <LandingFooter />
    </div>
  );
}
