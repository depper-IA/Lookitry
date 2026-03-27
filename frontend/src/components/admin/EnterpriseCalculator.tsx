'use client';

import { useState } from 'react';
import { formatCurrency } from '@/utils/currency';

export default function EnterpriseCalculator() {
  // Parámetros base del Plan Enterprise
  const basePrice = 800000;
  const baseProducts = 50;
  const baseGenerations = 2000;

  // Variables de excedentes
  const extraProductCost = 10000;
  const extraGenerationCost = 150;
  const setupFee = 500000;

  // Estados del input
  const [targetProducts, setTargetProducts] = useState<number>(50);
  const [targetGenerations, setTargetGenerations] = useState<number>(2000);
  const [includeSetupFee, setIncludeSetupFee] = useState<boolean>(true);

  // Cálculos
  const extraProducts = Math.max(0, targetProducts - baseProducts);
  const extraGenerations = Math.max(0, targetGenerations - baseGenerations);

  const extraProductsTotal = extraProducts * extraProductCost;
  const extraGenerationsTotal = extraGenerations * extraGenerationCost;

  const monthlyTotal = basePrice + extraGenerationsTotal; // Los productos suelen ser pago único, pero aquí mostramos el desglose
  const firstMonthTotal = monthlyTotal + extraProductsTotal + (includeSetupFee ? setupFee : 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-syne font-bold text-white mb-2">Calculadora de Cotizaciones Enterprise</h2>
        <p className="text-sm text-[#888] mb-8">
          Modela el pricing "Base + Variable" para clientes de alto volumen.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna Izquierda: Entradas */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-[#888] mb-2">
                Productos Totales Estimados (Catálogo)
              </label>
              <input
                type="number"
                min={0}
                value={targetProducts}
                onChange={(e) => setTargetProducts(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:ring-2 focus:ring-[#FF5C3A] outline-none transition-all"
              />
              <p className="text-[11px] text-[#555] mt-1.5">
                Base incluye 50. Extra: $10.000 COP c/u (pago único subida).
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#888] mb-2">
                Generaciones Mensuales Estimadas
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={targetGenerations}
                onChange={(e) => setTargetGenerations(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:ring-2 focus:ring-[#FF5C3A] outline-none transition-all"
              />
              <p className="text-[11px] text-[#555] mt-1.5">
                Base incluye 2.000. Extra: $150 COP c/u (recurrente).
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 border border-[#333] rounded-lg bg-[#0f0f0f] hover:bg-[#1a1a1a] transition-colors">
               <input
                 type="checkbox"
                 checked={includeSetupFee}
                 onChange={(e) => setIncludeSetupFee(e.target.checked)}
                 className="w-4 h-4 text-[#FF5C3A] bg-black border-[#444] rounded focus:ring-0 focus:ring-offset-0 accent-[#FF5C3A]"
               />
               <div>
                  <div className="text-sm font-medium text-white">Cobrar Setup Fee (Onboarding)</div>
                  <div className="text-[11px] text-[#777] mt-0.5">Incluye limpieza y auditoría de las primeras 50 fotos.</div>
               </div>
            </label>
          </div>

          {/* Columna Derecha: Resumen */}
          <div className="p-6 bg-black border border-[#222] rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-[#666] uppercase tracking-wider mb-6">Desglose de Cotización</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center text-[#999]">
                  <span>Plan Base (Recurrente)</span>
                  <span className="text-white font-medium">{formatCurrency(basePrice)}</span>
                </div>

                {extraGenerations > 0 && (
                  <div className="flex justify-between items-center text-[#999]">
                    <span>Excedente {extraGenerations} Gens (Recurrente)</span>
                    <span className="text-[#FF5C3A] font-medium">+{formatCurrency(extraGenerationsTotal)}</span>
                  </div>
                )}

                <div className="my-4 border-t border-[#222]"></div>

                {extraProducts > 0 && (
                  <div className="flex justify-between items-center text-[#999]">
                    <span>Carga {extraProducts} Prod. Extra (Pago Único)</span>
                    <span className="text-[#FF5C3A] font-medium">+{formatCurrency(extraProductsTotal)}</span>
                  </div>
                )}

                {includeSetupFee && (
                  <div className="flex justify-between items-center text-[#999]">
                    <span>Setup & Onboarding (Pago Único)</span>
                    <span className="text-white font-medium">+{formatCurrency(setupFee)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#222]">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-[#888]">Pago Mes 1 (Total)</span>
                <span className="text-2xl font-bold font-syne text-white">{formatCurrency(firstMonthTotal)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm text-[#888]">Meses Siguientes (Fijo)</span>
                <span className="text-lg font-bold font-syne text-[#aaa]">{formatCurrency(monthlyTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
