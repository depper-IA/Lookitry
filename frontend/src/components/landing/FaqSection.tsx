'use client';

import { useState } from 'react';

// ── Iconos ────────────────────────────────────────────────────────────────────

function IconPlus({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ transition: 'transform 0.25s ease', transform: open ? 'rotate(45deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <path d="M9 3v12M3 9h12" stroke="#FF5C3A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconWhatsapp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.845L0 24l6.335-1.508A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.977.994-3.634-.235-.374A9.818 9.818 0 1112 21.818z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface FaqItem {
  q: string;
  a: string;
}

interface FaqTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: FaqItem[];
}

// ── Iconos de tabs ─────────────────────────────────────────────────────────────

function IconStore() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function IconCreditCard() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconShirt() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
    </svg>
  );
}

// ── Datos del FAQ ─────────────────────────────────────────────────────────────

const FAQ_TABS: FaqTab[] = [
  {
    id: 'mini-landing',
    label: 'Mini-Landing',
    icon: <IconStore />,
    items: [
      {
        q: '¿Qué es la mini-landing y para qué sirve?',
        a: 'Es una página pública profesional en pruebalo.wilkiedevs.com/tu-marca. Incluye tu catálogo de productos con probador virtual integrado, botón de WhatsApp flotante y hasta 3 templates de diseño. La puedes compartir en redes sociales, WhatsApp o en la bio de Instagram.',
      },
      {
        q: '¿Cuánto cuesta la mini-landing?',
        a: 'Es un pago único. El precio actual está disponible en la sección de planes de esta página. No tiene mensualidad adicional: pagas una vez y la página queda activa mientras tengas un plan de suscripción activo.',
      },
      {
        q: '¿Cuánto tiempo tarda en activarse?',
        a: 'La activación es inmediata. En minutos después de confirmar el pago, tu página ya está disponible en la URL asignada.',
      },
      {
        q: '¿Puedo cambiar el diseño de mi mini-landing?',
        a: 'Sí. Desde tu dashboard puedes elegir entre 3 templates: Clásico, Editorial y Probador. También puedes actualizar tu logo, colores, slogan, ciudad, horario y mensaje de WhatsApp cuando quieras.',
      },
      {
        q: '¿La mini-landing incluye el probador virtual?',
        a: 'Sí, el probador de IA está integrado directamente en tu página. Tus clientes pueden seleccionar un producto y probárselo sin salir de tu mini-landing.',
      },
      {
        q: '¿Necesito saber programar para tener mi mini-landing?',
        a: 'No. Todo se configura desde tu dashboard con formularios simples. No necesitas tocar código ni contratar un desarrollador.',
      },
    ],
  },
  {
    id: 'pagos',
    label: 'Pagos',
    icon: <IconCreditCard />,
    items: [
      {
        q: '¿Cuáles son los precios de los planes?',
        a: 'Hay tres opciones: Plan Trial (7 días), Plan Básico ($150.000 COP/mes) y Plan Pro ($250.000 COP/mes). El Trial te da acceso completo por 7 días para que pruebes la plataforma sin compromiso.',
      },
      {
        q: '¿Hay descuentos por pagar varios meses?',
        a: 'Sí. Al pagar 3 meses obtienes 5% de descuento, 6 meses un 10% y 12 meses un 15%. Los descuentos se aplican automáticamente en el checkout.',
      },
      {
        q: '¿Qué métodos de pago aceptan?',
        a: 'Procesamos los pagos a través de Wompi, que acepta tarjetas débito y crédito (Visa, Mastercard, Amex), PSE y Nequi. También puedes contactarnos por WhatsApp o correo para coordinar un pago manual.',
      },
      {
        q: '¿El pago es seguro?',
        a: 'Sí. Todos los pagos se procesan a través de Wompi, una pasarela de pagos certificada en Colombia. Nosotros nunca almacenamos los datos de tu tarjeta.',
      },
      {
        q: '¿Puedo cancelar en cualquier momento?',
        a: 'Sí. No hay contratos de permanencia. Puedes cancelar tu suscripción cuando quieras desde tu dashboard o escribiéndonos por WhatsApp.',
      },
      {
        q: '¿Qué pasa si no renuevo mi plan?',
        a: 'Tu cuenta queda suspendida al vencer el período pagado. Tus datos y configuración se conservan por 30 días. Si reactivas antes de ese plazo, todo vuelve a funcionar sin perder nada.',
      },
    ],
  },
  {
    id: 'generaciones',
    label: 'Generaciones',
    icon: <IconZap />,
    items: [
      {
        q: '¿Qué es una "generación"?',
        a: 'Cada vez que un cliente usa el probador virtual para ver cómo le queda un producto, se consume una generación. Es el proceso de IA que crea la imagen personalizada.',
      },
      {
        q: '¿Cuántas generaciones incluye cada plan?',
        a: 'El Plan Básico incluye 400 generaciones por mes. El Plan Pro incluye 1.200 generaciones por mes. El contador se reinicia el primer día de cada mes.',
      },
      {
        q: '¿Qué pasa si agoto mis generaciones?',
        a: 'El probador virtual deja de estar disponible para tus clientes hasta que se reinicie el contador el siguiente mes, o hasta que hagas upgrade al Plan Pro.',
      },
      {
        q: '¿Puedo ver cuántas generaciones he usado?',
        a: 'Sí. En tu dashboard hay una sección de estadísticas donde puedes ver el consumo del mes actual y el histórico.',
      },
      {
        q: '¿Las generaciones no usadas se acumulan?',
        a: 'No. Las generaciones no utilizadas en el mes no se transfieren al siguiente período. El contador se reinicia cada mes.',
      },
      {
        q: '¿Cuánto tarda en generarse una imagen?',
        a: 'Normalmente entre 10 y 30 segundos, dependiendo de la carga del sistema. El cliente ve una animación de carga mientras espera el resultado.',
      },
    ],
  },
  {
    id: 'probador',
    label: 'Probador IA',
    icon: <IconShirt />,
    items: [
      {
        q: '¿Cómo funciona el probador virtual?',
        a: 'El cliente sube una foto suya (selfie o foto de cuerpo completo), selecciona el producto que quiere probar y la IA genera en segundos una imagen realista mostrando cómo le quedaría la prenda o accesorio.',
      },
      {
        q: '¿Qué tipos de productos soporta el probador?',
        a: 'Ropa (camisas, vestidos, pantalones, chaquetas), accesorios (bolsos, cinturones, sombreros) y calzado. La calidad del resultado depende de la claridad de la foto del producto.',
      },
      {
        q: '¿Cómo integro el probador en mi tienda o web?',
        a: 'Tienes dos opciones: usar tu mini-landing (sin código) o copiar el widget embebible desde tu dashboard y pegarlo en tu sitio web. El widget funciona en cualquier plataforma: Shopify, WordPress, Wix, etc.',
      },
      {
        q: '¿Mis clientes necesitan crear una cuenta para usar el probador?',
        a: 'No. El probador es completamente público. Tus clientes solo necesitan subir una foto y elegir el producto. Sin registro, sin apps, sin fricción.',
      },
      {
        q: '¿Las fotos de mis clientes se almacenan?',
        a: 'Las selfies se procesan de forma temporal y se eliminan automáticamente después de generar el resultado. No almacenamos imágenes de los clientes de forma permanente.',
      },
      {
        q: '¿Cuántos productos puedo tener en el probador?',
        a: 'El Plan Básico permite hasta 5 productos activos. El Plan Pro permite hasta 15 productos. Puedes agregar, editar y desactivar productos desde tu dashboard en cualquier momento.',
      },
    ],
  },
];

// ── Componente acordeón ───────────────────────────────────────────────────────

function AccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#1f1f1f] last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span
          className="text-[14px] font-medium leading-snug transition-colors"
          style={{ color: isOpen ? '#f4f4f5' : '#a1a1aa' }}
        >
          {item.q}
        </span>
        <IconPlus open={isOpen} />
      </button>
      <div
        style={{
          maxHeight: isOpen ? '400px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <p className="text-[13px] text-[#71717a] leading-relaxed pb-5 pr-8">
          {item.a}
        </p>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function FaqSection() {
  const [activeTab, setActiveTab] = useState('mini-landing');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const currentTab = FAQ_TABS.find(t => t.id === activeTab) ?? FAQ_TABS[0];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setOpenIndex(null);
  };

  const handleToggle = (i: number) => {
    setOpenIndex(prev => (prev === i ? null : i));
  };

  return (
    <section className="bg-[#0a0a0a] py-16 md:py-20 px-6 md:px-8">
      <div className="max-w-[760px] mx-auto">

        {/* Encabezado */}
        <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">
          Preguntas frecuentes
        </p>
        <h2
          className="font-syne font-bold text-3xl text-white tracking-tight mb-10"
        >
          Todo lo que necesitas saber
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FAQ_TABS.map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all border"
                style={{
                  background: isActive ? 'rgba(255,92,58,0.1)' : '#141414',
                  borderColor: isActive ? '#FF5C3A' : '#2a2a2a',
                  color: isActive ? '#FF5C3A' : '#71717a',
                }}
              >
                <span style={{ color: isActive ? '#FF5C3A' : '#555' }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Acordeón */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-6">
          {currentTab.items.map((item, i) => (
            <AccordionItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => handleToggle(i)}
            />
          ))}
        </div>

        {/* CTA final */}
        <div className="mt-10 bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-[14px] font-semibold text-[#f4f4f5] mb-1">
              ¿No encontraste lo que buscabas?
            </p>
            <p className="text-[13px] text-[#71717a]">
              Escríbenos y te respondemos en minutos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://wa.me/573105436281"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all hover:opacity-90"
              style={{ background: '#25D366' }}
            >
              <IconWhatsapp />
              WhatsApp
            </a>
            <a
              href="mailto:info@pruebalo.wilkiedevs.com"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium border border-[#2a2a2a] text-[#a1a1aa] hover:text-white hover:border-[#444] transition-all"
            >
              <IconMail />
              Correo
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
