'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { analyticsService, type BrandAnalytics } from '@/services/analytics.service';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsService.getOverview();
      setAnalytics(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonthYear = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p style={{ color: 'var(--text-muted)' }} className="mt-4 text-sm">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-3xl font-syne font-bold">Analytics</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">Estadísticas de uso y rendimiento</p>
        </div>
        <div className="border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const maxGenerations = Math.max(...analytics.generationsByMonth.map(m => m.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ color: 'var(--text-primary)' }} className="text-3xl font-syne font-bold">Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
          Estadísticas de uso y rendimiento de tu probador virtual
        </p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Generaciones', value: analytics!.totalGenerations,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
          },
          {
            label: 'Exitosas', value: analytics!.successfulGenerations,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
          },
          {
            label: 'Fallidas', value: analytics!.failedGenerations,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
          },
          {
            label: 'Tasa de Éxito', value: `${analytics!.successRate.toFixed(1)}%`,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
          },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {stat.icon}
                </svg>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium">{stat.label}</p>
                <p style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de generaciones por mes */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-6">
        <h2 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold mb-6">Generaciones por Mes</h2>
        {analytics!.generationsByMonth.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">No hay datos de generaciones aún</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics!.generationsByMonth.map((monthData) => (
              <div key={monthData.month}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                    {formatMonthYear(monthData.month)}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">
                    {monthData.count}
                  </span>
                </div>
                <div style={{ background: 'var(--bg-hover)' }} className="w-full rounded-full h-3">
                  <div
                    className="bg-[#FF5C3A] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(monthData.count / maxGenerations) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Productos más usados */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-6">
        <h2 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold mb-6">Productos Más Usados</h2>
        {analytics!.mostUsedProducts.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p style={{ color: 'var(--text-muted)' }} className="mt-2 text-sm">No hay productos usados aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ borderColor: 'var(--border-color)' }} className="border-b">
                  <th style={{ color: 'var(--text-muted)' }} className="pb-3 text-left text-xs font-semibold uppercase tracking-wide">Producto</th>
                  <th style={{ color: 'var(--text-muted)' }} className="pb-3 text-left text-xs font-semibold uppercase tracking-wide">Categoría</th>
                  <th style={{ color: 'var(--text-muted)' }} className="pb-3 text-left text-xs font-semibold uppercase tracking-wide">Total</th>
                  <th style={{ color: 'var(--text-muted)' }} className="pb-3 text-left text-xs font-semibold uppercase tracking-wide">Exitosas</th>
                  <th style={{ color: 'var(--text-muted)' }} className="pb-3 text-left text-xs font-semibold uppercase tracking-wide">Último Uso</th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--border-color)' }} className="divide-y">
                {analytics!.mostUsedProducts.map((product) => (
                  <tr key={product.productId} className="hover:opacity-80 transition-opacity">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                          src={product.productImageUrl}
                          alt={product.productName}
                        />
                        <span style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">{product.productName}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#FF5C3A]/10 text-[#FF5C3A]">
                        {product.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }} className="py-3.5 text-sm font-bold">{product.totalGenerations}</td>
                    <td style={{ color: 'var(--text-secondary)' }} className="py-3.5 text-sm">{product.successfulGenerations}</td>
                    <td style={{ color: 'var(--text-muted)' }} className="py-3.5 text-sm">{formatDate(product.lastUsed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
