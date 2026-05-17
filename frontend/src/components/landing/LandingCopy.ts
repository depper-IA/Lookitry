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

  virtual_shop: {
    badge: "Complemento · Pago único",
    title: "Tu Pequeña Tienda Virtual",
    titleAccent: "lista para vender en 10 minutos.",
    description: "Te entregamos un link propio donde tus clientas eligen una prenda, suben su foto y se ven puestas la ropa antes de comprarte. Sin instalar nada, sin saber de tecnología.",
    features: [
      {
        title: "Un link que reemplaza tu web",
        desc: "Pegalo en tu bio de Instagram. Tus seguidores entran y compran sin salir del celular."
      },
      {
        title: "Tus clientas se prueban la ropa solas",
        desc: "Suben una foto y la IA les muestra cómo les queda. Dejás de responder ¿me quedará bien?"
      },
      {
        title: "Hasta 30% menos devoluciones",
        desc: "Compran con la seguridad de un probador real. Menos cambios, más ventas que se quedan."
      },
      {
        title: "Cierre por WhatsApp en un clic",
        desc: "Botón directo a tu chat. La venta llega caliente, lista para confirmar."
      }
    ],
    cta_primary: "Quiero mi tienda virtual",
    cta_secondary: "Ver planes y precios"
  },

  social_proof: {
    label: "Social OS",
    title: "Tus redes ya tienen clientas.",
    titleAccent: "Lookitry las cierra.",
    instagram: {
      title: "Link en bio que convierte",
      description: "Un solo link para todo tu catálogo. Tus seguidoras entran, se prueban la ropa y te escriben para comprar sin salir de Instagram.",
      tag: "@Lookitry"
    },
    tiktok: {
      title: "Del video a la venta",
      description: "Tus fans ven la prenda en el video y la prueban antes de comprarte. Del scroll a la compra confirmada.",
      tag: "@Lookitry"
    },
    whatsapp: {
      title: "Donde tus clientas confirman la compra",
      description: "Dejá de responder '¿cómo me quedará?'. Enviá el link del probador y tus clientas llegan listas para confirmar. Menos dudas, menos cambios.",
      stat: "Hasta 30% menos devoluciones",
      tag: "+57 Ventas"
    }
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
