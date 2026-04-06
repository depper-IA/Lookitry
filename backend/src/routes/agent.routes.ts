import { Router, Request, Response } from 'express';
import { agentActivityService } from '../services/agent-activity.service';
import { agentSessionService } from '../services/agent-session.service';

const router = Router();

/**
 * POST /api/agent/activity
 * Registra inicio de actividad de agente.
 */
router.post('/activity', async (req: Request, res: Response) => {
  try {
    const { agent_name, task_type, task_description, status, metadata } = req.body;

    if (!agent_name || !task_type || !status) {
      res.status(400).json({ error: 'agent_name, task_type y status son requeridos' });
      return;
    }

    const validStatuses = ['running', 'success', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `status debe ser uno de: ${validStatuses.join(', ')}` });
      return;
    }

    const result = await agentActivityService.logActivity({
      agent_name,
      task_type,
      task_description,
      status,
      metadata,
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('[AgentRoutes] POST /activity error:', err);
    res.status(500).json({ error: 'Error registrando actividad' });
  }
});

/**
 * PUT /api/agent/activity/:id
 * Actualiza actividad (fin de tarea).
 */
router.put('/activity/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, duration_ms, error_message } = req.body;

    if (!status || duration_ms === undefined) {
      res.status(400).json({ error: 'status y duration_ms son requeridos' });
      return;
    }

    const validStatuses = ['success', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `status debe ser uno de: ${validStatuses.join(', ')}` });
      return;
    }

    await agentActivityService.logActivityEnd(id, status, duration_ms, error_message);
    res.json({ success: true });
  } catch (err) {
    console.error('[AgentRoutes] PUT /activity/:id error:', err);
    res.status(500).json({ error: 'Error actualizando actividad' });
  }
});

/**
 * GET /api/agent/activities
 * Consulta actividades con filtros.
 */
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const { agentName, taskType, status, startDate, endDate, limit, offset } = req.query;

    const filters: any = {};
    if (agentName) filters.agentName = agentName as string;
    if (taskType) filters.taskType = taskType as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = startDate as string;
    if (endDate) filters.endDate = endDate as string;
    if (limit) filters.limit = parseInt(limit as string, 10);
    if (offset) filters.offset = parseInt(offset as string, 10);

    const activities = await agentActivityService.getActivities(filters);
    res.json(activities);
  } catch (err) {
    console.error('[AgentRoutes] GET /activities error:', err);
    res.status(500).json({ error: 'Error consultando actividades' });
  }
});

/**
 * GET /api/agent/stats
 * Estadísticas agregadas de todos los agentes.
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await agentActivityService.getStats(
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json(stats);
  } catch (err) {
    console.error('[AgentRoutes] GET /stats error:', err);
    res.status(500).json({ error: 'Error consultando estadísticas' });
  }
});

/**
 * GET /api/agent/stats/:agentName
 * Estadísticas para un agente específico.
 */
router.get('/stats/:agentName', async (req: Request, res: Response) => {
  try {
    const { agentName } = req.params;
    const { startDate, endDate } = req.query;

    const stats = await agentActivityService.getStatsByAgent(
      agentName,
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json(stats);
  } catch (err) {
    console.error('[AgentRoutes] GET /stats/:agentName error:', err);
    res.status(500).json({ error: 'Error consultando estadísticas del agente' });
  }
});

/**
 * GET /api/agent/trends/:agentName
 * Datos de tendencias para gráficos.
 */
router.get('/trends/:agentName', async (req: Request, res: Response) => {
  try {
    const { agentName } = req.params;
    const { days } = req.query;

    const trends = await agentActivityService.getTrendData(
      agentName,
      days ? parseInt(days as string, 10) : 7
    );
    res.json(trends);
  } catch (err) {
    console.error('[AgentRoutes] GET /trends/:agentName error:', err);
    res.status(500).json({ error: 'Error consultando tendencias' });
  }
});

/**
 * GET /api/agent/distribution
 * Distribución de tareas por tipo con porcentajes.
 */
router.get('/distribution', async (req: Request, res: Response) => {
  try {
    const stats = await agentActivityService.getStats();
    const total = stats.taskDistribution.reduce((sum, t) => sum + t.count, 0);
    const distribution = stats.taskDistribution.map(t => ({
      taskType: t.taskType,
      count: t.count,
      percentage: total > 0 ? (t.count / total) * 100 : 0,
    }));
    res.json({ distribution });
  } catch (err) {
    console.error('[AgentRoutes] GET /distribution error:', err);
    res.status(500).json({ error: 'Error consultando distribución' });
  }
});

/**
 * GET /api/agent/export
 * Exporta actividades como CSV.
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { agentName, taskType, status, startDate, endDate } = req.query;

    const filters: any = {};
    if (agentName) filters.agentName = agentName as string;
    if (taskType) filters.taskType = taskType as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = startDate as string;
    if (endDate) filters.endDate = endDate as string;

    const csv = await agentActivityService.exportCsv(filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=agent_activities.csv');
    res.send(csv);
  } catch (err) {
    console.error('[AgentRoutes] GET /export error:', err);
    res.status(500).json({ error: 'Error exportando CSV' });
  }
});

/**
 * POST /api/agent/heartbeat
 * Enviar heartbeat de agente (registra o actualiza sesión).
 */
router.post('/heartbeat', async (req: Request, res: Response) => {
  try {
    const { agentName, status, taskId, taskDescription } = req.body;

    if (!agentName) {
      res.status(400).json({ error: 'agentName es requerido' });
      return;
    }

    const validStatuses = ['idle', 'working', 'error'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: `status debe ser uno de: ${validStatuses.join(', ')}` });
      return;
    }

    await agentSessionService.sendHeartbeat(agentName, status, taskId, taskDescription);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[AgentRoutes] POST /heartbeat error:', err);
    res.status(500).json({ error: 'Error enviando heartbeat' });
  }
});

/**
 * GET /api/agent/alive
 * Ver todos los agentes activos (heartbeat < 2 min).
 */
router.get('/alive', async (req: Request, res: Response) => {
  try {
    const agents = await agentSessionService.getActiveAgents();
    res.json({
      agents,
      timestamp: new Date().toISOString(),
      count: agents.length,
    });
  } catch (err) {
    console.error('[AgentRoutes] GET /alive error:', err);
    res.status(500).json({ error: 'Error consultando agentes activos' });
  }
});

/**
 * GET /api/agent/session/:agentName
 * Ver sesión específica de un agente.
 */
router.get('/session/:agentName', async (req: Request, res: Response) => {
  try {
    const { agentName } = req.params;
    const session = await agentSessionService.getAgentSession(agentName);

    if (!session) {
      res.status(404).json({ error: 'Sesión no encontrada para este agente' });
      return;
    }

    res.json(session);
  } catch (err) {
    console.error('[AgentRoutes] GET /session/:agentName error:', err);
    res.status(500).json({ error: 'Error consultando sesión del agente' });
  }
});

export default router;
