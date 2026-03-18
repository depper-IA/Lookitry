'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

const ARTICLES = [
  { id: 'art1', title: 'Articulo 1. Identificacion del prestador', content: 'Lookitry es una plataforma de probador virtual con inteligencia artificial operada por Wilkie Devs SAS, empresa constituida bajo las leyes de la Republica de Colombia.\n\nCorreo: info@pruebalo.wilkiedevs.com\nWhatsApp: +57 310 543 6281' },
  { id: 'art2', title: 'Articulo 2. Aceptacion de los terminos', content: 'El acceso y uso de la plataforma Lookitry implica la aceptacion plena de los presentes Terminos y Condiciones.\n\nEstos terminos se rigen por la legislacion colombiana: Ley 527 de 1999, Ley 1480 de 2011 y Ley 1581 de 2012.' },
  { id: 'art3', title: 'Articulo 3. Descripcion del servicio', content: 'Lookitry ofrece un widget de probador virtual con IA para visualizar prendas, accesorios y calzado bajo modalidad SaaS.\n\nPlanes: Trial (7 dias), Basico (5 productos, 400 gen/mes), Pro (15 productos, 1.200 gen/mes), Mini-landing (pago unico).' },
  { id: 'art4', title: 'Articulo 4. Registro y cuenta de usuario', content: 'El usuario debe crear una cuenta con informacion veraz. Es responsable de mantener la confidencialidad de sus credenciales.\n\nLookitry puede suspender cuentas que incumplan estos terminos o realicen actividades fraudulentas.' },
  { id: 'art5', title: 'Articulo 5. Planes, precios y facturacion', content: 'Los precios estan en pesos colombianos (COP). Los planes se cobran de forma anticipada por el periodo seleccionado (1, 3, 6 o 12 meses).\n\nDescuentos por periodo: 5% (3 meses), 10% (6 meses), 15% (12 meses). Mini-landing es pago unico.' },
  { id: 'art6', title: 'Articulo 6. Medios de pago', content: 'Los pagos se procesan a traves de Wompi, pasarela certificada en Colombia. Se aceptan tarjetas debito y credito, PSE y Nequi. Lookitry no almacena datos de tarjetas.\n\nTambien se puede coordinar pago manual via WhatsApp o correo.' },
  { id: 'art7', title: 'Articulo 7. Derecho de retracto (Art. 47, Ley 1480 de 2011)', content: 'El consumidor puede retractarse dentro de los 5 dias habiles siguientes a la transaccion.\n\nContacto: info@pruebalo.wilkiedevs.com o WhatsApp +57 310 543 6281.\n\nNo aplica cuando el servicio fue ejecutado con consentimiento expreso. El reembolso se realiza en 30 dias por el mismo medio de pago.' },
  { id: 'art8', title: 'Articulo 8. Politica de reembolsos', content: 'Fuera del periodo de retracto, no se realizan reembolsos por periodos ya iniciados. En caso de falla tecnica de Lookitry por mas de 72 horas continuas, el usuario puede solicitar extension o credito proporcional.\n\nSolicitudes a info@pruebalo.wilkiedevs.com con asunto "Solicitud de reembolso". Plazo: 10 dias habiles.' },
  { id: 'art9', title: 'Articulo 9. Uso aceptable del servicio', content: 'El usuario se compromete a usar el servicio de forma licita. Esta prohibido:\n\n- Generar contenido ilegal, ofensivo o discriminatorio\n- Acceder a cuentas de otros usuarios sin autorizacion\n- Realizar ingenieria inversa o extraer el codigo fuente\n- Revender o sublicenciar el acceso sin autorizacion\n- Superar limites de generaciones mediante automatizacion' },
  { id: 'art10', title: 'Articulo 10. Propiedad intelectual', content: 'Todos los derechos sobre Lookitry son propiedad de Wilkie Devs SAS o sus licenciantes.\n\nEl usuario conserva los derechos sobre sus imagenes. Otorga a Lookitry una licencia limitada y revocable para procesarlas con el unico fin de prestar el servicio. Las imagenes no se compartiran con terceros ni se usaran para entrenar modelos de IA.' },
  { id: 'art11', title: 'Articulo 11. Tratamiento de datos personales (Ley 1581 de 2012)', content: 'Lookitry trata los datos conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013. Los datos se usan exclusivamente para prestar el servicio.\n\nDerechos ARCO: info@pruebalo.wilkiedevs.com con asunto "Derechos ARCO".\n\nLas imagenes procesadas se eliminan automaticamente tras la generacion.' },
  { id: 'art12', title: 'Articulo 12. Limitacion de responsabilidad', content: 'Lookitry no garantiza disponibilidad ininterrumpida. La plataforma se ofrece tal como esta. No sera responsable por danos indirectos o consecuentes.\n\nLa responsabilidad maxima no excedera el valor pagado por el plan en el mes en que ocurrio el dano.' },
  { id: 'art13', title: 'Articulo 13. Modificaciones al servicio y a los terminos', content: 'Lookitry puede modificar estos terminos en cualquier momento. Los cambios se notificaran con al menos 15 dias de anticipacion por correo o aviso en la plataforma. El uso continuado implica aceptacion.' },
  { id: 'art14', title: 'Articulo 14. Ley aplicable y jurisdiccion', content: 'Estos terminos se rigen por las leyes de Colombia. Las controversias se resuelven primero por negociacion directa; de no haber acuerdo, ante los jueces de Bogota D.C.\n\nPara asuntos de consumo: Superintendencia de Industria y Comercio (SIC) en www.sic.gov.co.' },
];

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function TerminosClient() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const toggle = (id: string) => setActiveId(prev => (prev === id ? null : id));

  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#f5f2ee]">
        <div className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white tracking-tight mb-4">
              Terminos y Condiciones
            </h1>
            <p className="text-[#666] text-sm">
              Ultima actualizacion: marzo 2026 · Ley 1480 de 2011 · Ley 1581 de 2012 · Colombia
            </p>
          </div>
        </div>

        <div className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto space-y-3">

            <div className="bg-white border border-[#e8e4df] rounded-2xl p-6 mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#FF5C3A] mb-4">Indice</p>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {ARTICLES.map((a, i) => (
                  <li key={a.id}>
                    <button
                      onClick={() => {
                        setActiveId(a.id);
                        setTimeout(() => document.getElementById(a.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                      }}
                      className="text-left text-[12px] text-[#888] hover:text-[#FF5C3A] transition-colors leading-snug py-0.5 w-full"
                    >
                      <span className="text-[#bbb] mr-1.5">{String(i + 1).padStart(2, '0')}.</span>
                      {a.title.replace(/^Articulo \d+\. /, '')}
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            {ARTICLES.map(a => {
              const isOpen = activeId === a.id;
              return (
                <div key={a.id} id={a.id} className="bg-white border border-[#e8e4df] rounded-2xl overflow-hidden scroll-mt-24">
                  <button
                    onClick={() => toggle(a.id)}
                    className="w-full flex items-center justify-between gap-3 px-6 py-5 text-left hover:bg-[#faf8f5] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-syne font-semibold text-[14px] text-[#0a0a0a] leading-snug">{a.title}</span>
                    <span style={{ color: isOpen ? '#FF5C3A' : '#bbb' }}>
                      <IconChevron open={isOpen} />
                    </span>
                  </button>
                  <div style={{ maxHeight: isOpen ? '600px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                    <div className="px-6 pb-6 border-t border-[#f0ece8]">
                      <p className="pt-4 text-[13px] text-[#666] leading-relaxed whitespace-pre-line">{a.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-white border border-[#e8e4df] rounded-2xl p-6 mt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,92,58,0.1)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF5C3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p className="font-syne font-bold text-[13px] text-[#0a0a0a] mb-1">Aviso de privacidad</p>
                  <p className="text-[12px] text-[#666] leading-relaxed">
                    Al realizar un pago en Lookitry, aceptas que tus datos personales sean tratados conforme a nuestra{' '}
                    <Link href="/politicas-privacidad" className="text-[#FF5C3A] hover:underline">Politica de Privacidad</Link>
                    , de acuerdo con la Ley 1581 de 2012. Los datos de pago son procesados directamente por Wompi.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-[12px] text-[#999]">
                Preguntas:{' '}
                <a href="mailto:info@pruebalo.wilkiedevs.com" className="text-[#FF5C3A] hover:underline">info@pruebalo.wilkiedevs.com</a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}