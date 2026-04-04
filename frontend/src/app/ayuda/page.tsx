'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';
import { Search, Book, CreditCard, Palette, Code, ShoppingCart, MessageCircle, ExternalLink, ChevronRight, Package, Settings, Zap, Globe } from 'lucide-react';

const ayudaCategories = [
  {
    id: 'primeros-pasos',
    title: 'Primeros Pasos',
    description: 'Todo lo que necesitas para comenzar con Lookitry',
    icon: Zap,
    color: '#FF5C3A',
    articles: [
      { title: 'Cómo activar tu cuenta de prueba', slug: 'activar-cuenta-trial' },
      { title: 'Navegando el dashboard', slug: 'navegar-dashboard' },
      { title: 'Subir tu primer producto', slug: 'subir-producto' },
      { title: 'Configurar tu marca', slug: 'configurar-marca' },
    ]
  },
  {
    id: 'integraciones',
    title: 'Integraciones',
    description: 'Conecta Lookitry con tu plataforma de e-commerce',
    icon: Code,
    color: '#6366f1',
    articles: [
      { title: 'Instalar plugin en WooCommerce', slug: 'instalar-woocommerce' },
      { title: 'Usar script incrustado en cualquier sitio', slug: 'script-incrustado' },
      { title: 'Insertar iframe en tu web', slug: 'insertar-iframe' },
      { title: 'Usar la API REST', slug: 'usar-api-rest' },
    ]
  },
  {
    id: 'pagos',
    title: 'Pagos y Facturación',
    description: 'Gestiona tu suscripción y métodos de pago',
    icon: CreditCard,
    color: '#10b981',
    articles: [
      { title: 'Métodos de pago disponibles', slug: 'metodos-pago' },
      { title: 'Actualizar o cambiar de plan', slug: 'cambiar-plan' },
      { title: 'Ver mis facturas', slug: 'ver-facturas' },
      { title: 'Trial: qué incluye y cómo funciona', slug: 'como-funciona-trial' },
    ]
  },
  {
    id: 'personalizacion',
    title: 'Personalización',
    description: 'Personaliza el look & feel de tu probador',
    icon: Palette,
    color: '#f59e0b',
    articles: [
      { title: 'Cambiar colores de marca', slug: 'colores-marca' },
      { title: 'Subir tu logo', slug: 'subir-logo' },
      { title: 'Elegir plantilla del widget', slug: 'elegir-plantilla' },
      { title: 'Personalizar mensaje de bienvenida', slug: 'mensaje-bienvenida' },
    ]
  },
  {
    id: 'productos',
    title: 'Gestión de Productos',
    description: 'Administra tu catálogo de productos',
    icon: Package,
    color: '#ec4899',
    articles: [
      { title: 'Agregar productos al probador', slug: 'agregar-productos' },
      { title: 'Optimizar fotos para mejores resultados', slug: 'optimizar-fotos' },
      { title: 'Categorizar productos', slug: 'categorizar-productos' },
    ]
  },
  {
    id: 'soporte',
    title: 'Soporte Técnico',
    description: '¿Necesitas ayuda? Estamos aquí',
    icon: MessageCircle,
    color: '#8b5cf6',
    articles: [
      { title: 'Contactar al equipo de soporte', slug: 'contactar-soporte' },
      { title: 'Errores comunes y soluciones', slug: 'errores-comunes' },
      { title: 'Sugerir una característica', slug: 'sugerir-caracteristica' },
    ]
  }
];

const faqItems = [
  {
    question: '¿Cuánto tiempo dura el período de prueba?',
    answer: 'El trial tiene una duración de 7 días. Durante este período puedes usar todas las funciones del plan que elegiste sin costo adicional.'
  },
  {
    question: '¿Puedo cambiar de plan después de registrado?',
    answer: 'Sí, puedes actualizar o bajar de plan en cualquier momento desde el dashboard. Los cambios de upgrade se aplican de inmediato.'
  },
  {
    question: '¿Qué pasa si no renuevo mi suscripción?',
    answer: 'Tu cuenta será suspendida después de 90 días sin renovación. Tus datos se mantienen por ese período para que puedas reactivarla cuando quieras.'
  },
  {
    question: '¿En qué plataformas puedo integrar Lookitry?',
    answer: 'Tenemos plugin oficial para WooCommerce. Para otras plataformas como Shopify, Wix, Squarespace, puedes usar nuestro script incrustado o iframe.'
  },
  {
    question: '¿Cómo funciona el pago con Wompi?',
    answer: 'Wompi acepta tarjetas de crédito/débito, PSE (pagos desde banco) y Nequi. El pago se procesa de forma segura y se refleja en minutos.'
  }
];

const supportCapacity = {
  hours: 'Lunes a Viernes',
  time: '9:00 AM - 6:00 PM (Colombia)',
  basicResponseTime: '48 horas hábiles',
  proResponseTime: '24 horas hábiles',
  maxSimultaneous: '10 solicitudes',
  description: 'Nuestro equipo de soporte está disponible para ayudarte con cualquier duda o inconveniente. Contamos con capacidad para atender hasta 10 solicitudes simultáneas.'
};

export default function AyudaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredCategories = ayudaCategories.map(cat => ({
    ...cat,
    articles: cat.articles.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.articles.length > 0 || searchQuery === '');

  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        {/* Hero Section */}
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Soporte</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl text-white tracking-tight mb-4">
              Centro de ayuda
            </h1>
            <p className="text-[#999] text-sm md:text-base max-w-2xl mx-auto mb-8">
              Encuentra guías, tutoriales y respuestas a tus preguntas sobre Lookitry.
            </p>
            
            {/* Buscador */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
              <input
                type="text"
                placeholder="Buscar artículos, guías..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-2xl pl-12 pr-4 py-4 text-white placeholder-[#666] focus:border-[#FF5C3A] focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Categorías */}
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div 
                    key={category.id}
                    className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 hover:border-[#FF5C3A]/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: category.color }} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{category.title}</h3>
                        <p className="text-xs text-[#666]">{category.articles.length} artículos</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#999] mb-4">{category.description}</p>
                    <div className="space-y-2">
                      {category.articles.slice(0, 3).map((article) => (
                        <Link 
                          key={article.slug}
                          href={`/ayuda/${article.slug}`}
                          className="flex items-center gap-2 text-sm text-[#888] hover:text-[#FF5C3A] transition-colors"
                        >
                          <Book className="w-3.5 h-3.5" />
                          {article.title}
                        </Link>
                      ))}
                      {category.articles.length > 3 && (
                        <Link 
                          href={`/ayuda/${category.id}`}
                          className="flex items-center gap-1 text-xs text-[#FF5C3A] font-medium"
                        >
                          Ver todos <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-6 md:px-8 py-12 md:py-16 border-t border-[#1a1a1a]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-jakarta font-bold text-2xl text-white mb-2">Preguntas Frecuentes</h2>
              <p className="text-[#999] text-sm">Respuestas a las dudas más comunes</p>
            </div>
            
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div 
                  key={index}
                  className="rounded-2xl border border-[#2a2a2a] bg-[#111] overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="text-sm font-medium text-white">{item.question}</span>
                    <ChevronRight 
                      className={`w-5 h-5 text-[#666] transition-transform ${expandedFaq === index ? 'rotate-90' : ''}`} 
                    />
                  </button>
                  {expandedFaq === index && (
                    <div className="px-5 pb-5">
                      <p className="text-sm text-[#999] leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recursos Adicionales */}
        <section className="px-6 md:px-8 py-12 md:py-16 border-t border-[#1a1a1a]">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Link href="/dashboard/integrations/docs" className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 hover:border-[#6366f1]/40 transition-colors group">
                <Code className="w-8 h-8 text-[#6366f1] mb-4" />
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-[#6366f1]">Documentación Técnica</h3>
                <p className="text-sm text-[#999]">Guías para desarrolladores</p>
              </Link>
              
              <Link href="/blog" className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 hover:border-[#10b981]/40 transition-colors group">
                <Book className="w-8 h-8 text-[#10b981] mb-4" />
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-[#10b981]">Blog</h3>
                <p className="text-sm text-[#999]">Tips, casos de éxito y noticias</p>
              </Link>
              
              <Link href="/contacto" className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 hover:border-[#FF5C3A]/40 transition-colors group">
                <MessageCircle className="w-8 h-8 text-[#FF5C3A] mb-4" />
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-[#FF5C3A]">Contactar Soporte</h3>
                <p className="text-sm text-[#999]">Escríbenos directamente</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Capacidad de Soporte */}
        <section className="px-6 md:px-8 py-12 md:py-16 border-t border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-[#FF5C3A]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Horario y Capacidad de Soporte</h2>
                  <p className="text-sm text-[#666]">Conoce nuestros tiempos de respuesta</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="rounded-2xl bg-[#0a0a0a] border border-[#2a2a2a] p-5">
                  <p className="text-xs text-[#666] uppercase tracking-wider mb-2">Horario de Atención</p>
                  <p className="text-white font-semibold">{supportCapacity.hours}</p>
                  <p className="text-sm text-[#999]">{supportCapacity.time}</p>
                </div>
                
                <div className="rounded-2xl bg-[#0a0a0a] border border-[#2a2a2a] p-5">
                  <p className="text-xs text-[#666] uppercase tracking-wider mb-2">Capacidad</p>
                  <p className="text-white font-semibold">{supportCapacity.maxSimultaneous}</p>
                  <p className="text-sm text-[#999]">simultáneas</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-[#0a0a0a] border border-[#2a2a2a] p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <p className="text-xs text-[#666] uppercase tracking-wider">Plan Básico</p>
                  </div>
                  <p className="text-white font-semibold">Tiempo de respuesta</p>
                  <p className="text-sm text-[#999]">{supportCapacity.basicResponseTime}</p>
                </div>
                
                <div className="rounded-2xl bg-[#0a0a0a] border border-[#2a2a2a] p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#FF5C3A]" />
                    <p className="text-xs text-[#666] uppercase tracking-wider">Plan Pro</p>
                  </div>
                  <p className="text-white font-semibold">Tiempo de respuesta</p>
                  <p className="text-sm text-[#999]">{supportCapacity.proResponseTime}</p>
                </div>
              </div>
              
              <p className="text-sm text-[#666] mt-6">
                {supportCapacity.description}
              </p>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}