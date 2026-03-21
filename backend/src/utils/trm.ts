import axios from 'axios';

/**
 * Servicio simple para obtener la TRM (USD/COP)
 * Utiliza un fallback si la API falla.
 */
export class TrmService {
  private static cachedTrm: number | null = null;
  private static lastFetch: number = 0;
  private static CACHE_DURATION = 1000 * 60 * 60 * 6; // 6 horas

  private static FALLBACK_TRM = 4000;

  /**
   * Obtiene la TRM actual
   */
  static async getCurrentTrm(): Promise<number> {
    const now = Date.now();
    
    // Devolver caché si es válida
    if (this.cachedTrm && (now - this.lastFetch < this.CACHE_DURATION)) {
      return this.cachedTrm;
    }

    try {
      // Usar exchangerate-api.com (free tier no requiere auth para peticiones simples a veces, 
      // o usamos una URL pública de confianza)
      const response = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 5000 });
      const rate = response.data?.rates?.COP;
      
      if (rate && typeof rate === 'number') {
        this.cachedTrm = Math.round(rate * 100) / 100;
        this.lastFetch = now;
        console.log(`[TRM] Tasa actualizada: 1 USD = ${this.cachedTrm} COP`);
        return this.cachedTrm;
      }
    } catch (error) {
      console.error('[TRM] Error al obtener TRM, usando fallback:', error instanceof Error ? error.message : error);
    }

    return this.cachedTrm || this.FALLBACK_TRM;
  }
}
