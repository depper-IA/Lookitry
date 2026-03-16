'use client';

import React from 'react';

interface SuspensionModalProps {
  brandName: string;
  brandEmail: string;
  plan: string;
  isTrialExpired?: boolean;
}

export function SuspensionModal({
  brandName,
  plan,
  isTrialExpired = false,
}: SuspensionModalProps) {
  const planPrice = plan === 'PRO' ? '250.000' : '150.000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${isTrialExpired ? 'bg-amber-600' : 'bg-red-600'}`}>
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-white">
              {isTrialExpired ? 'Período de Prueba Vencido' : 'Suscripción Suspendida'}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="mb-6">
            <p className="text-lg text-gray-800 mb-4">
              <strong>{brandName}</strong>,{' '}
              {isTrialExpired
                ? 'tu período de prueba gratuito ha vencido.'
                : 'tu suscripción ha sido suspendida por falta de pago.'}
            </p>
            <p className="text-gray-700 mb-4">
              {isTrialExpired
                ? 'Para continuar usando el servicio, contacta a nuestro equipo para activar tu plan.'
                : 'Para continuar usando el servicio de probador virtual, necesitas renovar tu suscripción.'}
            </p>
          </div>

          {/* Plan Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Información de tu Plan</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">{plan}</span>
              </div>
              <div className="flex justify-between">
                <span>Precio mensual:</span>
                <span className="font-medium">${planPrice} COP</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {isTrialExpired ? 'Pasos para Activar tu Plan' : 'Pasos para Renovar'}
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Realiza el pago de <strong>${planPrice} COP</strong> a nuestra cuenta</li>
              <li>Envía el comprobante de pago por WhatsApp o email</li>
              <li>Espera la confirmación de nuestro equipo (máximo 24 horas)</li>
              <li>Tu acceso será activado automáticamente</li>
            </ol>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Información de Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <div>
                  <p className="text-sm font-medium">WhatsApp</p>
                  <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline">
                    +57 300 123 4567
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a href="mailto:soporte@lookitry.com" className="text-sm text-blue-600 hover:underline">
                    soporte@lookitry.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Tus datos y configuración están seguros.{' '}
              {isTrialExpired
                ? 'Una vez activado tu plan, podrás acceder a todas las funcionalidades.'
                : 'Una vez renovada tu suscripción, podrás acceder nuevamente a todas las funcionalidades del sistema.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
