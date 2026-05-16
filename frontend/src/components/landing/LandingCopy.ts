/**
 * LANDING_COPY
 * Fuente única de verdad para los textos de la cara pública de Lookitry.
 * Enfoque: Comercial, no técnico, orientado a dueños de negocios en LATAM.
 */

export const LANDING_COPY = {
  hero: {
    title: "Vende más ropa online con tu propio Espejo Digital",
    subtitle: "Tus clientas se prueban tu ropa desde Instagram o WhatsApp usando solo su celular. Reduce devoluciones y aumenta la confianza.",
    cta: "Prueba Lookitry por 7 días — $20.000",
    secondary_cta: "Ver casos de éxito",
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
    title: "Tu Pequeña Tienda Virtual", // Antes: Mini-landing
    description: "No necesitas una web compleja. Te entregamos una vitrina interactiva lista para recibir tráfico de tus redes sociales.",
    features: [
      "Link personalizado para tu biografía de Instagram.",
      "Catálogo interactivo con probador virtual integrado.",
      "Sin aplicaciones que descargar — funciona en cualquier celular.",
      "Botón directo de compra por WhatsApp."
    ]
  },

  social_proof: {
    title: "Tu mejor aliado en redes sociales",
    instagram: {
      title: "Bio de Instagram",
      description: "Convierte tus seguidores en clientes. Un solo link en tu bio para que todos se prueben tu ropa.",
      tag: "@Lookitry"
    },
    whatsapp: {
      title: "Ventas por WhatsApp",
      description: "Deja de responder '¿cómo me quedará?'. Envía el link del probador y deja que la IA responda por ti.",
      tag: "+57 Ventas"
    },
    metrics: [
      { label: "Reducción de devoluciones", value: "hasta 30%" },
      { label: "Marcas en testing", value: "6+" },
      { label: "Confianza del cliente", value: "NPS 45+" }
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
