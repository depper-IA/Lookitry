'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

const ARTICLES = [
  {
    id: 'art1',
    title: 'Artículo 1. Identificación del prestador',
    content: `Lookitry es una plataforma de probador virtual con inteligencia artificial operada por Wilkie Devs SAS, empresa constituida bajo las leyes de la República de Colombia. Para efectos de estos términos, "Lookitry", "nosotros" o "la plataforma" hacen referencia a dicha entidad.

Correo de contacto: info@pruebalo.wilkiedevs.com
WhatsApp: +57 310 543 6281`,
  },
  {
    id: 'art2',
    title: 'Artículo 2. Aceptación de los términos',
    content: `El acceso y uso de la plataforma Lookitry implica la aceptación plena y sin reservas de los presentes Términos y Condiciones. Si no está de acuerdo con alguna de las disposiciones aquí contenidas, debe abstenerse de utilizar el servicio.

Estos términos se rigen por la legislación colombiana, en particular por la Ley 527 de 1999 (comercio electrónico), la Ley 1480 de 2011 (Estatuto del Consumidor) y la Ley 1581 de 2012 (protección de datos personales).`,
  },
  {
    id: 'art3',
    title: 'Artículo 3. Descripción del servicio',
    content: `Lookitry ofrece un widget de probador virtual con inteligencia artificial que permite a los usuarios finales visualizar prendas, accesorios y calzado sobre su propia imagen antes de realizar una compra. El servicio se presta bajo modalidad SaaS (Software as a Service) a marcas y tiendas en Latinoamérica.

Los planes disponibles son:
- Plan Trial: 7 días gratuitos con funcionalidades limitadas.
- Plan Básico: hasta 5 productos y 400 generaciones por mes.
- Plan Pro: hasta 15 productos y 1.200 generaciones por mes.
- Mini-landing: página pública con probador integrado, pago único.`,
  },
  {
    id: 'art4',
    title: 'Artículo 4. Registro y cuenta de usuario',
    content: `Para acceder al servicio, el usuario debe crear una cuenta proporcionando información veraz, completa y actualizada. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades realizadas desde su cuenta.

Lookitry se reserva el derecho de suspender o cancelar cuentas que incumplan estos términos, que proporcionen información falsa o que realicen actividades fraudulentas o contrarias a la ley.`,
  },
  {
    id: 'art5',
    title: 'Artículo 5. Planes, precios y facturación',
    content: `Los precios de los planes están expresados en pesos colombianos (COP) e incluyen IVA cuando aplique. Los planes de suscripción se cobran de forma anticipada por el período seleccionado (1, 3, 6 o 12 meses).

El plan Mini-landing corresponde a un pago único no recurrente. Los precios pueden variar y serán informados antes de completar cualquier transacción. Los descuentos por período (5%, 10%, 15%) se aplican automáticamente al seleccionar planes multimensuales.`,
  },
  {
    id: 'art6',
    title: 'Artículo 6. Medios de pago',
    content: `Los pagos se procesan a través de Wompi, pasarela de pagos certificada en Colombia. Se aceptan tarjetas débito y crédito, PSE y Nequi. Lookitry no almacena datos de tarjetas ni información financiera sensible del usuario.

También se ofrece la posibilidad de coordinar el pago de forma manual a través de WhatsApp o correo electrónico, sujeto a confirmación por parte del equipo de Lookitry.`,
  },
  {
    id: 'art7',
    title: 'Artículo 7. Derecho de retracto (Art. 47, Ley 1480 de 2011)',
    content: `De conformidad con el Artículo 47 de la Ley 1480 de 2011 (Estatuto del Consumidor de Colombia), el consumidor tiene derecho a retractarse de una compra realizada a través de medios electrónicos dentro de los cinco (5) días hábiles siguientes a la fecha de la transacción o a la entrega del bien o servicio, lo que ocurra después.

Para ejercer este derecho, el usuario debe comunicarse con nosotros a través de info@pruebalo.wilkiedevs.com o al WhatsApp +57 310 543 6281, indicando el número de transacción y la solicitud de retracto.

Excepciones: El derecho de retracto no aplica cuando el servicio digital ha sido completamente ejecutado con el consentimiento previo y expreso del consumidor, ni cuando el usuario ha hecho uso efectivo del servicio (generaciones de IA realizadas, mini-landing activada y publicada).

El reembolso, cuando proceda, se realizará dentro de los treinta (30) días calendario siguientes a la aceptación de la solicitud, a través del mismo medio de pago utilizado.`,
  },
  {
    id: 'art8',
    title: 'Artículo 8. Política de reembolsos',
    content: `Fuera del período de retracto legal, no se realizan reembolsos por períodos de suscripción ya iniciados. En caso de falla técnica imputable a Lookitry que impida el uso del servicio por más de 72 horas continuas, el usuario podrá solicitar una extensión equivalente del período afectado o un crédito proporcional.

Las solicitudes de reembolso deben enviarse a info@pruebalo.wilkiedevs.com con el asunto "Solicitud de reembolso" y serán evaluadas en un plazo máximo de 10 días hábiles.`,
  },
  {
    id: 'art9',
    title: 'Artículo 9. Uso aceptable del servicio',
    content: `El usuario se compromete a utilizar el servicio de forma lícita y conforme a estos términos. Está prohibido:

- Usar el servicio para generar contenido ilegal, ofensivo, discriminatorio o que vulnere derechos de terceros.
- Intentar acceder a sistemas, cuentas o datos de otros usuarios sin autorización.
- Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la plataforma.
- Revender, sublicenciar o transferir el acceso al servicio sin autorización expresa de Lookitry.
- Superar los límites de generaciones establecidos en el plan contratado mediante automatización o scripts.`,
  },
  {
    id: 'art10',
    title: 'Artículo 10. Propiedad intelectual',
    content: `Todos los derechos de propiedad intelectual sobre la plataforma Lookitry, incluyendo su código, diseño, marca, logotipos y tecnología de inteligencia artificial, son propiedad exclusiva de Wilkie Devs SAS o de sus licenciantes.

El usuario conserva todos los derechos sobre las imágenes que sube a la plataforma. Al usar el servicio, el usuario otorga a Lookitry una licencia limitada, no exclusiva y revocable para procesar dichas imágenes con el único fin de prestar el servicio contratado. Las imágenes no serán compartidas con terceros ni utilizadas para entrenar modelos de IA sin consentimiento expreso.`,
  },
  {
    id: 'art11',
    title: 'Artículo 11. Tratamiento de datos personales (Ley 1581 de 2012)',
    content: `Lookitry trata los datos personales de sus usuarios de conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013. Los datos recopilados (nombre, correo electrónico, imágenes) se utilizan exclusivamente para la prestación del servicio, la gestión de la cuenta y el envío de comunicaciones relacionadas con el servicio.

El usuario tiene derecho a conocer, actualizar, rectificar y suprimir sus datos personales. Para ejercer estos derechos, puede escribir a info@pruebalo.wilkiedevs.com con el asunto "Derechos ARCO".

Los datos no serán vendidos ni cedidos a terceros con fines comerciales. Las imágenes procesadas por el motor de IA se eliminan automáticamente tras la generación del resultado.`,
  },
  {
    id: 'art12',
    title: 'Artículo 12. Limitación de responsabilidad',
    content: `Lookitry no garantiza que el servicio esté disponible de forma ininterrumpida o libre de errores. La plataforma se ofrece "tal como está" y "según disponibilidad". En ningún caso Lookitry será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso del servicio.

La responsabilidad máxima de Lookitry frente al usuario no excederá el valor pagado por el plan en el mes en que ocurrió el daño.`,
  },
  {
    id: 'art13',
    title: 'Artículo 13. Modificaciones al servicio y a los términos',
    content: `Lookitry se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios serán notificados al usuario mediante correo electrónico o mediante aviso visible en la plataforma con al menos 15 días de anticipación. El uso continuado del servicio tras la notificación implica la aceptación de los nuevos términos.

Lookitry también puede modificar, suspender o descontinuar funcionalidades del servicio, notificando al usuario con la mayor anticipación posible.`,
  },
  {
    id: 'art14',
    title: 'Artículo 14. Ley aplicable y jurisdicción',
    content: `Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier controversia derivada de su interpretación o ejecución será resuelta, en primera instancia, mediante negociación directa entre las partes. De no llegarse a un acuerdo, las partes se someten a la jurisdicción de los jueces y tribunales competentes de la ciudad de Bogotá D.C., Colombia.

Para asuntos de consumo, el usuario también puede acudir a la Superintendencia de Industria y Comercio (SIC) a través de www.sic.gov.co.`,
  },
];

function IconDoc() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5C3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function TerminosPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggle = (id: string) => setActiveId(prev => (prev === id ? null : id));

  return (
    <main style={{ fontFamily: 'DM Sans, sans-serif' }} className="min-h-screen bg-[#0a0a0a]">

      {/* NAV */}
      <LandingNav />

      {/* HERO */}
      <section className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-6 md:px-8 py-14 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,58,0.12)' }}>
              <IconDoc />
            </div>
            <span className="text-[11px] font-semibold tracking-[.12em] uppercase text-[#FF5C3A]">Documento legal</span>
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-3xl md:text-4xl text-white tracking-tight mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-[#777] text-[14px] leading-relaxed max-w-xl">
            Última actualización: marzo de 2026. Estos términos regulan el uso de la plataforma Lookitry y son de obligatorio cumplimiento para todos los usuarios.
          </p>
          <div className="flex items-center gap-2 mt-5 text-[12px] text-[#555]">
            <IconShield />
            Ley 1480 de 2011 · Ley 1581 de 2012 · Ley 527 de 1999 — Colombia
          </div>
        </div>
      </section>

      {/* CONTENIDO */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-12 md:py-16">

        {/* Índice */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#FF5C3A] mb-4">Índice</p>
          <ol className="space-y-1.5">
            {ARTICLES.map((a, i) => (
              <li key={a.id}>
                <a
                  href={`#${a.id}`}
                  className="text-[13px] text-[#888] hover:text-[#FF5C3A] transition-colors leading-snug block py-0.5"
                  onClick={e => { e.preventDefault(); setActiveId(a.id); document.getElementById(a.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                >
                  <span className="text-[#444] mr-2">{String(i + 1).padStart(2, '0')}.</span>
                  {a.title.replace(/^Artículo \d+\. /, '')}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Artículos */}
        <div className="space-y-3">
          {ARTICLES.map(a => (
            <div
              key={a.id}
              id={a.id}
              className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden scroll-mt-20"
            >
              <button
                onClick={() => toggle(a.id)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#1a1a1a] transition-colors"
                aria-expanded={activeId === a.id}
              >
                <span style={{ fontFamily: 'Syne, sans-serif' }} className="font-semibold text-[14px] text-white leading-snug">
                  {a.title}
                </span>
                <IconChevron open={activeId === a.id} />
              </button>
              {activeId === a.id && (
                <div className="px-5 pb-5 border-t border-[#1f1f1f]">
                  <div className="pt-4 text-[13px] text-[#999] leading-relaxed whitespace-pre-line">
                    {a.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Aviso de privacidad antes del pago */}
        <div className="mt-10 bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,92,58,0.12)' }}>
              <IconShield />
            </div>
            <div>
              <p style={{ fontFamily: 'Syne, sans-serif' }} className="font-semibold text-[14px] text-white mb-1">
                Aviso de privacidad
              </p>
              <p className="text-[12px] text-[#777] leading-relaxed">
                Al realizar un pago en Lookitry, aceptas que tus datos personales (nombre, correo, información de pago) sean tratados conforme a nuestra política de privacidad descrita en el Artículo 11, de acuerdo con la Ley 1581 de 2012. Los datos de pago son procesados directamente por Wompi y no son almacenados por Lookitry.
              </p>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="mt-6 text-center">
          <p className="text-[12px] text-[#555]">
            ¿Tienes preguntas sobre estos términos?{' '}
            <a href="mailto:info@pruebalo.wilkiedevs.com" className="text-[#FF5C3A] hover:underline">
              info@pruebalo.wilkiedevs.com
            </a>
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <LandingFooter />

    </main>
  );
}
