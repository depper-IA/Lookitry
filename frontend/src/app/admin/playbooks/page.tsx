'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, AlertTriangle, CreditCard, Zap, Shield, Users, CheckCircle } from 'lucide-react';

interface Playbook {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: Array<{ step: number; action: string; detail: string }>;
  relatedLinks: Array<{ label: string; href: string }>;
}

const playbooks: Playbook[] = [
  {
    id: 'trial-stalled',
    title: 'Trial estancado sin activación',
    description: 'Cliente en trial que no ha generado valor en los primeros días',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: '#f59e0b',
    steps: [
      { step: 1, action: 'Identificar el trial', detail: 'Ve a Riesgo y filtra por trials con más de 3 días sin uso' },
      { step: 2, action: 'Revisar ficha de la marca', detail: 'Abre la ficha 360 para ver si hay productos configurados' },
      { step: 3, action: 'Verificar integración', detail: 'Revisa si la marca tiene WooCommerce activo o mini-landing' },
      { step: 4, action: 'Contactar al cliente', detail: 'Envía email o WhatsApp ofreciendo ayuda para la configuración inicial' },
      { step: 5, action: 'Registrar acción', detail: 'Deja nota en el historial de la marca para trazabilidad' },
    ],
    relatedLinks: [
      { label: 'Ver riesgos', href: '/admin/risk' },
      { label: 'Ver marcas', href: '/admin/brands' },
    ],
  },
  {
    id: 'payment-failed',
    title: 'Pago fallido de suscripción',
    description: 'Cliente con pago rechazado o pendiente de resolución',
    icon: <CreditCard className="w-5 h-5" />,
    color: '#ef4444',
    steps: [
      { step: 1, action: 'Identificar el pago fallido', detail: 'Revisa la cola operativa del Mission Control' },
      { step: 2, action: 'Verificar estado de la suscripción', detail: 'Abre la ficha 360 de la marca y revisa la pestaña Finanzas' },
      { step: 3, action: 'Confirmar con el cliente', detail: 'Contacta para verificar si intentó pagar o si fue un error del sistema' },
      { step: 4, action: 'Resolver', detail: 'Si el pago fue exitoso externamente, regístralo manualmente. Si falló, ofrece alternativa' },
      { step: 5, action: 'Actualizar estado', detail: 'Registra el pago o suspende la cuenta según corresponda' },
    ],
    relatedLinks: [
      { label: 'Mission Control', href: '/admin/dashboard' },
      { label: 'Historial de pagos', href: '/admin/payments' },
    ],
  },
  {
    id: 'ia-costs-spike',
    title: 'Costo IA disparado',
    description: 'Consumo de créditos IA fuera de rango normal',
    icon: <Zap className="w-5 h-5" />,
    color: '#8b5cf6',
    steps: [
      { step: 1, action: 'Verificar alertas de créditos', detail: 'Revisa Costos e IA para ver qué proveedor tiene consumo anómalo' },
      { step: 2, action: 'Identificar la causa', detail: 'Revisa generaciones recientes fallidas o repetidas en Mission Control' },
      { step: 3, action: 'Segmentar por marca', detail: 'Identifica si una marca específica está consumiendo desproporcionadamente' },
      { step: 4, action: 'Acción correctiva', detail: 'Si es error del sistema: revisa prompts. Si es abuso: contacta al cliente' },
      { step: 5, action: 'Ajustar límites', detail: 'Considera ajustar límites de generaciones por marca si es necesario' },
    ],
    relatedLinks: [
      { label: 'Costos e IA', href: '/admin/ia-costs' },
      { label: 'Mission Control', href: '/admin/dashboard' },
    ],
  },
  {
    id: 'woo-degraded',
    title: 'Integración WooCommerce degradada',
    description: 'Marca con WooCommerce que ha dejado de sincronizar o tiene errores',
    icon: <Shield className="w-5 h-5" />,
    color: '#7c3aed',
    steps: [
      { step: 1, action: 'Identificar la marca afectada', detail: 'Revisa WooCommerce en el sidebar para ver estado de integraciones' },
      { step: 2, action: 'Verificar conectividad', detail: 'Revisa si el plugin está activo y la API key es válida' },
      { step: 3, action: 'Revisar logs de error', detail: 'Ve a Confiabilidad para ver errores recientes de la integración' },
      { step: 4, action: 'Contactar al cliente', detail: 'Informa sobre el problema y ofrece asistencia para reconectar' },
      { step: 5, action: 'Seguimiento', detail: 'Monitorea la integración durante 48h después de la corrección' },
    ],
    relatedLinks: [
      { label: 'WooCommerce', href: '/admin/woocommerce' },
      { label: 'Confiabilidad', href: '/admin/health' },
    ],
  },
  {
    id: 'churn-prevention',
    title: 'Prevención de churn',
    description: 'Marca paga con señales tempranas de abandono',
    icon: <Users className="w-5 h-5" />,
    color: '#3b82f6',
    steps: [
      { step: 1, action: 'Identificar marca en riesgo', detail: 'Ve a Riesgo y filtra por riesgo alto (>50 puntos)' },
      { step: 2, action: 'Analizar patrón de uso', detail: 'Revisa la ficha 360: últimas generaciones, productos activos, errores' },
      { step: 3, action: 'Determinar causa raíz', detail: '¿Sin uso? ¿Errores frecuentes? ¿Problemas de pago? ¿Integración rota?' },
      { step: 4, action: 'Aplicar acción comercial', detail: 'Ofrece extensión de trial, descuento, o sesión de onboarding según la causa' },
      { step: 5, action: 'Medir respuesta', detail: 'Monitorea uso en los 7 días siguientes a la intervención' },
    ],
    relatedLinks: [
      { label: 'Riesgo', href: '/admin/risk' },
      { label: 'Marcas', href: '/admin/brands' },
    ],
  },
  {
    id: 'new-brand-onboarding',
    title: 'Onboarding de nueva marca',
    description: 'Checklist para asegurar que una nueva marca tenga éxito desde el día 1',
    icon: <CheckCircle className="w-5 h-5" />,
    color: '#10b981',
    steps: [
      { step: 1, action: 'Verificar cuenta creada', detail: 'Confirma que la marca aparece en el listado con plan TRIAL' },
      { step: 2, action: 'Enviar credenciales', detail: 'Asegúrate de que el email de bienvenida fue enviado correctamente' },
      { step: 3, action: 'Configurar productos iniciales', detail: 'Ayuda al cliente a subir sus primeros 3-5 productos' },
      { step: 4, action: 'Activar integración', detail: 'Si tiene WooCommerce, guía la instalación del plugin' },
      { step: 5, action: 'Prueba de generación', detail: 'Realiza una generación de prueba para confirmar que todo funciona' },
      { step: 6, action: 'Seguimiento a 48h', detail: 'Verifica que la marca haya realizado al menos 2 generaciones por su cuenta' },
    ],
    relatedLinks: [
      { label: 'Marcas', href: '/admin/brands' },
      { label: 'Mission Control', href: '/admin/dashboard' },
    ],
  },
];

export default function AdminPlaybooksPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = playbooks.find(p => p.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Playbooks Operativos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Guías paso a paso para los casos operativos más frecuentes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playbooks.map(pb => (
          <button
            key={pb.id}
            onClick={() => setSelectedId(selectedId === pb.id ? null : pb.id)}
            className={`text-left rounded-[1.5rem] p-5 transition-all duration-200 border ${selectedId === pb.id ? 'ring-2' : 'hover:opacity-90'}`}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: selectedId === pb.id ? pb.color : 'var(--border-color)',
              ...(selectedId === pb.id ? { boxShadow: `0 0 0 2px ${pb.color}` } : {}),
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: pb.color + '20', color: pb.color }}>
                {pb.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{pb.title}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{pb.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: pb.color }}>
              {pb.steps.length} pasos <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-[2rem] p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5" style={{ color: selected.color }} />
            <div>
              <h2 className="font-jakarta font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{selected.title}</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selected.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            {selected.steps.map(step => (
              <div key={step.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ backgroundColor: selected.color + '20', color: selected.color }}>
                  {step.step}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{step.action}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Ir a:</span>
            {selected.relatedLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-xs font-medium px-3 py-1 rounded-lg hover:opacity-80 transition-opacity" style={{ backgroundColor: selected.color + '15', color: selected.color }}>
                {link.label} <ArrowRight className="w-3 h-3 inline ml-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
