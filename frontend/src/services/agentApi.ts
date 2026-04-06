/**
 * API service para el dashboard de Agents Activity.
 * Consume los endpoints de /api/agent/* del backend.
 */

import { adminApi } from './adminApi';

// Tipos que coinciden con backend/src/services/agent-activity.service.ts

export interface AgentActivity {
  id: string;
  agent_name: string;
  task_type: string;
  task_description?: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  duration_ms?: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  finished_at?: string;
}

export interface AgentStats {
  totalTasks: number;
  successRate: number;
  avgDuration: number;
  taskDistribution: { taskType: string; count: number }[];
  recentActivity: AgentActivity[];
}

export interface AgentStatsByAgent extends AgentStats {
  agentName: string;
}

export interface TrendData {
  date: string;
  count: number;
  successRate: number;
}

export interface TaskDistribution {
  taskType: string;
  count: number;
  percentage: number;
}

// Tipos para agentes activos (heartbeat)
export interface ActiveAgent {
  agent_name: string;
  current_task_description: string | null;
  status: 'idle' | 'working' | 'error';
  last_heartbeat_at: string;
}

// GET /api/agent/activities
export async function fetchActivities(params: {
  agent?: string;
  taskType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<AgentActivity[]> {
  const query = new URLSearchParams();
  if (params.agent) query.set('agentName', params.agent);
  if (params.taskType) query.set('taskType', params.taskType);
  if (params.status) query.set('status', params.status);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.offset) query.set('offset', params.offset.toString());
  
  return adminApi.get(`/api/agent/activities?${query.toString()}`);
}

// GET /api/agent/stats
export async function fetchAgentStats(): Promise<AgentStats> {
  return adminApi.get('/api/agent/stats');
}

// GET /api/agent/stats/:agentName
export async function fetchAgentDetail(agentName: string): Promise<AgentStatsByAgent> {
  return adminApi.get(`/api/agent/stats/${encodeURIComponent(agentName)}`);
}

// GET /api/agent/trends/:agentName?days=7
export async function fetchAgentTrends(agentName: string, days = 7): Promise<TrendData[]> {
  return adminApi.get(`/api/agent/trends/${encodeURIComponent(agentName)}?days=${days}`);
}

// GET /api/agent/distribution
export async function fetchTaskDistribution(): Promise<{ distribution: TaskDistribution[] }> {
  return adminApi.get('/api/agent/distribution');
}

// GET /api/agent/alive
export async function fetchActiveAgents(): Promise<{ agents: ActiveAgent[]; timestamp: string }> {
  return adminApi.get('/api/agent/alive');
}

// GET /api/agent/export (returns CSV)
export async function exportAgentData(params: {
  agent?: string;
  taskType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Blob> {
  const query = new URLSearchParams();
  if (params.agent) query.set('agentName', params.agent);
  if (params.taskType) query.set('taskType', params.taskType);
  if (params.status) query.set('status', params.status);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  const response = await fetch(`${apiBase}/api/agent/export?${query.toString()}`, {
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error('Error exporting data');
  return response.blob();
}

export const agentApi = {
  fetchActivities,
  fetchAgentStats,
  fetchAgentDetail,
  fetchAgentTrends,
  fetchTaskDistribution,
  exportAgentData,
  fetchActiveAgents,
};
