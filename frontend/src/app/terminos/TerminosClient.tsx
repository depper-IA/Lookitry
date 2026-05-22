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
    id: 'art2-b',
    title: 'Articulo 2-B. Restriccion de edad y capacidad legal',
    content: 'El acceso como usuario Marca (cliente directo de Lookitry) requiere ser mayor de 18 anos o contar con representacion legal valida al momento del registro.\n\nUsuarios finales del widget:\n- Lookitry no verifica la edad de los usuarios finales de las marcas suscritas.\n- La marca es responsable exclusiva de garantizar que sus usuarios finales que utilicen el probador virtual son mayores de edad o cuentan con el consentimiento de sus padres o tutores legales.\n- Si la plataforma de la marca permite el acceso a menores de edad, la marca debe implementar los mecanismos de consentimiento parental correspondientes antes de habilitar el widget de Lookitry.\n- Lookitry no sera responsable por el procesamiento de imagenes de menores si la marca no cumplio con esta obligacion.\n\nEl incumplimiento de esta condicion activa automaticamente la clausula de indemnizacion establecida en el Articulo 10-B.',
  },
  {
    id: 'art3',
    title: 'Articulo 3. Descripcion del servicio',
    content: 'Lookitry ofrece un widget de probador virtual impulsado por inteligencia artificial (IA) que permite a los usuarios finales visualizar como lucen prendas de vestir, accesorios y calzado sobre su propia imagen, bajo la modalidad de Software como Servicio (SaaS).\n\nEl servicio incluye:\n- Widget de probador virtual integrable en sitios web y tiendas en linea (incluyendo WooCommerce)\n- Mini-Landing: pagina independiente de probador virtual para cada marca\n- Panel de gestion de productos y generaciones para marcas\n- API para desarrolladores\n- Sistema de retroalimentacion con mejora continua basada en RAG (Retrieval-Augmented Generation)\n- Programa de referidos con beneficios para ambas partes\n- Codigo de cupones de descuento\n\nLas marcas pueden integrar el widget en sus tiendas en minutos, sin necesidad de aplicaciones adicionales ni desarrollo extra. Los usuarios finales pueden acceder al probador directamente desde la tienda de la marca o desde paginas publicas dedicadas.\n\nLookitry se reserva el derecho de modificar, suspender o agregar funcionalidades al servicio en cualquier momento, sujeto a lo establecido en el Articulo 13.\n\nProveedores tecnologicos de inteligencia artificial:\nLookitry utiliza modelos de IA de terceros para la generacion de imagenes del probador virtual. Estos proveedores incluyen, sin limitarse a:\n- Google Cloud (Vertex AI / Gemini): procesamiento de imagenes y generacion visual\n- OpenRouter: servicio de fallback para generacion de IA\n- Supabase: base de datos e infraestructura de autenticacion\nCada proveedor opera bajo sus propias politicas de uso y privacidad. Lookitry adopta medidas contractuales para garantizar la confidencialidad de los datos tratados por dichos proveedores, pero no es responsable por interrupciones o comportamientos propios de servicios de terceros.',
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
- Programa de referidos: el referente recibe 500 creditos extra y el referido recibe 100 creditos extra cuando el referido completa su primer pago de plan elegible (BASICO, PRO o ENTERPRISE)`,
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
    content: 'Lookitry se compromete a los siguientes niveles de servicio segun el plan contratado:\n\nPlan BASICO:\n- Tiempo de respuesta de soporte: 48 horas habiles\n- Tiempo de generacion de imagen: hasta 30 segundos\n- Disponibilidad objetivo: 99.5%\n- Cola de procesamiento: estandar\n\nPlan PRO:\n- Tiempo de respuesta de soporte: 24 horas habiles\n- Tiempo de generacion de imagen: hasta 15 segundos\n- Disponibilidad objetivo: 99.9%\n- Cola de procesamiento: prioritaria\n\nPlan ENTERPRISE:\n- Tiempo de respuesta de soporte: 24 horas habiles\n- Disponibilidad objetivo: 99.9%\n- Soporte dedicado y sincronizacion externa de productos\n\nHorario de soporte: Lunes a Viernes, 9:00 AM - 6:00 PM (hora de Colombia).\n\nLos tiempos de generacion son estimaciones y pueden variar segun la carga del sistema, la calidad de la imagen de entrada y la complejidad de la prenda.\n\nIMPORTANTE: Los porcentajes de disponibilidad indicados (99.5% y 99.9%) son objetivos operativos internos, no garantias contractuales absolutas. Su incumplimiento da lugar unicamente a los creditos y compensaciones establecidos en el Articulo 8, sin que ello genere derecho a reclamar danos adicionales. Lookitry no asume responsabilidad por indisponibilidades causadas por mantenimiento programado notificado con anticipacion, fallos de proveedores de infraestructura o fuerza mayor.',
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
- Lookitry no almacena fotografias de rostros mas alla del tiempo necesario para procesar la generacion, ni las asocia a datos personales permanentes.
- Las imagenes procesadas NO seran utilizadas para entrenar modelos de inteligencia artificial ni para ningun fin distinto a la prestacion del servicio de probador virtual.

De las imagenes generadas (resultados try-on):
- Las imagenes generadas por el probador virtual son contenido sintetico producido por inteligencia artificial — no son fotografias reales del usuario final.
- Por su caracter sintetico, las imagenes generadas NO estan sujetas al regimen de eliminacion inmediata de datos biometricos (Art. 10-C).
- Lookitry conserva las imagenes generadas por un maximo de 48 horas para permitir a la marca verificar la calidad del resultado, reportar errores y gestionar feedback. Transcurrido ese plazo, las imagenes generadas se eliminan automaticamente.
- El uso comercial de las imagenes generadas es responsabilidad de la marca y sus clientes finales, bajo las restricciones descritas en la seccion "Usos prohibidos" de este articulo.

Usos prohibidos de las imagenes generadas:
Queda expresamente prohibido utilizar las imagenes generadas para: crear deepfakes, suplantar identidades, difamar, generar contenido sexual o violento no consensuado, manipular politicamente, o cualquier uso contrario a la ley colombiana o del pais del usuario. Lookitry no se hace responsable por usos ilicitos que el cliente final realice de las imagenes generadas.

Clausula de indemnizacion — responsabilidad de la marca:
- La marca actua como RESPONSABLE DEL TRATAMIENTO frente a sus usuarios finales. Lookitry actua como ENCARGADO DEL TRATAMIENTO en nombre de la marca, conforme al Articulo 10-C.
- La marca se obliga a indemnizar, defender y mantener indemne a Lookitry frente a cualquier reclamacion, demanda, sancion, multa o costo legal —incluyendo honorarios de abogados— derivados del uso del servicio sin el consentimiento requerido de los usuarios finales, o por el uso ilicito de las imagenes generadas.
- Lookitry no sera parte en ninguna disputa entre la marca y sus usuarios finales relacionada con el procesamiento de imagenes o el uso de generaciones de IA.

De la propiedad de las generaciones:
- Las imagenes generadas son producidas por un modelo de IA. Su uso comercial queda bajo la responsabilidad de la marca y sus clientes finales.
- Lookitry NO utiliza estas generaciones para entrenar modelos de IA propios ni de terceros.

De la limitacion de responsabilidad de Lookitry:
- La responsabilidad total de Lookitry por cualquier reclamo relacionado con las generaciones de IA no excedera el valor pagado por el usuario en el mes calendario en que ocurra el hecho generador.

Para reportes de uso indebido de la funcionalidad de generacion virtual, escribir a: info@lookitry.com`,
  },
  {
    id: 'art10-c',
    title: 'Articulo 10-C. Datos biometricos y datos sensibles (Art. 5 Ley 1581 de 2012)',
    content: 'Las imagenes faciales (selfies) procesadas a traves del probador virtual constituyen datos biometricos y son clasificadas como datos sensibles segun el Articulo 5 de la Ley 1581 de 2012. Su tratamiento exige consentimiento explicito, diferenciado e independiente del contrato de servicio.\n\nObligaciones de la marca (responsable del tratamiento):\n- La marca garantiza a Lookitry, mediante la aceptacion de estos Terminos, que ha obtenido o obtendra el consentimiento explicito, informado, previo e inequivoco de cada usuario final antes de que este utilice el probador virtual.\n- Este consentimiento debe indicar claramente que: (1) la imagen sera procesada por sistemas de inteligencia artificial; (2) el procesamiento es temporal y la imagen sera eliminada automaticamente tras la generacion del resultado; (3) el resultado es una aproximacion visual y no constituye una representacion exacta.\n- La marca debe conservar prueba del consentimiento otorgado por sus usuarios finales y ponerla a disposicion de Lookitry o de la Superintendencia de Industria y Comercio (SIC) cuando sea requerido.\n\nObligaciones de Lookitry (encargado del tratamiento):\n- Procesar las imagenes unicamente para la generacion del resultado visual solicitado.\n- Eliminar la imagen original de forma automatica una vez completado el procesamiento.\n- No asociar las imagenes a datos personales identificables del usuario final.\n- No compartir las imagenes con terceros, salvo con los proveedores tecnologicos indispensables para la prestacion del servicio, bajo acuerdos de confidencialidad.\n\nEl incumplimiento de las obligaciones de la marca activa la clausula de indemnizacion del Articulo 10-B.',
  },
  {
    id: 'art11',
    title: 'Articulo 11. Tratamiento de datos personales (Ley 1581 de 2012)',
    content: `Lookitry trata los datos personales de sus usuarios conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013, asi como a su Politica de Privacidad disponible en /politicas-privacidad.

Datos recopilados:
- Marcas: nombre, correo electronico, informacion de facturacion, datos de uso
- Usuarios finales: selfies temporales para procesamiento
- Navegacion: direccion IP, tipo de dispositivo, paginas visitadas

Finalidad del tratamiento:
- Prestacion del servicio de probador virtual
- Gestion de cuentas y suscripciones
- Comunicaciones relacionadas con el servicio
- Mejora continua de la plataforma
- Cumplimiento de obligaciones legales

Derechos del titular (Derechos ARCO):
- Acceder, rectificar, cancelar y oponerse al tratamiento de sus datos
- Solicitar la eliminacion de su cuenta y datos asociados
- Contacto: info@lookitry.com con asunto "Derechos ARCO"
- Solicitudes auto gestionables desde la pagina de perfil del usuario

Medidas de seguridad:
- Cifrado en transito (HTTPS/TLS)
- Autenticacion JWT con cookies HTTP-only
- Control de acceso basado en roles (RBAC)
- Auditorias de seguridad periodicas
- Eliminacion automatica de selfies tras la generacion

Terceros:
- Proveedores de infraestructura (Supabase, servidores VPS) bajo acuerdos de confidencialidad
- Pasarelas de pago (Wompi, PayPal) con sus propias politicas de privacidad
- Autoridades cuando sea requerido por ley
- Los datos NO se venden a terceros con fines comerciales
- Los datos NO se utilizan para entrenar modelos de IA

Retencion de datos:
- Los registros financieros se conservan por obligaciones legales y de seguridad
- Las solicitudes de anonimizacion se procesan eliminando datos identificables
- Selfies: eliminadas automaticamente tras la generacion del resultado (segundos a minutos). El dato biometrico se elimina de forma inmediata en cumplimiento del Art. 10-C de la Ley 1581 de 2012.
- Imagenes generadas (resultados try-on): conservadas un maximo de 48 horas para uso operativo de la marca (verificacion de calidad, reporte de errores, gestion de feedback). No son datos biometricos; son contenido sintetico de IA y se eliminan automaticamente transcurrido ese plazo.
- Datos de cuenta: 90 dias despues de la cancelacion definitiva
- Registros financieros: 5 anos por obligacion legal contable

Transferencia internacional de datos (Art. 26 Ley 1581 de 2012):
Lookitry informa que los datos personales pueden ser transferidos a servidores ubicados en paises con niveles de proteccion distintos a los de Colombia, dado que algunos proveedores tecnologicos operan fuera del territorio nacional:
- Google Cloud (Vertex AI, Gemini): servidores en Estados Unidos
- Supabase: infraestructura en Estados Unidos
- OpenRouter: servidores en Estados Unidos
Salvaguardas aplicadas: clausulas contractuales de confidencialidad con cada proveedor, cifrado HTTPS/TLS en toda transmision, los datos biometricos no se almacenan de forma permanente en servidores internacionales. Al aceptar estos Terminos, el usuario autoriza estas transferencias en los terminos descritos.`,
  },
  {
    id: 'art11-b',
    title: 'Articulo 11-B. Protocolo de notificacion de brechas de seguridad',
    content: 'En caso de que Lookitry detecte o tome conocimiento de un incidente de seguridad que comprometa datos personales de sus usuarios, se activara el siguiente protocolo, conforme a la Resolucion 95698 de 2023 de la SIC y las directrices vigentes en materia de brechas de datos:\n\nNotificacion a la SIC:\n- Lookitry notificara a la Superintendencia de Industria y Comercio (SIC) dentro de los 15 dias habiles siguientes a la deteccion del incidente.\n- La notificacion incluira: naturaleza del incidente, tipo de datos comprometidos, numero aproximado de titulares afectados, medidas adoptadas y punto de contacto designado.\n\nNotificacion a los usuarios afectados:\n- Los usuarios cuyos datos hayan sido comprometidos seran notificados de forma individual, preferiblemente por correo electronico, dentro del mismo plazo de 15 dias habiles o tan pronto como sea tecnicamente posible.\n- La notificacion informara sobre: que datos fueron afectados, las medidas correctivas adoptadas por Lookitry y las recomendaciones de seguridad para el usuario.\n\nMedidas inmediatas post-incidente:\n- Contencion del incidente y evaluacion del impacto.\n- Registro documentado en el libro de incidencias de seguridad.\n- Revision y refuerzo de las medidas de seguridad para prevenir recurrencia.\n\nLimitacion de responsabilidad por brechas:\n- Lookitry no sera responsable por brechas de seguridad originadas en dispositivos, redes o sistemas del propio usuario.\n- Tampoco sera responsable por incidentes atribuibles exclusivamente a proveedores de infraestructura (Supabase, Hostinger, Google Cloud) que escapen al control operativo de Lookitry, siempre que Lookitry haya adoptado las medidas de seguridad descritas en el Articulo 11.\n\nPara reportar una vulnerabilidad o incidente de seguridad: info@lookitry.com — Asunto: "Incidente de Seguridad".',
  },
  {
    id: 'art12',
    title: 'Articulo 12. Limitacion de responsabilidad',
    content: 'Lookitry se ofrece "tal como esta" (as is) y "segun disponibilidad" (as available).\n\nLa plataforma no garantiza:\n- Disponibilidad ininterrumpida del servicio\n- Que el servicio sera libre de errores o fallos\n- Que los resultados del probador virtual seran exactos o fieles a la realidad\n- Que las generaciones se completaran en los tiempos estimados en todas las circunstancias\n\nLookitry no sera responsable por:\n- Danos indirectos, incidentales, especiales o consecuentes\n- Perdida de datos, ingresos, oportunidades o beneficios\n- Interrupciones del servicio causadas por factores de fuerza mayor o caso fortuito\n- Fallos en servicios de terceros, incluyendo pasarelas de pago (Wompi, PayPal), proveedores de inteligencia artificial (Google Vertex AI, Gemini, OpenRouter), proveedores de infraestructura (Supabase, Hostinger), o cualquier otro proveedor del que dependa la plataforma\n- Fallos, conflictos o incompatibilidades del widget de Lookitry al ser integrado en plataformas de terceros (WooCommerce, sitios web de marcas u otras plataformas), incluyendo danos causados por configuraciones incorrectas realizadas por la marca o sus desarrolladores\n- Interrupciones causadas por ataques informaticos (DDoS, inyeccion, etc.) contra la infraestructura propia o de terceros\n- Uso indebido del servicio por parte del usuario, sus clientes finales o terceros no autorizados\n\nResponsabilidad maxima:\n- La responsabilidad total acumulada de Lookitry no excedera el valor pagado por el usuario por su plan durante el mes calendario en que ocurrio el dano\n\nEl usuario asume la responsabilidad de:\n- Contar con los derechos sobre las imagenes que sube a la plataforma\n- Utilizar el servicio conforme a la ley y a estos terminos\n- Verificar la idoneidad del servicio para sus necesidades comerciales',
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
    content: 'Estos Terminos y Condiciones se rigen por las leyes de la Republica de Colombia.\n\nResolucion de controversias:\n- Las partes se comprometen a intentar resolver cualquier controversia mediante negociacion directa en primera instancia\n- Si no se alcanza un acuerdo en 30 dias calendario, las partes podran intentar mediacion ante un centro de conciliacion autorizado\n- De no resolverse por mediacion, las controversias se someteran a los jueces competentes de Bogota D.C., Colombia\n\nPara asuntos de consumo:\n- El usuario puede acudir a la Superintendencia de Industria y Comercio (SIC)\n- Portal: www.sic.gov.co\n- La SIC es la autoridad competente en materia de proteccion al consumidor y proteccion de datos personales en Colombia',
  },
  {
    id: 'art16',
    title: 'Articulo 16. Derechos de usuarios en otros paises de Latinoamerica',
    content: 'Lookitry opera principalmente bajo legislacion colombiana, pero reconoce los derechos que otorga la legislacion local a usuarios ubicados en otros paises de Latinoamerica:\n\nMexico:\n- Aplica la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares (LFPDPPP)\n- Los usuarios mexicanos pueden ejercer derechos ARCO (Acceso, Rectificacion, Cancelacion, Oposicion) escribiendo a info@lookitry.com con asunto "Derechos ARCO - Mexico"\n- Ante incumplimientos, pueden acudir al Instituto Nacional de Transparencia, Acceso a la Informacion y Proteccion de Datos Personales (INAI): www.inai.org.mx\n\nArgentina:\n- Aplica la Ley 25.326 de Proteccion de los Datos Personales\n- Los usuarios argentinos pueden acudir a la Agencia de Acceso a la Informacion Publica (AAIP): www.argentina.gob.ar/aaip\n\nVenezuela:\n- Aplica la Ley Especial contra los Delitos Informaticos (2001)\n- Los usuarios venezolanos tienen los mismos derechos de privacidad reconocidos en estos Terminos\n\nPara todos los paises:\n- Los usuarios pueden ejercer sus derechos escribiendo a info@lookitry.com con asunto "Privacidad - [pais]"\n- Las disputas comerciales se rigen por la jurisdiccion colombiana segun el Articulo 15, salvo disposicion legal imperativa contraria del pais del usuario\n- Los precios publicados son en pesos colombianos (COP). Las conversiones de moneda son referenciales.',
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
            <Breadcrumbs items={[{ label: 'Términos y Condiciones' }]} className="mb-8" />
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-jakarta font-extrabold text-3xl md:text-4xl theme-text tracking-tight">
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
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'}`}
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
                Ultima actualizacion: mayo 2026 · Lookitry / Samuel Wilkie · NIT 700.403.166-3 · Marca Wilkie Devs
              </p>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
