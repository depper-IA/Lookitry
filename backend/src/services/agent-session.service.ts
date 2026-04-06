import { supabaseAdmin } from '../config/supabase';

export interface AgentSession {
  id: string;
  agent_name: string;
  current_task_id: string | null;
  current_task_description: string | null;
  status: 'idle' | 'working' | 'error';
  last_heartbeat_at: string;
  created_at: string;
  metadata: Record<string, any>;
}

const DEFAULT_TTL_MINUTES = 2;

class AgentSessionService {
  /**
   * Registrar inicio de sesión (o actualizar existente con upsert).
   */
  async registerAgent(
    agentName: string,
    taskId?: string,
    taskDescription?: string
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('agent_sessions')
        .upsert(
          {
            agent_name: agentName,
            current_task_id: taskId ?? null,
            current_task_description: taskDescription ?? null,
            status: taskId ? 'working' : 'idle',
            last_heartbeat_at: new Date().toISOString(),
          },
          { onConflict: 'agent_name' }
        );

      if (error) {
        console.error('[AgentSession] Error registering agent:', error);
        throw error;
      }
    } catch (err) {
      console.error('[AgentSession] registerAgent failed:', err);
      throw err;
    }
  }

  /**
   * Enviar heartbeat (actualiza last_heartbeat_at y estado).
   */
  async sendHeartbeat(
    agentName: string,
    status?: 'idle' | 'working' | 'error',
    taskId?: string,
    taskDescription?: string
  ): Promise<void> {
    try {
      const updates: Record<string, any> = {
        last_heartbeat_at: new Date().toISOString(),
      };

      if (status) {
        updates.status = status;
      }
      if (taskId !== undefined) {
        updates.current_task_id = taskId ?? null;
      }
      if (taskDescription !== undefined) {
        updates.current_task_description = taskDescription ?? null;
      }

      const { error } = await supabaseAdmin
        .from('agent_sessions')
        .update(updates)
        .eq('agent_name', agentName);

      if (error) {
        console.error('[AgentSession] Error sending heartbeat:', error);
        throw error;
      }
    } catch (err) {
      console.error('[AgentSession] sendHeartbeat failed:', err);
      throw err;
    }
  }

  /**
   * Obtener todos los agentes activos (heartbeat < TTL minutos).
   */
  async getActiveAgents(ttlMinutes: number = DEFAULT_TTL_MINUTES): Promise<AgentSession[]> {
    try {
      const cutoff = new Date();
      cutoff.setMinutes(cutoff.getMinutes() - ttlMinutes);

      const { data, error } = await supabaseAdmin
        .from('agent_sessions')
        .select('*')
        .gt('last_heartbeat_at', cutoff.toISOString())
        .order('last_heartbeat_at', { ascending: false });

      if (error) {
        console.error('[AgentSession] Error fetching active agents:', error);
        throw error;
      }

      return data ?? [];
    } catch (err) {
      console.error('[AgentSession] getActiveAgents failed:', err);
      throw err;
    }
  }

  /**
   * Obtener agente específico por nombre.
   */
  async getAgentSession(agentName: string): Promise<AgentSession | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('agent_sessions')
        .select('*')
        .eq('agent_name', agentName)
        .maybeSingle();

      if (error) {
        console.error('[AgentSession] Error fetching agent session:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('[AgentSession] getAgentSession failed:', err);
      throw err;
    }
  }

  /**
   * Limpiar sesiones huérfanas (sin heartbeat > TTL).
   * Retorna el número de sesiones eliminadas.
   */
  async cleanupStaleSessions(ttlMinutes: number = DEFAULT_TTL_MINUTES): Promise<number> {
    try {
      const cutoff = new Date();
      cutoff.setMinutes(cutoff.getMinutes() - ttlMinutes);

      const { error, count } = await supabaseAdmin
        .from('agent_sessions')
        .delete()
        .lt('last_heartbeat_at', cutoff.toISOString());

      if (error) {
        console.error('[AgentSession] Error cleaning stale sessions:', error);
        throw error;
      }

      return count ?? 0;
    } catch (err) {
      console.error('[AgentSession] cleanupStaleSessions failed:', err);
      throw err;
    }
  }
}

export const agentSessionService = new AgentSessionService();
