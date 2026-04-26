'use client';

import Link from 'next/link';
import { useState } from 'react';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import type { PricingConfig } from '@/lib/pricing';

interface Props {
  pricing: PricingConfig;
}

// Helper para formatear COP
function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function buildArticles(pricing: PricingConfig) {
  return [
  {
    id: 'art1',
    title: 'Articulo 1. Identificacion del prestador',
    content: 'Lookitry es una plataforma de probador virtual con inteligencia artificial operada por Samuel Wilkie, persona natural con NIT 700.403.166-3, bajo la marca Wilkie Devs.\n\nTitular: Samuel Wilkie\nNIT: 700.403.166-3 (persona natural)\nMarca: Wilkie Devs\nSitio de la marca: https://wilkiedevs.com\nMarca comercial: Lookitry\nCorreo electronico: info@lookitry.com\nWhatsApp: +57 310 543 6281\nSitio web: https://lookitry.com\nAPI: https://api.lookitry.com\nHorario de atencion: Lunes a Viernes, 9:00 AM - 6:00 PM (hora de Colombia)',
  },
  {
    id: 'art2',
    title: 'Articulo 2. Aceptacion de los terminos',
    content: 'El acceso, registro y uso de la plataforma Lookitry implica la aceptacion plena e incondicional de los presentes Terminos y Condiciones de Servicio.\n\nEstos terminos constituyen un acuerdo vinculante entre el usuario y Samuel Wilkie (NIT 700.403.166-3), operando bajo la marca Wilkie Devs. Si el usuario no esta de acuerdo con estos terminos, debera abstenerse de utilizar la plataforma.\n\nMarco legal aplicable:\n- Ley 527 de 1999: Comercio electronico y firmas digitales\n- Ley 1480 de 2011: Estatuto del consumidor\n- Ley 1581 de 2012: Proteccion de datos personales\n- Decreto 1377 de 2013: Reglamentacion de proteccion de datos',
  },
  {
    id: 'art3',
    title: 'Articulo 3. Descripcion del servicio',
    content: 'Lookitry ofrece un widget de probador virtual impulsado por inteligencia artificial (IA) que permite a los usuarios finales visualizar como lucen prendas de vestir, accesorios y calzado sobre su propia imagen, bajo la modalidad de Software como Servicio (SaaS).\n\nEl servicio incluye:\n- Widget de probador virtual integrable en sitios web y tiendas en linea (incluyendo WooCommerce)\n- Mini-Landing: pagina independiente de probador virtual para cada marca\n- Panel de gestion de productos y generaciones para marcas\n- API para desarrolladores\n- Sistema de retroalimentacion con mejora continua basada en RAG (Retrieval-Augmented Generation)\n- Programa de referidos con beneficios para ambas partes\n- Codigo de cupones de descuento\n\nLas marcas pueden integrar el widget en sus tiendas en minutos, sin necesidad de aplicaciones adicionales ni desarrollo extra. Los usuarios finales pueden acceder al probador directamente desde la tienda de la marca o desde paginas publicas dedicadas.\n\nLookitry se reserva el derecho de modificar, suspender o agregar funcionalidades al servicio en cualquier momento, sujeto a lo establecido en el Articulo 13.',
  },
  {
    id: 'art4',
    title: 'Articulo 4. Registro y cuenta de usuario',
    content: 'Para acceder a las funcionalidades de la plataforma, el usuario debe crear una cuenta proporcionando informacion veraz, completa y actualizada.\n\nMetodos de registro:\n- Registro estandar: formulario con correo electronico y contraseña, protegido por Cloudflare Turnstile\n- Google OAuth: inicio de sesion con cuenta de Google\n- Trial de invitado: acceso temporal previo al registro completo, sujeto a verificacion antiabuso (IP + huella digital del navegador)\n\nObligaciones del usuario:\n- Mantener la confidencialidad de sus credenciales de acceso\n- Notificar inmediatamente a Lookitry sobre cualquier uso no autorizado de su cuenta\n- Verificar su correo electronico para habilitar creditos y el uso del probador virtual\n- Actualizar su informacion cuando sea necesario\n\nLookitry se reserva el derecho de:\n- Suspender o cancelar cuentas que incumplan estos terminos\n- Rechazar registros que presenten indicios de fraude o actividades ilicitas\n- Implementar medidas antiabuso para prevenir creaciones multiples de cuentas\n- Solicitar documentacion adicional para verificar la identidad del usuario',
  },
  {
    id: 'art5',
    title: 'Articulo 5. Planes, precios y facturacion',
    content: `Los precios estan expresados en pesos colombianos (COP) y estan sujetos a cambios. La facturacion es anticipada por el periodo seleccionado.

Planes disponibles:

TRIAL (pago unico):
- Precio: ${formatCop(20000)} COP
- Productos activos: 1
- Generaciones incluidas: 15 (configurables por campana)
- Duracion: 7 dias

BASICO:
- Precio: ${formatCop(pricing.basic.precio_mensual_cop)} COP/mes
- Productos activos: ${pricing.basic.productos_max}
- Generaciones incluidas: ${pricing.basic.generaciones_mensuales}/mes

PRO:
- Precio: ${formatCop(pricing.pro.precio_mensual_cop)} COP/mes
- Productos activos: ${pricing.pro.productos_max}
- Generaciones incluidas: ${pricing.pro.generaciones_mensuales}/mes

ENTERPRISE:
- Precio: ${formatCop(pricing.enterprise.precio_mensual_cop)} COP/mes
- Productos activos: ${pricing.enterprise.productos_max}
- Generaciones incluidas: ${pricing.enterprise.generaciones_mensuales}/mes
- Sincronizacion externa de productos (CSV/API)

Descuentos por duracion del plan:
- 1 mes: ${pricing.descuentos_duracion.meses_1}% de descuento
- 3 meses: ${pricing.descuentos_duracion.meses_3}% de descuento
- 6 meses: ${pricing.descuentos_duracion.meses_6}% de descuento
- 12 meses: ${pricing.descuentos_duracion.meses_12}% de descuento

Servicios adicionales:
- Mini-Landing: ${formatCop(pricing.mini_landing.precio_unico_cop)} COP (pago unico, requiere plan BASICO o PRO activo)
- Creditos adicionales (Add-on Credits): paquetes de generaciones comprables por separado, se descargan del saldo de creditos extra

Reglas de facturacion:
- Los planes se cobran de forma anticipada al inicio de cada periodo
- Los upgrades de plan se aplican de forma prorrateada; el credito del plan anterior se aplica al nuevo
- El nuevo plan inicia inmediatamente tras el pago
- Las generaciones no utilizadas no son acumulables entre periodos
- Lookitry puede ofrecer cupones de descuento que cubren parcial o totalmente el costo del plan
- Programa de referidos: el referente recibe 200 creditos extra cuando el referido completa su primer pago mensual elegible`,
  },
  {
    id: 'art6',
    title: 'Articulo 6. Medios de pago',
    content: 'Lookitry ofrece los siguientes medios de pago:\n\nWompi (pasarela certificada en Colombia):\n- Tarjetas de debito\n- Tarjetas de credito\n- PSE (debitos bancarios en linea)\n- Nequi\n\nPayPal:\n- Pagos en dolares estadounidenses (USD)\n- Soporte para transacciones internacionales\n\nPago manual:\n- Coordinado directamente via WhatsApp (+57 310 543 6281) o correo electronico (info@lookitry.com)\n\nAspectos importantes:\n- Lookitry NO almacena datos de tarjetas de credito o debito\n- Todas las transacciones se procesan a traves de pasarelas de pago certificadas con sus propias politicas de privacidad\n- Los comprobantes de pago quedan registrados en el historial de transacciones del usuario\n- En caso de discrepancias en pagos, el usuario puede contactar a Lookitry con su comprobante de pago',
  },
  {
    id: 'art7',
    title: 'Articulo 7. Derecho de retracto (Art. 47, Ley 1480 de 2011)',
    content: 'De conformidad con el Articulo 47 de la Ley 1480 de 2011, el consumidor tiene derecho a retractarse del contrato dentro de los cinco (5) dias habiles siguientes a la fecha de la transaccion o a la entrega del bien, lo que ocurra despues.\n\nEjercicio del derecho:\n- Contacto: info@lookitry.com o WhatsApp +57 310 543 6281\n- El reembolso se procesa en un plazo maximo de 30 dias calendario\n- El reembolso se realiza por el mismo medio de pago utilizado\n\nExcepciones:\n- El derecho de retracto no aplica cuando el servicio ha sido ejecutado con consentimiento expreso del consumidor antes de que venza el plazo de retracto\n- Una vez iniciado el periodo de suscripcion con consentimiento del usuario, no aplica el retracto',
  },
  {
    id: 'art8',
    title: 'Articulo 8. Politica de reembolsos',
    content: 'Fuera del periodo legal de retracto, no se realizan reembolsos por periodos de suscripcion ya iniciados.\n\nExcepcion por falla tecnica:\n- Si Lookitry presenta una falla tecnica continua de mas de 72 horas que impida el uso del servicio, el usuario puede solicitar una extension de su suscripcion o un credito proporcional al tiempo de inactividad\n\nProcedimiento de solicitud:\n- Correo: info@lookitry.com\n- Asunto: "Solicitud de reembolso"\n- Incluir: identificacion del usuario, plan contratado, fecha de pago y descripcion del motivo\n- Plazo de respuesta: 10 dias habiles\n\nLos creditos adicionales (Add-on Credits) adquiridos por separado no son reembolsables una vez aplicados al saldo del usuario.',
  },
  {
    id: 'art8-1',
    title: 'Articulo 8.1. Service Level Agreement (SLA)',
    content: 'Lookitry se compromete a los siguientes niveles de servicio segun el plan contratado:\n\nPlan BASICO:\n- Tiempo de respuesta de soporte: 48 horas habiles\n- Tiempo de generacion de imagen: hasta 30 segundos\n- Disponibilidad objetivo: 99.5%\n- Cola de procesamiento: estandar\n\nPlan PRO:\n- Tiempo de respuesta de soporte: 24 horas habiles\n- Tiempo de generacion de imagen: hasta 15 segundos\n- Disponibilidad objetivo: 99.9%\n- Cola de procesamiento: prioritaria\n\nPlan ENTERPRISE:\n- Tiempo de respuesta de soporte: 24 horas habiles\n- Disponibilidad objetivo: 99.9%\n- Soporte dedicado y sincronizacion externa de productos\n\nHorario de soporte: Lunes a Viernes, 9:00 AM - 6:00 PM (hora de Colombia).\n\nLos tiempos de generacion son estimaciones y pueden variar segun la carga del sistema, la calidad de la imagen de entrada y la complejidad de la prenda.',
  },
  {
    id: 'art9',
    title: 'Articulo 9. Uso aceptable del servicio',
    content: 'El usuario se compromete a utilizar el servicio de forma licita, responsable y conforme a estos terminos.\n\nUsos permitidos:\n- Uso comercial legitimo para tiendas y marcas autorizadas\n- Uso de imagenes con consentimiento del titular\n- Integracion del widget en sitios web respetando estos terminos\n\nUsos prohibidos:\n- Generar contenido ilegal, ofensivo, discriminatorio o que viole derechos de terceros\n- Acceder a cuentas de otros usuarios sin autorizacion\n- Realizar ingenieria inversa, descompilar o extraer el codigo fuente de la plataforma\n- Revender, sublicenciar o compartir el acceso al servicio sin autorizacion expresa\n- Superar los limites de generaciones mediante automatizacion, scripts o bots\n- Intentar explotar vulnerabilidades tecnicas del sistema\n- Extraer datos de forma no autorizada (scraping, data mining)\n- Suplantar identidad o proporcionar informacion falsa en el registro\n- Utilizar imagenes de personas sin su consentimiento\n- Realizar pagos fraudulentos o utilizar metodos de pago ilegítimos\n\nLookitry se reserva el derecho de suspender o cancelar de forma inmediata las cuentas que violen estas disposiciones, sin perjuicio de las acciones legales a que haya lugar.',
  },
  {
    id: 'art10',
    title: 'Articulo 10. Propiedad intelectual',
    content: 'Plataforma Lookitry:\n- Todos los derechos de propiedad intelectual sobre la plataforma Lookitry, incluyendo pero no limitandose a codigo fuente, dise\u00f1o, logotipos, marcas, algoritmos y documentacion, son propiedad exclusiva de Samuel Wilkie (NIT 700.403.166-3) o sus licenciantes\n- Queda prohibida la reproduccion, distribucion o modificacion de cualquier elemento protegido sin autorizacion expresa\n\nImagenes del usuario:\n- El usuario conserva todos los derechos sobre las imagenes que sube a la plataforma (selfies, fotos de productos, etc.)\n- Al utilizar el servicio, el usuario otorga a Lookitry una licencia limitada, no exclusiva, revocable y sin regalías para procesar dichas imagenes con el unico fin de prestar el servicio de probador virtual\n\nImagenes generadas por IA:\n- Los resultados del probador virtual son aproximaciones generadas por inteligencia artificial y no constituyen una representacion exacta de como lucira la prenda en la realidad\n- Lookitry no garantiza la precision, exactitud o fidelidad de los resultados generados\n- La calidad de los resultados depende de la calidad de las imagenes de entrada (selfie del usuario y foto del producto)\n\nRestricciones:\n- Las imagenes de los usuarios NO seran compartidas con terceros con fines comerciales\n- Las imagenes de los usuarios NO seran utilizadas para entrenar modelos de inteligencia artificial\n- Las imagenes procesadas (selfies) se eliminan automaticamente despues de la generacion del resultado',
  },
  {
    id: 'art10-ia',
    title: 'Articulo 10-B. Generacion Virtual con Inteligencia Artificial',
    content: `El probador virtual de Lookitry utiliza inteligencia artificial para generar imagenes de personas vistiendo productos de la marca suscrita. Al utilizar esta funcionalidad, el USUARIO (marca/negocio) declara y acepta lo siguiente:

Del uso por el cliente final:
- El usuario es responsable exclusivo de obtener y verificar que cuenta con los consentimientos necesarios de cualquier persona cuya imagen sea procesada a traves del probador virtual.
- Lookitry no almacena fotografias de rostros mas alla del tiempo necesario para procesar la generacion, ni las asocia a datos personales.
- Lookitry no se hace responsable por el uso que el cliente final del usuario haga de las imagenes generadas, incluyendo pero no limitandose a: suplantacion de identidad, difamacion, violation de derechos de imagen, o cualquier uso contrario a la ley.

De la propiedad de las generaciones:
- Las imagenes generadas mediante el probador virtual son producidas por un modelo de IA. Su uso comercial queda bajo la responsabilidad del usuario (marca) y sus clientes finales.
- Lookitry se reserva el derecho de utilizar las generaciones de forma anonimizada y agregada para entrenamiento y mejora de sus modelos de IA, sin asociar dichos datos a informacion personal del usuario o sus clientes.

De la limitacion de responsabilidad:
- La responsabilidad total de Lookitry por cualquier reclamo relacionado con las generaciones de IA no excedera el valor pagado por el usuario en el mes calendario en que ocurra el hecho generador.

Para reportes de uso indebido de la funcionalidad de generacion virtual, escribir a: info@lookitry.com`,
  },
  {
    id: 'art11',
    title: 'Articulo 11. Tratamiento de datos personales (Ley 1581 de 2012)',
    content: 'Lookitry trata los datos personales de sus usuarios conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013, asi como a su Politica de Privacidad disponible en /politicas-privacidad.\n\nDatos recopilados:\n- Marcas: nombre, correo electronico, informacion de facturacion, datos de uso\n- Usuarios finales: selfies temporales para procesamiento\n- Navegacion: direccion IP, tipo de dispositivo, paginas visitadas\n\nFinalidad del tratamiento:\n- Prestacion del servicio de probador virtual\n- Gestion de cuentas y suscripciones\n- Comunicaciones relacionadas con el servicio\n- Mejora continua de la plataforma\n- Cumplimiento de obligaciones legales\n\nDerechos del titular (Derechos ARCO):\n- Acceder, rectificar, cancelar y oponerse al tratamiento de sus datos\n- Solicitar la eliminacion de su cuenta y datos asociados\n- Contacto: info@lookitry.com con asunto "Derechos ARCO"\n- Solicitudes auto gestionables desde la pagina de perfil del usuario\n\nMedidas de seguridad:\n- Cifrado en transito (HTTPS/TLS)\n- Autenticacion JWT con cookies HTTP-only\n- Control de acceso basado en roles (RBAC)\n- Auditorias de seguridad periodicas\n- Eliminacion automatica de selfies tras la generacion\n\nTerceros:\n- Proveedores de infraestructura (Supabase, servidores VPS) bajo acuerdos de confidencialidad\n- Pasarelas de pago (Wompi, PayPal) con sus propias politicas de privacidad\n- Autoridades cuando sea requerido por ley\n- Los datos NO se venden a terceros con fines comerciales\n- Los datos NO se utilizan para entrenar modelos de IA\n\nRetencion de datos:\n- Los registros financieros se conservan por obligaciones legales y de seguridad\n- Las solicitudes de anonimizacion se procesan eliminando datos identificables',
  },
  {
    id: 'art12',
    title: 'Articulo 12. Limitacion de responsabilidad',
    content: 'Lookitry se ofrece "tal como esta" (as is) y "segun disponibilidad" (as available).\n\nLa plataforma no garantiza:\n- Disponibilidad ininterrumpida del servicio\n- Que el servicio sera libre de errores o fallos\n- Que los resultados del probador virtual seran exactos o fieles a la realidad\n- Que las generaciones se completaran en los tiempos estimados en todas las circunstancias\n\nLookitry no sera responsable por:\n- Danos indirectos, incidentales, especiales o consecuentes\n- Perdida de datos, ingresos, oportunidades o beneficios\n- Interrupciones del servicio causadas por factores de fuerza mayor o caso fortuito\n- Fallos en servicios de terceros (pasarelas de pago, proveedores de IA, infraestructura)\n- Uso indebido del servicio por parte del usuario o de terceros\n\nResponsabilidad maxima:\n- La responsabilidad total acumulada de Lookitry no excedera el valor pagado por el usuario por su plan durante el mes calendario en que ocurrio el dano\n\nEl usuario asume la responsabilidad de:\n- Contar con los derechos sobre las imagenes que sube a la plataforma\n- Utilizar el servicio conforme a la ley y a estos terminos\n- Verificar la idoneidad del servicio para sus necesidades comerciales',
  },
  {
    id: 'art13',
    title: 'Articulo 13. Modificaciones al servicio y a los terminos',
    content: 'Lookitry se reserva el derecho de modificar estos Terminos y Condiciones en cualquier momento.\n\nNotificacion de cambios:\n- Los cambios se notificaran con al menos 15 dias calendario de anticipacion\n- La notificacion se realizara por correo electronico al registrado en la cuenta o mediante aviso visible en la plataforma\n- El uso continuado del servicio despues de la entrada en vigencia de los cambios implica la aceptacion de los mismos\n\nSi el usuario no esta de acuerdo con los cambios, podra:\n- Cancelar su suscripcion antes de la entrada en vigencia de los cambios\n- Solicitar la eliminacion de su cuenta y datos asociados\n\nModificaciones al servicio:\n- Lookitry puede agregar, modificar o eliminar funcionalidades del servicio\n- Se notificara a los usuarios sobre cambios significativos que afecten la experiencia de uso',
  },
  {
    id: 'art14',
    title: 'Articulo 14. Suspension y terminacion',
    content: 'Suspension por parte de Lookitry:\n- Lookitry puede suspender temporalmente el acceso al servicio por mantenimiento programado, fallas tecnicas o fuerza mayor\n- Lookitry puede suspender o cancelar cuentas de forma inmediata en casos de violacion grave de estos terminos, fraude o actividades ilicitas\n- En caso de suspension por vencimiento de suscripcion, el usuario tendra un periodo de gracia de 90 dias para renovar antes de la eliminacion definitiva de sus datos\n\nTerminacion por parte del usuario:\n- El usuario puede cancelar su suscripcion en cualquier momento desde su panel de control\n- El usuario puede solicitar la eliminacion de su cuenta y datos asociados\n- La cancelacion no genera derecho a reembolso por periodos ya pagados\n\nEfectos de la terminacion:\n- Se revoca la licencia de uso de la plataforma\n- Los datos del usuario seran eliminados conforme a la Politica de Privacidad\n- Las obligaciones de confidencialidad y propiedad intelectual sobreviven a la terminacion',
  },
  {
    id: 'art15',
    title: 'Articulo 15. Ley aplicable y jurisdiccion',
    content: 'Estos Terminos y Condiciones se rigen por las leyes de la Republica de Colombia.\n\nResolucion de controversias:\n- Las partes se comprometen a intentar resolver cualquier controversia mediante negociacion directa\n- De no alcanzarse un acuerdo, las controversias se someteran a los jueces competentes de Bogota D.C., Colombia\n\nPara asuntos de consumo:\n- El usuario puede acudir a la Superintendencia de Industria y Comercio (SIC)\n- Portal: www.sic.gov.co\n- La SIC es la autoridad competente en materia de proteccion al consumidor y proteccion de datos personales en Colombia',
  },
  ];
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function TerminosClient({ pricing }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const ARTICLES = buildArticles(pricing);

  return (
    <div className="overflow-x-clip">
      <LandingNav />
      <main className="min-h-screen theme-bg-base">

        {/* Header */}
        <div className="dark:bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20 border-b theme-border">
          <div className="max-w-3xl mx-auto">
            <Breadcrumbs items={[{ label: 'Términos y Condiciones' }]} light className="mb-8" />
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-jakarta font-extrabold text-3xl md:text-4xl text-white tracking-tight">
              Términos y Condiciones
            </h1>
          </div>
        </div>

        <div className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            <div className="theme-bg-card border theme-border rounded-2xl overflow-hidden divide-y theme-border">
              {ARTICLES.map((art) => {
                const isOpen = openId === art.id;
                return (
                  <div key={art.id} className="transition-colors">
                    <button
                      onClick={() => setOpenId(isOpen ? null : art.id)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left hover:theme-bg-hover transition-colors group"
                    >
                      <span className={`font-jakarta font-bold text-sm ${isOpen ? 'text-[#FF5C3A]' : 'theme-text group-hover:text-[#FF5C3A]'}`}>
                        {art.title}
                      </span>
                      <IconChevron open={isOpen} />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="px-6 pb-6 pt-1 text-[13px] theme-text-muted leading-relaxed whitespace-pre-line">
                        {art.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <p className="text-[12px] theme-text-muted mb-4">
                ¿Tienes dudas sobre nuestros términos?
              </p>
              <Link
                href="/sobre-nosotros"
                className="inline-flex items-center gap-2 bg-[#FF5C3A] text-white text-[12px] font-medium px-5 py-2.5 rounded-lg hover:bg-[#e64d2e] transition-colors"
              >
                Conoce más sobre nosotros
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t theme-border text-center">
              <p className="text-[11px] theme-text-muted">
                Ultima actualizacion: 4 de abril de 2026 · Lookitry / Samuel Wilkie · NIT 700.403.166-3 · Marca Wilkie Devs
              </p>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
