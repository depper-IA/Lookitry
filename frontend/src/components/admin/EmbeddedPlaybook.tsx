'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, ChevronUp, ArrowRight, Users, CreditCard, AlertTriangle, Zap, Shield, CheckCircle } from 'lucide-react';

interface PlaybookStep {
  step: number;
  action: string;
  detail: string;
}

interface PlaybookData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: PlaybookStep[];
  relatedLinks?: Array<{ label: string; href: string }>;
}

const playbookDefinitions: Record<string, Omit<PlaybookData, 'id'>> = {
  'churn-prevention': {
    title: 'Prevención de churn',
    description: 'Marca paga con señales tempranas de abandono',
    icon: <Users className="w-4 h-4" />,
    color: '#3b82f6',
    steps: [
      { step: 1, action: 'Identificar marca en riesgo', detail: 'Ve a Riesgo y filtra por riesgo alto (>50 puntos)' },
      { step: 2, action: 'Analizar patrón de uso', detail: 'Revisa la ficha 360: últimas generaciones, productos activos, errores' },
      { step: 3, action: 'Determinar causa raíz', detail: '¿Sin uso? ¿Errores frecuentes? ¿Problemas de pago? ¿Integración rota?' },
      { step: 4, action: 'Aplicar acción comercial', detail: 'Ofrece extensión de trial, descuento, o sesión de onboarding según la causa' },
      { step: 5, action: 'Medir respuesta', detail: 'Monitorea uso en los 7 días siguientes a la intervención' },
    ],
  },
  'payment-failed': {
    title: 'Pago fallido de suscripción',
    description: 'Cliente con pago rechazado o pendiente de resolución',
    icon: <CreditCard className="w-4 h-4" />,
    color: '#ef4444',
    steps: [
      { step: 1, action: 'Identificar el pago fallido', detail: 'Revisa la cola de pagos fallidos en esta página' },
      { step: 2, action: 'Verificar estado de la suscripción', detail: 'Abre la ficha 360 de la marca y revisa la pestaña Finanzas' },
      { step: 3, action: 'Confirmar con el cliente', detail: 'Contacta para verificar si intentó pagar o si fue un error del sistema' },
      { step: 4, action: 'Resolver', detail: 'Si el pago fue exitoso externamente, regístralo manualmente. Si falló, ofrece alternativa' },
      { step: 5, action: 'Actualizar estado', detail: 'Registra el pago o suspende la cuenta según corresponda' },
    ],
  },
  'trial-stalled': {
    title: 'Trial estancado sin activación',
    description: 'Cliente en trial que no ha generado valor en los primeros días',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: '#f59e0b',
    steps: [
      { step: 1, action: 'Identificar el trial', detail: 'Ve a Riesgo y filtra por trials con más de 3 días sin uso' },
      { step: 2, action: 'Revisar ficha de la marca', detail: 'Abre la ficha 360 para ver si hay productos configurados' },
      { step: 3, action: 'Verificar integración', detail: 'Revisa si la marca tiene WooCommerce activo o mini-landing' },
      { step: 4, action: 'Contactar al cliente', detail: 'Envía email o WhatsApp ofreciendo ayuda para la configuración inicial' },
      { step: 5, action: 'Registrar acción', detail: 'Deja nota en el historial de la marca para trazabilidad' },
    ],
  },
  'ia-costs-spike': {
    title: 'Costo IA disparado',
    description: 'Consumo de créditos IA fuera de rango normal',
    icon: <Zap className="w-4 h-4" />,
    color: '#8b5cf6',
    steps: [
      { step: 1, action: 'Verificar alertas de créditos', detail: 'Revisa Costos e IA para ver qué proveedor tiene consumo anómalo' },
      { step: 2, action: 'Identificar la causa', detail: 'Revisa generaciones recientes fallidas o repetidas en Mission Control' },
      { step: 3, action: 'Segmentar por marca', detail: 'Identifica si una marca específica está consumiendo desproporcionadamente' },
      { step: 4, action: 'Acción correctiva', detail: 'Si es error del sistema: revisa prompts. Si es abuso: contacta al cliente' },
      { step: 5, action: 'Ajustar límites', detail: 'Considera ajustar límites de generaciones por marca si es necesario' },
    ],
  },
};

interface EmbeddedPlaybookProps {
  playbookId: string;
  showWhen?: boolean;
  title?: string;
}

export function EmbeddedPlaybook({ playbookId, showWhen = true, title }: EmbeddedPlaybookProps) {
  const [expanded, setExpanded] = useState(false);
  const definition = playbookDefinitions[playbookId];

  if (!showWhen || !definition) return null;

  const playbook: PlaybookData = { id: playbookId, ...definition };
  const visibleSteps = expanded ? playbook.steps : playbook.steps.slice(0, 2);

  return (
    <div
      className="rounded-[1.5rem] overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: `1px solid ${playbook.color}30`,
      }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 text-left hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: playbook.color + '20', color: playbook.color }}
          >
            {playbook.icon}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title || playbook.title}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {playbook.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: playbook.color + '15', color: playbook.color }}>
            {playbook.steps.length} pasos
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${playbook.color}15` }}>
          <div className="pt-4 space-y-3">
            {visibleSteps.map(step => (
              <div key={step.step} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ backgroundColor: playbook.color + '20', color: playbook.color }}
                >
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{step.action}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 flex items-center justify-between">
            <Link
              href={`/admin/playbooks?playbook=${playbook.id}`}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ backgroundColor: playbook.color + '15', color: playbook.color }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Ver playbook completo
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export { playbookDefinitions };
export type { PlaybookData, PlaybookStep };
