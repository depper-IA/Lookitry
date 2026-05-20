import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

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
    content: `Lookitry, operada por Samuel Wilkie (NIT 700.403.166-3), bajo la marca Wilkie Devs, es responsable del tratamiento de los datos personales recopilados a través de la plataforma lookitry.com.\n\nContacto: info@lookitry.com · WhatsApp: +57 310 543 6281\n\nMarco regulatorio de cumplimiento:\nLookitry opera como persona natural, por lo que, conforme a la normativa de la SIC y la Ley 1581 de 2012, está exenta de la obligación de inscripción en el Registro Nacional de Bases de Datos (RNBD) al no ser entidad pública ni sociedad privada con activos superiores a 100.000 UVT. No obstante, Lookitry cumple voluntariamente con todos los principios y obligaciones establecidos en la Ley 1581 de 2012 y el Decreto 1377 de 2013.`,
  },
  {
    title: '2. Datos que recopilamos y tipos de titulares',
    content: `Lookitry opera bajo un modelo B2B2C con dos tipos de titulares de datos diferenciados:\n\nTipo A — Marcas y tiendas (cliente directo de Lookitry):\n— Nombre, correo electrónico, nombre de empresa, información de facturación y datos de uso de la plataforma.\n— Lookitry es responsable directo del tratamiento de estos datos.\n\nTipo B — Usuarios finales del probador virtual (cliente del cliente):\n— Imágenes faciales (selfies): son datos biométricos clasificados como DATOS SENSIBLES bajo el Artículo 5 de la Ley 1581 de 2012. Su tratamiento exige consentimiento explícito, previo e informado.\n— El tratamiento es temporal: la imagen se elimina automáticamente tras generar el resultado visual.\n— Lookitry actúa como encargado del tratamiento en nombre de la marca, que es la responsable frente a sus usuarios finales.\n— Estas imágenes NO se almacenan de forma permanente, NO se comparten con terceros con fines comerciales y NO se utilizan para entrenar modelos de inteligencia artificial.\n\nDatos de navegación (todos los usuarios):\n— Dirección IP, tipo de dispositivo, páginas visitadas y tiempo de sesión, recopilados de forma anónima para mejorar el servicio.`,
  },
  {
    title: '2-B. Base legal diferenciada para datos biométricos',
    content: `El tratamiento de imágenes biométricas (selfies) requiere una base legal reforzada, distinta a la del contrato de servicio general:\n\n— Base legal para Marcas (Tipo A): ejecución del contrato de servicio SaaS + consentimiento en el registro.\n— Base legal para Usuarios Finales (Tipo B): consentimiento explícito, libre, previo, informado e inequívoco obtenido por la marca antes de que el usuario acceda al probador virtual.\n\nLa marca garantiza a Lookitry que cuenta con dicho consentimiento. El incumplimiento de esta garantía activa la cláusula de indemnización establecida en los Términos y Condiciones (Artículo 10-B).`,
  },
  {
    title: '3. Finalidad del tratamiento',
    content: `Los datos personales son tratados para las siguientes finalidades:\n\nComunicaciones de servicio (base legal: ejecución del contrato):\n— Prestar el servicio de probador virtual con IA.\n— Gestionar cuentas, suscripciones y facturación.\n— Enviar notificaciones transaccionales: alertas de cuenta, confirmaciones de pago, vencimientos de suscripción y actualizaciones críticas del servicio.\n\nComunicaciones de marketing (base legal: consentimiento):\n— Enviar boletines informativos, anuncios de nuevas funcionalidades y promociones.\n— El usuario puede otorgar o revocar este consentimiento en cualquier momento desde la configuración de su cuenta o escribiendo a info@lookitry.com con asunto "Baja de comunicaciones comerciales".\n— La negativa a recibir comunicaciones de marketing NO afecta el acceso al servicio ni sus condiciones.\n\nMejora del servicio (base legal: interés legítimo):\n— Analizar el uso de la plataforma de forma agregada y anónima.\n— Cumplir obligaciones legales y fiscales aplicables en Colombia.`,
  },
  {
    title: '4. Base legal del tratamiento',
    content: `El tratamiento de datos se realiza con base en:\n\n— El consentimiento del titular, otorgado al registrarse en la plataforma.\n— La ejecución del contrato de servicio entre Lookitry y la marca suscrita.\n— El cumplimiento de obligaciones legales bajo la Ley 1581 de 2012 y el Decreto 1377 de 2013.`,
  },
  {
    title: '5. Imágenes de usuarios finales',
    content: `Flujo técnico del procesamiento (paso a paso):\n\n1. El usuario final sube su imagen (selfie) en el widget integrado en la tienda de la marca.\n2. La imagen es enviada de forma cifrada (HTTPS/TLS) al servidor de Lookitry.\n3. Un modelo de segmentación (Vertex AI/SAM2) identifica el área corporal relevante sin almacenar la imagen completa.\n4. El modelo generativo combina la zona segmentada con la fotografía del producto para producir el resultado visual.\n5. El resultado se muestra al usuario y se almacena temporalmente según los plazos de la Sección 7.\n6. La imagen original (selfie) es eliminada automáticamente tras el procesamiento — no se conserva en ninguna base de datos permanente.\n\nDeduplicación: Si el mismo usuario genera el mismo producto con una imagen idéntica, el sistema puede devolver el resultado previo sin reprocesar la imagen ni consumir créditos adicionales. Para este fin se almacena temporalmente un hash (huella criptográfica) de la imagen, sin la imagen original.\n\nPara la clasificación legal de estas imágenes como datos biométricos y datos sensibles, ver Secciones 2 y 2-B.`,
  },
  {
    title: '6. Compartición de datos con terceros',
    content: `Lookitry no vende ni cede datos personales a terceros con fines comerciales. Los datos pueden ser compartidos únicamente con:\n\n— Proveedores de infraestructura tecnológica (Supabase, servidores VPS) bajo acuerdos de confidencialidad.\n— Pasarelas de pago (Wompi, PayPal) para procesar transacciones. Cada pasarela opera bajo sus propias políticas de privacidad y es responsable del tratamiento de los datos de pago que recibe directamente.\n— Proveedores de inteligencia artificial (Google Cloud/Vertex AI, OpenRouter) para el procesamiento de imágenes del probador virtual, bajo acuerdos contractuales de confidencialidad.\n— Autoridades competentes cuando sea requerido por ley.`,
  },
  {
    title: '6-B. Transferencia internacional de datos',
    content: `De conformidad con el Artículo 26 de la Ley 1581 de 2012, Lookitry informa que algunos datos personales pueden ser transferidos a países con niveles de protección distintos al de Colombia, dado que ciertos proveedores tecnológicos operan en servidores internacionales:\n\n— Google Cloud (Vertex AI / Gemini): procesamiento de imágenes en servidores de Estados Unidos.\n— Supabase: base de datos e infraestructura de autenticación en servidores de Estados Unidos.\n— OpenRouter: servicio de fallback de IA en servidores de Estados Unidos.\n— Pasarelas de pago (Wompi, PayPal): operan bajo sus propias políticas de privacidad.\n\nSalvaguardas aplicadas:\n— Cláusulas contractuales de confidencialidad con cada proveedor.\n— Cifrado de extremo a extremo (HTTPS/TLS) en toda transmisión de datos.\n— Los datos biométricos (selfies) no se almacenan de forma permanente en servidores internacionales.\n— Los proveedores tienen prohibido utilizar los datos para fines distintos a la prestación del servicio contratado.\n\nAl registrarse en la plataforma, el usuario autoriza expresamente estas transferencias en los términos descritos.`,
  },
  {
    title: '7. Retención, archivo y redacción legal',
    content: `Esta política aplica a todos los planes y productos de Lookitry, incluyendo TRIAL, BASIC, PRO, ENTERPRISE, mini-landings y add-ons.\n\nPlazos de retención por categoría de dato:\n— Imágenes biométricas (selfies): eliminación automática inmediata tras la generación del resultado (minutos).\n— Datos de cuenta activa: mientras la cuenta permanezca activa.\n— Datos de cuenta cancelada: 90 días calendario tras la cancelación definitiva, luego eliminación o anonimización.\n— Registros financieros (pagos, referencias, trazabilidad contable): 5 años por obligación legal contable colombiana.\n— Logs de seguridad y auditoría: 12 meses.\n\nReglas adicionales:\n— El archivo operativo de una cuenta no implica borrado automático del histórico financiero.\n— Cuando exista una solicitud formal de supresión, anonimizaremos los datos personales identificables sin destruir el histórico financiero mínimo legalmente requerido.\n— La desinstalación de la integración puede pausar facturación futura, créditos y sincronizaciones, sin alterar el historial de pagos ya devengado.`,
  },
  {
    title: '8. Derechos del titular (Ley 1581 de 2012)',
    content: `Como titular de datos personales, tienes derecho a (Derechos ARCO):\n\n— Acceso: conocer qué datos personales tenemos sobre ti y cómo los usamos.\n— Rectificación: actualizar o corregir tus datos cuando sean inexactos o incompletos.\n— Cancelación/Supresión: solicitar la eliminación de tus datos, salvo que exista obligación legal de conservarlos.\n— Oposición: oponerte al tratamiento de tus datos para fines específicos.\n— Revocar la autorización otorgada en cualquier momento.\n— Solicitar prueba de la autorización otorgada.\n— Presentar quejas ante la Superintendencia de Industria y Comercio (SIC): www.sic.gov.co\n\nPlazo de respuesta: Lookitry responderá las solicitudes ARCO en un plazo máximo de 10 días hábiles, conforme al Artículo 14 de la Ley 1581 de 2012. Si la solicitud no puede resolverse en ese plazo, se informará al titular dentro de los mismos 10 días hábiles indicando el motivo y la fecha estimada de resolución.\n\nCanales para ejercer tus derechos:\n— Correo: info@lookitry.com con asunto "Derechos ARCO"\n— Autoservicio: desde la página de perfil de tu cuenta (solicitudes inmediatas disponibles)`,
  },
  {
    title: '9. Autoservicio de solicitudes legales',
    content: `Desde la página de perfil de tu cuenta puedes iniciar solicitudes automáticas de privacidad y datos, incluyendo:\n\n— customers/data_request: acceso a los datos operativos asociados a tu cuenta.\n— customers/redact: redacción de datos personales del comprador final cuando aplique.\n— shop/redact: redacción de datos de tienda/app dentro del alcance legal solicitado.\n— app/uninstalled: pausa operativa de integración, créditos y facturación futura.\n\nAlgunas solicitudes se procesan de inmediato y otras pueden completarse de forma asíncrona con trazabilidad interna.`,
  },
  {
    title: '10. Seguridad de los datos',
    content: `Implementamos medidas técnicas y organizativas para proteger los datos personales contra acceso no autorizado, pérdida o alteración. Esto incluye cifrado en tránsito (HTTPS/TLS), autenticación JWT con cookies HTTP-only, control de acceso basado en roles (RBAC) y auditorías periódicas de seguridad.`,
  },
  {
    title: '10-B. Protocolo de notificación ante brechas de seguridad',
    content: `En caso de detectar un incidente de seguridad que comprometa datos personales, Lookitry activará el siguiente protocolo conforme a la Resolución 95698 de 2023 de la SIC:\n\nNotificación a la SIC:\n— Lookitry notificará a la Superintendencia de Industria y Comercio dentro de los 15 días hábiles siguientes a la detección del incidente.\n— La notificación incluirá: naturaleza del incidente, tipo de datos comprometidos, número aproximado de titulares afectados, medidas adoptadas y punto de contacto designado.\n\nNotificación a los titulares afectados:\n— Los usuarios afectados serán notificados individualmente (por correo electrónico) dentro del mismo plazo de 15 días hábiles.\n— La notificación indicará: qué datos fueron comprometidos, medidas correctivas adoptadas y recomendaciones de seguridad para el usuario.\n\nMedidas inmediatas:\n— Contención del incidente y evaluación del impacto.\n— Registro documentado en el libro de incidencias de seguridad.\n— Revisión y refuerzo de las medidas de seguridad para prevenir recurrencia.\n\nPara reportar una vulnerabilidad o incidente: info@lookitry.com — Asunto: "Incidente de Seguridad".`,
  },
  {
    title: '11. Cookies y tecnologías de seguimiento',
    content: `La plataforma utiliza cookies de sesión estrictamente necesarias para el funcionamiento del servicio (autenticación, preferencias). No utilizamos cookies de seguimiento publicitario ni compartimos datos de navegación con redes publicitarias.`,
  },
  {
    title: '12. Cambios en esta política',
    content: `Lookitry puede actualizar esta política en cualquier momento. Los cambios serán notificados mediante aviso en la plataforma o por correo electrónico con al menos 10 días de anticipación. El uso continuado del servicio tras la notificación implica la aceptación de los cambios.`,
  },
];

export default function PoliticasPrivacidadPage() {
  return (
    <div className="overflow-x-clip">
      <LandingNav />
      <main className="min-h-screen theme-bg-base">
        {/* Header */}
        <div className="dark:bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20 border-b theme-border">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-jakarta font-extrabold text-3xl md:text-4xl theme-text tracking-tight mb-4">
              Política de Privacidad
            </h1>
            <p className="text-sm theme-text-muted">
              Última actualización: mayo 2026 · Ley 1581 de 2012 — Colombia
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title} className="theme-bg-card border theme-border rounded-2xl p-6 md:p-8">
                <h2 className="font-jakarta font-bold text-base theme-text mb-3">{s.title}</h2>
                <div className="text-[14px] theme-text-muted leading-relaxed whitespace-pre-line">{s.content}</div>
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
    </div>
  );
}
