/**
 * useCurrency — Hook para detección automática de moneda por geolocalización
 * 
 * Si el usuario está fuera de Colombia → USD
 * Si está en Colombia → COP (por defecto)
 * 
 * La detección se hace solo en la primera visita y se guarda en sessionStorage.
 * Si el usuario cambia manualmente la moneda, se guarda en localStorage y se respeta.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

type Currency = 'COP' | 'USD';

// Constantes
const COLOMBIA_COUNTRY_CODE = 'CO';
const CURRENCY_STORAGE_KEY = 'currency';
const GEO_DETECTED_STORAGE_KEY = 'geo_detected_currency'; // Flag: ¿la moneda fue auto-detectada?
const SESSION_GEO_KEY = 'geo_country_code';

/**
 * Detecta el país del usuario via API gratuita de geolocalización
 * Fallback: si falla, asume Colombia (COP)
 */
async function detectCountry(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.country_code) {
        return data.country_code;
      }
    }
  } catch {
    // Silently fail
  }

  // Default fallback: asumir Colombia
  return COLOMBIA_COUNTRY_CODE;
}

/**
 * Hook principal para gestión de currency con auto-detección
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>('COP');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Efecto inicial: cargar localStorage y detectar geolocalización
  useEffect(() => {
    let cancelled = false;

    async function initCurrency() {
      // 1. Si el usuario ya tiene selección manual, respetarla
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null;
      
      if (savedCurrency === 'COP' || savedCurrency === 'USD') {
        if (cancelled) return;
        setCurrencyState(savedCurrency);
        setIsAutoDetected(false);
        setIsLoading(false);
        return;
      }

      // 2. Si ya detectamos antes en esta sesión, usar ese resultado
      const sessionCountry = sessionStorage.getItem(SESSION_GEO_KEY);
      if (sessionCountry) {
        if (cancelled) return;
        const detectedCurrency: Currency = sessionCountry === COLOMBIA_COUNTRY_CODE ? 'COP' : 'USD';
        setCurrencyState(detectedCurrency);
        setIsAutoDetected(true);
        setIsLoading(false);
        return;
      }

      // 3. Detectar geolocalización (solo primera vez)
      const country = await detectCountry();
      if (cancelled) return;

      // Guardar en sessionStorage para no volver a llamar
      sessionStorage.setItem(SESSION_GEO_KEY, country);

      const detectedCurrency: Currency = country === COLOMBIA_COUNTRY_CODE ? 'COP' : 'USD';
      setCurrencyState(detectedCurrency);
      setIsAutoDetected(true);
      setIsLoading(false);
    }

    initCurrency();

    return () => {
      cancelled = true;
    };
  }, []);

  // Cuando el usuario cambia manualmente, guardar en localStorage
  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    setIsAutoDetected(false); // Ya no es auto-detectada
    localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    localStorage.setItem(GEO_DETECTED_STORAGE_KEY, 'false');
    // Disparar evento para sincronizar otros componentes
    window.dispatchEvent(new Event('currencyChange'));
  }, []);

  // Toggle rápido COP/USD
  const toggleCurrency = useCallback(() => {
    const newCurrency = currency === 'COP' ? 'USD' : 'COP';
    setCurrency(newCurrency);
  }, [currency, setCurrency]);

  return {
    currency,
    setCurrency,
    toggleCurrency,
    isAutoDetected,
    isLoading,
  };
}

/**
 * Versión simplificada para componentes que solo necesitan el valor actual
 * No hace detección ni listeners — solo lee de localStorage
 */
export function useCurrencyStatic(): Currency {
  const [currency, setCurrency] = useState<Currency>('COP');

  useEffect(() => {
    // Only read from localStorage on client after hydration
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency;
    if (saved === 'COP' || saved === 'USD') {
      setCurrency(saved);
    }

    const handleCurrencyChange = () => {
      const updated = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency;
      if (updated === 'COP' || updated === 'USD') {
        setCurrency(updated);
      }
    };

    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange);
    };
  }, []);

  return currency;
}
