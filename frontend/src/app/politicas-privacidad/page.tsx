import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

const BASE_URL = 'https://lookitry.com';

export const metadata: Metadata = {
  title: 'Política de Privacidad — Lookitry',
  description:
    'Política de privacidad y tratamiento de datos personales de Lookitry. Cumplimiento Ley 1581 de 2012 — Colombia.',
  alternates: { canonical: `${BASE_URL}/politicas-privacidad` },
  robots: { index: true, follow: false },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/politicas-privacidad`,
    title: 'Política de Privacidad — Lookitry',
    description: 'Política de privacidad y tratamiento de datos personales de Lookitry. Legislación colombiana.',
  },
};

const SECTIONS = [
  {
    title: '1. Responsable del tratamiento',
    content: `Lookitry, operada por Wilkie Devs SAS, es responsable del tratamiento de los datos personales recopilados a través de la plataforma lookitry.com.\n\nContacto: info@lookitry.com · WhatsApp: +57 310 543 6281`,
  },
  {
    title: '2. Datos que recopilamos',
    content: `Recopilamos los siguientes datos según el tipo de usuario:\n\n— Marcas y tiendas: nombre, correo electrónico, nombre de empresa, información de facturación y datos de uso de la plataforma.\n\n— Usuarios finales del probador virtual: imágenes temporales (selfies) utilizadas exclusivamente para generar el resultado visual. Estas imágenes no se almacenan de forma permanente y se eliminan automáticamente tras el procesamiento.\n\n— Datos de navegación: dirección IP, tipo de dispositivo, páginas visitadas y tiempo de sesión, recopilados de forma anónima para mejorar el servicio.`,
  },
  {
    title: '3. Finalidad del tratamiento',
    content: `Los datos personales son tratados para:\n\n— Prestar el servicio de probador virtual con IA.\n— Gestionar cuentas, suscripciones y facturación.\n— Enviar comunicaciones relacionadas con el servicio (actualizaciones, alertas de cuenta).\n— Mejorar la plataforma mediante análisis de uso agregado y anónimo.\n— Cumplir obligaciones legales y fiscales aplicables en Colombia.`,
  },
  {
    title: '4. Base legal del tratamiento',
    content: `El tratamiento de datos se realiza con base en:\n\n— El consentimiento del titular, otorgado al registrarse en la plataforma.\n— La ejecución del contrato de servicio entre Lookitry y la marca suscrita.\n— El cumplimiento de obligaciones legales bajo la Ley 1581 de 2012 y el Decreto 1377 de 2013.`,
  },
  {
    title: '5. Imágenes de usuarios finales',
    content: `Las selfies o fotografías subidas por los clientes finales de las marcas para usar el probador virtual son procesadas de forma temporal. No se almacenan en bases de datos permanentes, no se comparten con terceros y no se utilizan para entrenar modelos de inteligencia artificial.\n\nEl procesamiento ocurre en servidores seguros y la imagen es eliminada automáticamente una vez generado el resultado visual.`,
  },
  {
    title: '6. Compartición de datos con terceros',
    content: `Lookitry no vende ni cede datos personales a terceros con fines comerciales. Los datos pueden ser compartidos únicamente con:\n\n— Proveedores de infraestructura tecnológica (Supabase, servidores VPS) bajo acuerdos de confidencialidad.\n— Pasarelas de pago (Wompi) para procesar transacciones, quienes tienen sus propias políticas de privacidad.\n— Autoridades competentes cuando sea requerido por ley.`,
  },
  {
    title: '7. Derechos del titular (Ley 1581 de 2012)',
    content: `Como titular de datos personales, tienes derecho a:\n\n— Conocer, actualizar y rectificar tus datos personales.\n— Solicitar prueba de la autorización otorgada.\n— Ser informado sobre el uso de tus datos.\n— Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).\n— Revocar la autorización y solicitar la supresión de tus datos, salvo que exista obligación legal de conservarlos.\n\nPara ejercer estos derechos, escríbenos a info@lookitry.com.`,
  },
  {
    title: '8. Seguridad de los datos',
    content: `Implementamos medidas técnicas y organizativas para proteger los datos personales contra acceso no autorizado, pérdida o alteración. Esto incluye cifrado en tránsito (HTTPS/TLS), control de acceso por roles y auditorías periódicas de seguridad.`,
  },
  {
    title: '9. Cookies y tecnologías de seguimiento',
    content: `La plataforma utiliza cookies de sesión estrictamente necesarias para el funcionamiento del servicio (autenticación, preferencias). No utilizamos cookies de seguimiento publicitario ni compartimos datos de navegación con redes publicitarias.`,
  },
  {
    title: '10. Cambios en esta política',
    content: `Lookitry puede actualizar esta política en cualquier momento. Los cambios serán notificados mediante aviso en la plataforma o por correo electrónico con al menos 10 días de anticipación. El uso continuado del servicio tras la notificación implica la aceptación de los cambios.`,
  },
];

export default function PoliticasPrivacidadPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#f5f2ee]">
        {/* Header */}
        <div className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white tracking-tight mb-4">
              Política de Privacidad
            </h1>
            <p className="text-[#666] text-sm">
              Última actualización: marzo 2026 · Ley 1581 de 2012 — Colombia
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title} className="bg-white border border-[#e8e4df] rounded-2xl p-6 md:p-8">
                <h2 className="font-syne font-bold text-base text-[#0a0a0a] mb-3">{s.title}</h2>
                <div className="text-[14px] text-[#555] leading-relaxed whitespace-pre-line">{s.content}</div>
              </section>
            ))}

            <div className="text-center pt-4">
              <Link
                href="/terminos"
                className="text-[13px] text-[#FF5C3A] hover:underline"
              >
                Ver Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
