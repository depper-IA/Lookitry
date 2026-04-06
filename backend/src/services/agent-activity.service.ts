import { supabaseAdmin } from '../config/supabase';

interface AgentActivity {
  id?: string;
  agent_name: string;
  task_type: string;
  task_description?: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  duration_ms?: number;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  finished_at?: string;
}

interface ActivityFilters {
  agentName?: string;
  taskType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface AgentStats {
  totalTasks: number;
  successRate: number;
  avgDuration: number;
  taskDistribution: { taskType: string; count: number }[];
  recentActivity: AgentActivity[];
}

class AgentActivityService {
  /**
   * Registra inicio de actividad de agente.
   */
  async logActivity(activity: Omit<AgentActivity, 'id' | 'created_at'>): Promise<{ id: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('agent_activities')
        .insert({
          agent_name: activity.agent_name,
          task_type: activity.task_type,
          task_description: activity.task_description ?? null,
          status: activity.status,
          duration_ms: activity.duration_ms ?? null,
          error_message: activity.error_message ?? null,
          metadata: activity.metadata ?? {},
        })
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('[AgentActivity] Error inserting activity:', error);
        throw error;
      }

      if (!data?.id) {
        throw new Error('Failed to insert activity: no id returned');
      }

      return { id: data.id };
    } catch (err) {
      console.error('[AgentActivity] logActivity failed:', err);
      throw err;
    }
  }

  /**
   * Actualiza actividad con estado final.
   */
  async logActivityEnd(
    id: string,
    status: 'success' | 'failed' | 'cancelled',
    durationMs: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('agent_activities')
        .update({
          status,
          duration_ms: durationMs,
          error_message: errorMessage ?? null,
          finished_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('[AgentActivity] Error updating activity:', error);
        throw error;
      }
    } catch (err) {
      console.error('[AgentActivity] logActivityEnd failed:', err);
      throw err;
    }
  }

  /**
   * Consulta actividades con filtros.
   */
  async getActivities(filters: ActivityFilters): Promise<AgentActivity[]> {
    try {
      let query = supabaseAdmin
        .from('agent_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.agentName) {
        query = query.eq('agent_name', filters.agentName);
      }
      if (filters.taskType) {
        query = query.eq('task_type', filters.taskType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AgentActivity] Error fetching activities:', error);
        throw error;
      }

      return data ?? [];
    } catch (err) {
      console.error('[AgentActivity] getActivities failed:', err);
      throw err;
    }
  }

  /**
   * Estadísticas agregadas de todos los agentes.
   */
  async getStats(startDate?: string, endDate?: string): Promise<AgentStats> {
    try {
      let query = supabaseAdmin
        .from('agent_activities')
        .select('agent_name, task_type, status, duration_ms, created_at');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AgentActivity] Error fetching stats:', error);
        throw error;
      }

      const activities = data ?? [];

      const totalTasks = activities.length;
      const completed = activities.filter(a => a.status !== 'running');
      const successes = completed.filter(a => a.status === 'success');
      const successRate = completed.length > 0 ? successes.length / completed.length : 0;
      const durations = completed.filter(a => a.duration_ms != null).map(a => a.duration_ms!);
      const avgDuration = durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

      const taskCounts: Record<string, number> = {};
      for (const a of activities) {
        taskCounts[a.task_type] = (taskCounts[a.task_type] ?? 0) + 1;
      }
      const taskDistribution = Object.entries(taskCounts).map(([taskType, count]) => ({
        taskType,
        count,
      }));

      const recentActivity = activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      return { totalTasks, successRate, avgDuration, taskDistribution, recentActivity };
    } catch (err) {
      console.error('[AgentActivity] getStats failed:', err);
      throw err;
    }
  }

  /**
   * Estadísticas para un agente específico.
   */
  async getStatsByAgent(
    agentName: string,
    startDate?: string,
    endDate?: string
  ): Promise<AgentStats & { agentName: string }> {
    try {
      let query = supabaseAdmin
        .from('agent_activities')
        .select('agent_name, task_type, status, duration_ms, created_at')
        .eq('agent_name', agentName);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AgentActivity] Error fetching stats by agent:', error);
        throw error;
      }

      const activities = data ?? [];

      const totalTasks = activities.length;
      const completed = activities.filter(a => a.status !== 'running');
      const successes = completed.filter(a => a.status === 'success');
      const successRate = completed.length > 0 ? successes.length / completed.length : 0;
      const durations = completed.filter(a => a.duration_ms != null).map(a => a.duration_ms!);
      const avgDuration = durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

      const taskCounts: Record<string, number> = {};
      for (const a of activities) {
        taskCounts[a.task_type] = (taskCounts[a.task_type] ?? 0) + 1;
      }
      const taskDistribution = Object.entries(taskCounts).map(([taskType, count]) => ({
        taskType,
        count,
      }));

      const recentActivity = activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      return { agentName, totalTasks, successRate, avgDuration, taskDistribution, recentActivity };
    } catch (err) {
      console.error('[AgentActivity] getStatsByAgent failed:', err);
      throw err;
    }
  }

  /**
   * Datos de tendencias para gráficos.
   */
  async getTrendData(
    agentName: string,
    days: number = 7
  ): Promise<{ date: string; count: number; successRate: number }[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabaseAdmin
        .from('agent_activities')
        .select('created_at, status')
        .eq('agent_name', agentName)
        .gte('created_at', startDate.toISOString());

      if (error) {
        console.error('[AgentActivity] Error fetching trend data:', error);
        throw error;
      }

      const activities = data ?? [];

      const byDate: Record<string, { total: number; successes: number }> = {};

      for (const a of activities) {
        const dateKey = a.created_at.split('T')[0];
        if (!byDate[dateKey]) {
          byDate[dateKey] = { total: 0, successes: 0 };
        }
        byDate[dateKey].total++;
        if (a.status === 'success') {
          byDate[dateKey].successes++;
        }
      }

      const result = Object.entries(byDate)
        .map(([date, { total, successes }]) => ({
          date,
          count: total,
          successRate: successes / total,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return result;
    } catch (err) {
      console.error('[AgentActivity] getTrendData failed:', err);
      throw err;
    }
  }

  /**
   * Exporta actividades como CSV.
   */
  async exportCsv(filters: ActivityFilters): Promise<string> {
    try {
      const activities = await this.getActivities({ ...filters, limit: 10000 });

      const headers = ['id', 'agent_name', 'task_type', 'task_description', 'status', 'duration_ms', 'error_message', 'created_at', 'finished_at'];
      const rows = activities.map(a => [
        a.id ?? '',
        a.agent_name,
        a.task_type,
        a.task_description ?? '',
        a.status,
        a.duration_ms?.toString() ?? '',
        a.error_message ?? '',
        a.created_at ?? '',
        a.finished_at ?? '',
      ].map(v => `"${v.replace(/"/g, '""')}"`).join(','));

      return [headers.join(','), ...rows].join('\n');
    } catch (err) {
      console.error('[AgentActivity] exportCsv failed:', err);
      throw err;
    }
  }
}

export const agentActivityService = new AgentActivityService();
