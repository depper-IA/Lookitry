/**
 * LANDING_COPY
 * Fuente única de verdad para los textos de la cara pública de Lookitry.
 * Enfoque: Comercial, no técnico, orientado a dueños de negocios en LATAM.
 */

export const LANDING_COPY = {
  hero: {
    title: "Tu tienda puede ser",
    rotating_words: [
      "una marca que vende.",
      "un probador digital.",
      "más que un catálogo.",
    ],
    subtitle: "Tus clientas se prueban tu ropa desde Instagram o WhatsApp usando solo su celular. Reduce devoluciones y aumenta la confianza.",
    cta_primary: "Pruébalo ahora gratis",
    cta_secondary: "Ver planes",
  },

  onboarding: {
    title: "Vender con IA es tan fácil como subir una foto",
    steps: [
      {
        id: 1,
        title: "Elige tu plan y activa",
        description: "Sin cuentas gratuitas que no sirven. Compromiso real para negocios reales. Activa tu acceso en 2 minutos.",
        icon: "CreditCard",
      },
      {
        id: 2,
        title: "Sube las fotos de tu ropa",
        description: "Solo necesitas una foto clara de tus prendas. Nuestra IA se encarga de que queden perfectas para probarse.",
        icon: "UploadCloud",
      },
      {
        id: 3,
        title: "¡Empieza a vender!",
        description: "Recibe tu 'Link Mágico' para Instagram o WhatsApp. Tu clienta se ve puesta la ropa y compra con seguridad.",
        icon: "ShoppingBag",
      }
    ]
  },

  /**
   * SOCIAL OS — Sección 1 (aparece primero)
   * ─────────────────────────────────────────
   * Producto: PROBADOR VIRTUAL
   * Propuesta: el probador virtual con IA que funciona desde los canales donde ya están las clientas.
   * Diferenciador clave: NO es una tienda — es la tecnología de prueba accesible desde
   * Instagram, TikTok y WhatsApp. Resuelve la fricción "¿me quedará bien?" en el canal
   * donde ya existe la intención de compra.
   *
   * NO confundir con: Tienda Virtual (ver abajo), que es el mini ecommerce completo.
   */
  social_proof: {
    label: "Probador Virtual",
    title: "Tus clientas se prueban tu ropa",
    titleAccent: "desde donde ya están.",
    instagram: {
      title: "Prueba virtual desde tu bio",
      description: "Pega el link en tu Instagram. Tu seguidora elige la prenda, sube su foto y ve cómo le queda — sin salir de la app. Sin fricción, sin dudas.",
      tag: "@Lookitry"
    },
    tiktok: {
      title: "Del video al probador en segundos",
      description: "Ve la prenda en tu contenido y la prueba al instante. De la inspiración a la decisión de compra sin intermediarios.",
      tag: "@Lookitry"
    },
    whatsapp: {
      title: "Llegan listas para confirmar",
      description: "En vez de responder '¿me quedará bien?', envías el link del probador. Tu clienta se prueba sola y te escribe con la compra ya resuelta.",
      stat: "Hasta 30% menos devoluciones",
      tag: "+57 Ventas"
    }
  },

  /**
   * TIENDA VIRTUAL — Sección 2 (aparece después de Social OS)
   * ──────────────────────────────────────────────────────────
   * Producto: MINI ECOMMERCE
   * Propuesta: una tienda online propia, lista en 10 minutos, con catálogo, probador
   * virtual integrado y cierre por WhatsApp. Es un DESTINO completo de compra,
   * no solo una herramienta de prueba.
   *
   * NO confundir con: Social OS (ver arriba), que es el probador virtual que opera
   * dentro de los canales sociales sin necesidad de una tienda propia.
   */
  virtual_shop: {
    badge: "Mini Ecommerce · Pago único",
    title: "Tu tienda online,",
    titleAccent: "lista para vender en 10 minutos.",
    description: "Un mini ecommerce propio: catálogo de productos, probador virtual integrado y cierre por WhatsApp. Sin saber de tecnología, sin contratar a nadie.",
    features: [
      {
        title: "Tu catálogo, con link propio",
        desc: "Todas tus prendas en una tienda tuya. Compártela en Instagram, WhatsApp o donde quieras. Tus clientas navegan y eligen."
      },
      {
        title: "Tus clientas se prueban la ropa solas",
        desc: "Cada prenda tiene su probador incluido. Tu clienta sube su foto y ve cómo le queda antes de comprarte."
      },
      {
        title: "Cierre por WhatsApp en un clic",
        desc: "Botón directo a tu chat. La venta llega caliente, con la prenda elegida y la duda resuelta."
      },
      {
        title: "Sin código, sin servidores",
        desc: "Activa tu tienda en 10 minutos. Solo tu link y a vender. Nosotros lo configuramos si lo necesitas."
      }
    ],
    cta_primary: "Quiero mi tienda online",
    cta_secondary: "Ver planes y precios"
  },

  customer_journey: {
    title: "Tus clientes lo aman, tu vendes más",
    subtitle: "Una experiencia de 3 pasos diseñada para que tus clientas compren con la seguridad de un probador real.",
    steps: [
      {
        id: "01",
        title: "Eligen el producto",
        description: "Tus clientas navegan por tu catálogo interactivo y eligen la prenda que les encanta."
      },
      {
        id: "02",
        title: "Suben su foto",
        description: "Se toman una selfie o suben una foto desde su celular. Es rápido y privado."
      },
      {
        id: "03",
        title: "Ven el resultado",
        description: "Nuestra IA les muestra instantáneamente cómo les queda la prenda puesta. ¡Magia pura!"
      }
    ]
  },

  trust: {
    badge: "Instalación Humana Incluida",
    guarantee: "Si no sabes cómo configurarlo, nuestro equipo lo hace por ti sin costo adicional.",
  },

  pricing: {
    title: "Elige tu plan y empieza hoy",
    subtitle: "Sin contratos. Cancela cuando quieras.",
    trial: {
      title: "Plan de Prueba",
      price: "$20.000",
      period: "por 7 días",
      features: ["1 prenda activa", "15 pruebas virtuales", "Instalación guiada"]
    },
    basic: {
      title: "Básico",
      price: "$180.000",
      period: "por mes",
      features: ["5 prendas activas", "400 pruebas virtuales/mes", "Link para Instagram", "Ventas por WhatsApp"]
    },
    pro: {
      title: "Pro",
      price: "$350.000",
      period: "por mes",
      features: ["15 prendas activas", "1.200 pruebas virtuales/mes", "Tienda Virtual Premium", "Plugin WooCommerce", "Soporte prioritario"]
    }
  },

  // Mapeo de términos prohibidos para auditoría automática
  banned_terms: ["widget", "script", "embed", "slug", "mini-landing", "minilanding"]
};
