'use client';

import React from 'react';
import type { SubscriptionInfo } from '@/services/subscription.service';
import { formatPlanPrice } from '@/utils/currency';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionInfo: SubscriptionInfo;
}

export function SubscriptionModal({ isOpen, onClose, subscriptionInfo }: SubscriptionModalProps) {
  if (!isOpen) return null;

  const { brand, daysRemaining, status, isInTrial, trialDaysRemaining, trialEndDate } = subscriptionInfo;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusText = () => {
    if (isInTrial) return 'Período de prueba';
    switch (status) {
      case 'active': return 'Activa';
      case 'expiring_soon': return 'Por vencer';
      case 'expired': return 'Vencida';
      case 'suspended': return 'Suspendida';
      default: return 'Sin suscripción';
    }
  };

  const getStatusColor = () => {
    if (isInTrial) return 'text-blue-600';
    switch (status) {
      case 'active': return 'text-green-600';
      case 'expiring_soon': return 'text-yellow-600';
      case 'expired':
      case 'suspended': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPlanPrice = () => {
    return formatPlanPrice(brand.plan);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                {isInTrial ? 'Período de Prueba Gratuito' : 'Detalles de Suscripción'}
              </h3>

              <div className="space-y-4">
                {/* Trial banner */}
                {isInTrial && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-blue-800">
                      Estás usando el período de prueba gratuito.{' '}
                      <strong>{trialDaysRemaining} {trialDaysRemaining === 1 ? 'día' : 'días'} restantes</strong>.
                      Al vencer, contacta a soporte para activar tu plan.
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Estado:</span>
                  <span className={`text-sm font-semibold ${getStatusColor()}`}>{getStatusText()}</span>
                </div>

                {/* Plan */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Plan:</span>
                  <span className="text-sm font-semibold text-gray-900">{brand.plan}</span>
                </div>

                {/* Price */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Precio:</span>
                  <span className="text-sm font-semibold text-gray-900">{getPlanPrice()}</span>
                </div>

                {/* Trial end date */}
                {isInTrial && trialEndDate && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Fin del período de prueba:</span>
                    <span className="text-sm text-gray-900">{formatDate(trialEndDate)}</span>
                  </div>
                )}

                {/* Days remaining (subscription) */}
                {!isInTrial && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Días restantes:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
                    </span>
                  </div>
                )}

                {/* Start date */}
                {!isInTrial && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Fecha de inicio:</span>
                    <span className="text-sm text-gray-900">{formatDate(brand.subscriptionStartDate)}</span>
                  </div>
                )}

                {/* End date */}
                {!isInTrial && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Fecha de vencimiento:</span>
                    <span className="text-sm text-gray-900">{formatDate(brand.subscriptionEndDate)}</span>
                  </div>
                )}

                {/* Last payment */}
                {!isInTrial && brand.lastPaymentDate && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Último pago:</span>
                    <span className="text-sm text-gray-900">{formatDate(brand.lastPaymentDate)}</span>
                  </div>
                )}

                {/* Warning for expiring/expired/suspended */}
                {!isInTrial && (status === 'expiring_soon' || status === 'expired' || status === 'suspended') && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      {status === 'suspended'
                        ? 'Tu suscripción ha sido suspendida. Por favor, contacta a soporte para renovar.'
                        : status === 'expired'
                        ? 'Tu suscripción ha vencido. Por favor, contacta a soporte para renovar.'
                        : 'Tu suscripción está por vencer. Por favor, renueva pronto para evitar interrupciones.'}
                    </p>
                    <p className="text-sm text-yellow-800 mt-2">
                      <strong>Contacto:</strong> soporte@lookitry.com
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
