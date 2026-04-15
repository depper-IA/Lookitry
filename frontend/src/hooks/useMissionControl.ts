// Lookitry Mission Control - Polling Hook
// v1.0 | Abril 2026

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

interface PollingOptions {
  interval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: unknown) => void;
}

interface PollingResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

// ============================================================================
// useRealtimePolling - Hook genérico para polling de datos
// ============================================================================

export function useRealtimePolling<T>(
  fetcher: () => Promise<T>,
  options: PollingOptions = {}
): PollingResult<T> {
  const { 
    interval = 30000, 
    enabled = true, 
    onError, 
    onSuccess 
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetcherRef = useRef(fetcher);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update fetcher ref when it changes
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
      setLoading(false);
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    }
  }, [onError, onSuccess]);

  // Initial fetch and polling
  useEffect(() => {
    if (!enabled) return;

    fetchData();
    
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}

// ============================================================================
// useMissionControlData - Hook central para todos los datos del MC
// ============================================================================

import type {
  Agent,
  TryOnMetrics,
  BusinessMetrics,
  SecurityMetrics,
  TradingMetrics,
  GrowthMetrics,
  AutolookitryMetrics,
  SystemStatus,
} from '@/lib/mission-control/types';
import {
  MOCK_AGENTS,
  MOCK_TRYON_METRICS,
  MOCK_BUSINESS_METRICS,
  MOCK_SECURITY_METRICS,
  MOCK_TRADING_METRICS,
  MOCK_GROWTH_METRICS,
  MOCK_AUTOLOOKITRY_METRICS,
  MOCK_SYSTEM_STATUS,
  POLLING_INTERVALS,
} from '@/lib/mission-control/constants';

interface MissionControlData {
  agents: PollingResult<Agent[]>;
  tryon: PollingResult<TryOnMetrics>;
  business: PollingResult<BusinessMetrics>;
  security: PollingResult<SecurityMetrics>;
  trading: PollingResult<TradingMetrics>;
  growth: PollingResult<GrowthMetrics>;
  autolookitry: PollingResult<AutolookitryMetrics>;
  system: PollingResult<SystemStatus>;
  globalStatus: 'healthy' | 'warning' | 'critical';
  refetchAll: () => void;
}

// Simulated API calls (replace with actual API calls in production)
const fetchAgents = async (): Promise<Agent[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_AGENTS;
};

const fetchTryOnMetrics = async (): Promise<TryOnMetrics> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_TRYON_METRICS;
};

const fetchBusinessMetrics = async (): Promise<BusinessMetrics> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return MOCK_BUSINESS_METRICS;
};

const fetchSecurityMetrics = async (): Promise<SecurityMetrics> => {
  await new Promise(resolve => setTimeout(resolve, 350));
  return MOCK_SECURITY_METRICS;
};

const fetchTradingMetrics = async (): Promise<TradingMetrics> => {
  await new Promise(resolve => setTimeout(resolve, 450));
  return MOCK_TRADING_METRICS;
};

const fetchGrowthMetrics = async (): Promise<GrowthMetrics> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return MOCK_GROWTH_METRICS;
};

const fetchAutolookitryMetrics = async (): Promise<AutolookitryMetrics> => {
  await new Promise(resolve => setTimeout(resolve, 350));
  return MOCK_AUTOLOOKITRY_METRICS;
};

const fetchSystemStatus = async (): Promise<SystemStatus> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_SYSTEM_STATUS;
};

export function useMissionControlData(enabled = true): MissionControlData {
  const agents = useRealtimePolling(fetchAgents, { 
    interval: POLLING_INTERVALS.agents, 
    enabled 
  });
  
  const tryon = useRealtimePolling(fetchTryOnMetrics, { 
    interval: POLLING_INTERVALS.tryon, 
    enabled 
  });
  
  const business = useRealtimePolling(fetchBusinessMetrics, { 
    interval: POLLING_INTERVALS.business, 
    enabled 
  });
  
  const security = useRealtimePolling(fetchSecurityMetrics, { 
    interval: POLLING_INTERVALS.security, 
    enabled 
  });
  
  const trading = useRealtimePolling(fetchTradingMetrics, { 
    interval: POLLING_INTERVALS.trading, 
    enabled 
  });
  
  const growth = useRealtimePolling(fetchGrowthMetrics, { 
    interval: POLLING_INTERVALS.growth, 
    enabled 
  });
  
  const autolookitry = useRealtimePolling(fetchAutolookitryMetrics, { 
    interval: 60000, 
    enabled 
  });
  
  const system = useRealtimePolling(fetchSystemStatus, { 
    interval: POLLING_INTERVALS.system, 
    enabled 
  });

  // Calculate global status
  const globalStatus: 'healthy' | 'warning' | 'critical' = 
    security.data?.criticalAlerts && security.data.criticalAlerts.length > 0
      ? 'critical'
      : system.data?.overall === 'warning'
      ? 'warning'
      : 'healthy';

  const refetchAll = () => {
    agents.refetch();
    tryon.refetch();
    business.refetch();
    security.refetch();
    trading.refetch();
    growth.refetch();
    autolookitry.refetch();
    system.refetch();
  };

  return {
    agents,
    tryon,
    business,
    security,
    trading,
    growth,
    autolookitry,
    system,
    globalStatus,
    refetchAll,
  };
}

// ============================================================================
// useAgentStatus - Hook para estado de agentes en sidebar
// ============================================================================

export function useAgentStatus(agentsData: Agent[] | null) {
  return agentsData?.reduce((acc, agent) => {
    acc[agent.id] = agent.status;
    return acc;
  }, {} as Record<string, 'online' | 'busy' | 'offline'>) ?? {};
}