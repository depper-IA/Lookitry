import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Aviso Legal — Lookitry',
  description: 'Información legal y societaria de Lookitry. Titularidad, derechos de autor, autoridad competente y contacto.',
};

export default function AvisoLegalPage() {
  return (
    <div className="overflow-x-clip">
      <LandingNav />
      <main className="min-h-screen theme-bg-base">

        {/* Header */}
        <section className="px-6 md:px-8 py-16 md:py-24 border-b theme-border">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl theme-text tracking-tight">
              Aviso legal
            </h1>
            <p className="text-sm md:text-base mt-3 max-w-3xl theme-text-muted">
              Información de titularidad, derechos de autor, responsabilidad y contacto legal de la plataforma Lookitry.
            </p>
          </div>
        </section>

        {/* Titularidad */}
        <section className="px-6 md:px-8 py-12 border-b theme-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-jakarta font-bold text-base theme-text mb-5">Datos del titular</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border theme-border theme-bg-card p-6 space-y-2 text-sm theme-text">
                <p><strong className="theme-text">Titular:</strong> Samuel Wilkie</p>
                <p><strong className="theme-text">NIT:</strong> 700.403.166-3 (persona natural)</p>
                <p><strong className="theme-text">Marca de operación:</strong> Wilkie Devs</p>
                <p><strong className="theme-text">Marca comercial:</strong> Lookitry</p>
                <p><strong className="theme-text">País de domicilio:</strong> Colombia</p>
                <p><strong className="theme-text">Horario de atención:</strong> Lunes a Viernes, 9:00 AM – 6:00 PM (hora Colombia)</p>
              </div>
              <div className="rounded-2xl border theme-border theme-bg-card p-6 space-y-2 text-sm theme-text">
                <p><strong className="theme-text">Email legal:</strong> info@lookitry.com</p>
                <p><strong className="theme-text">WhatsApp:</strong> +57 310 543 6281</p>
                <p><strong className="theme-text">Sitio web:</strong> https://lookitry.com</p>
                <p><strong className="theme-text">API:</strong> https://api.lookitry.com</p>
                <p><strong className="theme-text">Sitio marca:</strong> https://wilkiedevs.com</p>
              </div>
            </div>
          </div>
        </section>

        {/* Derechos de autor */}
        <section className="px-6 md:px-8 py-10 border-b theme-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-jakarta font-bold text-base theme-text mb-4">Propiedad intelectual y derechos de autor</h2>
            <div className="theme-bg-card border theme-border rounded-2xl p-6 text-[13px] theme-text-muted leading-relaxed space-y-3">
              <p>
                Todos los derechos de propiedad intelectual sobre la plataforma Lookitry — incluyendo código fuente, diseño visual, logotipos, marcas, algoritmos, modelos de inteligencia artificial propios, documentación y contenidos — son propiedad exclusiva de Samuel Wilkie (NIT 700.403.166-3) o de sus licenciantes respectivos.
              </p>
              <p>
                Queda expresamente prohibida la reproducción, distribución, transformación o comunicación pública de cualquier elemento protegido sin autorización escrita previa del titular.
              </p>
              <p>
                Las marcas <strong className="theme-text">Lookitry</strong> y <strong className="theme-text">Wilkie Devs</strong> son marcas comerciales de Samuel Wilkie. Su uso no autorizado constituye una infracción de derechos de marca.
              </p>
            </div>
          </div>
        </section>

        {/* Autoridad competente */}
        <section className="px-6 md:px-8 py-10 border-b theme-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-jakarta font-bold text-base theme-text mb-4">Autoridad de supervisión y reclamaciones</h2>
            <div className="theme-bg-card border theme-border rounded-2xl p-6 text-[13px] theme-text-muted leading-relaxed space-y-3">
              <p>
                La autoridad competente en materia de protección al consumidor y datos personales en Colombia es la{' '}
                <strong className="theme-text">Superintendencia de Industria y Comercio (SIC)</strong>.
              </p>
              <p>
                Los usuarios pueden presentar reclamaciones directamente ante la SIC cuando consideren que sus derechos como consumidores o titulares de datos personales han sido vulnerados.
              </p>
              <p className="theme-text-muted">
                Portal SIC:{' '}
                <span className="theme-text">www.sic.gov.co</span>
              </p>
              <p>
                Antes de acudir a la SIC, recomendamos intentar resolver la reclamación directamente con Lookitry escribiendo a{' '}
                <strong className="theme-text">info@lookitry.com</strong>. Respondemos en un plazo máximo de 10 días hábiles.
              </p>
            </div>
          </div>
        </section>

        {/* Links legales */}
        <section className="px-6 md:px-8 py-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-jakarta font-bold text-base theme-text mb-4">Documentos legales relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { href: '/terminos', label: 'Términos y Condiciones' },
                { href: '/politicas-privacidad', label: 'Política de Privacidad' },
                { href: '/cookies', label: 'Política de Cookies' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="theme-bg-card border theme-border rounded-xl p-4 text-sm theme-text hover:border-[#FF5C3A] transition-colors text-center"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t theme-border text-center">
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
