import { Router, Request, Response } from 'express';
import { agentActivityService } from '../services/agent-activity.service';
import { agentSessionService } from '../services/agent-session.service';
import { supabaseAdmin } from '../config/supabase';
import axios from 'axios';
import { rebeccaIdentityService } from '../services/rebecca-identity.service';

const router = Router();

// === RAG: Lookitry Knowledge Search (Rebecca WhatsApp Agent) ===

const GEMINI_API_KEY_AGENT = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '';
const GEMINI_BASE_AGENT    = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * POST /api/agent/knowledge/search
 * Búsqueda semántica en el knowledge base de Rebecca.
 * Llamar desde n8n con la pregunta del usuario para obtener contexto relevante.
 *
 * Body: { query: string, match_count?: number, category?: string, min_similarity?: number }
 * Response: { results: [{id, category, title, content, similarity}], context_block: string }
 */
router.post('/knowledge/search', async (req: Request, res: Response) => {
  try {
    const {
      query,
      match_count    = 5,
      category       = null,
      min_similarity = 0.3,
    } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ error: 'query es requerido' });
      return;
    }

    if (query.length > 500) {
      res.status(400).json({ error: 'query demasiado larga (max 500 caracteres)' });
      return;
    }

    let results: any[] = [];
    let searchType = 'semantic';

    // 1. Intentar búsqueda semántica con embeddings
    if (GEMINI_API_KEY_AGENT) {
      try {
        const embRes = await fetch(
          `${GEMINI_BASE_AGENT}/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY_AGENT}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/text-embedding-004',
              content: { parts: [{ text: query }] },
              taskType: 'RETRIEVAL_QUERY',
            }),
          }
        );

        if (embRes.ok) {
          const embJson = await embRes.json() as { embedding?: { values?: number[] } };
          const embedding = embJson?.embedding?.values;

          if (embedding && embedding.length === 768) {
            const { data, error } = await supabaseAdmin.rpc('search_lookitry_knowledge', {
              p_query_embedding: embedding,
              p_match_count:     Math.min(match_count, 10),
              p_category_filter: category || null,
              p_min_similarity:  min_similarity,
            });

            if (!error && data?.length > 0) {
              results = data;
            }
          }
        }
      } catch (embErr: any) {
        console.warn('[Knowledge Search] Embedding falló, usando keyword fallback:', embErr.message);
      }
    }

    // 2. Fallback a búsqueda por keyword si no hay resultados semánticos
    if (results.length === 0) {
      searchType = 'keyword';
      let kbQuery = supabaseAdmin
        .from('lookitry_knowledge')
        .select('id, category, title, content')
        .eq('is_active', true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(Math.min(match_count, 10));

      if (category) kbQuery = kbQuery.eq('category', category);

      const { data, error } = await kbQuery;
      if (!error && data) {
        results = data.map((r: any) => ({ ...r, similarity: 0 }));
      }
    }

    // 3. Construir bloque de contexto listo para inyectar en el prompt de Rebecca
    const contextBlock = results.length > 0
      ? results
          .map((r: any) => `### ${r.title}\n${r.content}`)
          .join('\n\n')
      : '';

    res.json({
      query,
      search_type: searchType,
      count: results.length,
      results: results.map((r: any) => ({
        id:         r.id,
        category:   r.category,
        title:      r.title,
        content:    r.content,
        similarity: r.similarity ?? 0,
      })),
      // Bloque listo para pegar en el system prompt de Rebecca
      context_block: contextBlock
        ? `## INFORMACIÓN DE LOOKITRY\n\n${contextBlock}`
        : '',
    });

  } catch (err: any) {
    console.error('[AgentRoutes] POST /knowledge/search error:', err);
    res.status(500).json({ error: 'Error en búsqueda de knowledge', details: err.message });
  }
});

/**
 * GET /api/agent/knowledge/all
 * Retorna todo el knowledge base activo como bloque de contexto.
 * Útil para cargar el contexto completo de Rebecca al inicio de una conversación.
 */
router.get('/knowledge/all', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lookitry_knowledge')
      .select('id, category, title, content')
      .eq('is_active', true)
      .order('category')
      .order('title');

    if (error) throw error;

    const items = data || [];

    // Agrupar por categoría para mejor legibilidad en el prompt
    const grouped: Record<string, typeof items> = {};
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }

    const contextBlock = Object.entries(grouped)
      .map(([cat, catItems]) => {
        const catTitle = cat.charAt(0).toUpperCase() + cat.slice(1);
        const content = catItems
          .map((i: any) => `### ${i.title}\n${i.content}`)
          .join('\n\n');
        return `## ${catTitle}\n\n${content}`;
      })
      .join('\n\n---\n\n');

    res.json({
      count: items.length,
      items,
      context_block: contextBlock
        ? `# CONOCIMIENTO DE LOOKITRY\n\n${contextBlock}`
        : '',
    });
  } catch (err: any) {
    console.error('[AgentRoutes] GET /knowledge/all error:', err);
    res.status(500).json({ error: 'Error obteniendo knowledge base' });
  }
});

// === RAG: Project Knowledge Search ===

/**
 * POST /api/agent/rag/search
 * Busca en la base de conocimiento del proyecto usando embeddings.
 * Soporta tanto búsqueda semántica (embedding) como búsqueda por palabras clave.
 */
router.post('/rag/search', async (req: Request, res: Response) => {
  try {
    const { query, match_count = 5, doc_type_filter, use_semantic = true } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'query es requerido y debe ser string' });
      return;
    }

    if (query.length > 1000) {
      res.status(400).json({ error: 'query demasiado larga (max 1000 caracteres)' });
      return;
    }

    // Si usa búsqueda semántica, generar embedding
    let results: any[] = [];

    if (use_semantic) {
      // Generar embedding usando Gemini
      try {
        const embeddingResponse = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
          {
            model: 'models/text-embedding-004',
            content: { parts: [{ text: query }] },
            taskType: 'RETRIEVAL_QUERY',
            outputDimensionality: 768,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );

        const embedding = embeddingResponse.data.embedding?.values;

        if (!embedding || !Array.isArray(embedding) || embedding.length !== 768) {
          throw new Error('Embedding invalido de Gemini');
        }

        // Buscar en Supabase usando la función RPC
        const { data, error } = await supabaseAdmin.rpc('search_project_knowledge', {
          p_query_embedding: embedding,
          p_match_count: Math.min(match_count, 10),
          p_doc_type_filter: doc_type_filter || null,
        });

        if (error) {
          console.error('[RAG Search] Supabase error:', error);
          throw error;
        }

        results = data || [];

      } catch (embedError: any) {
        console.error('[RAG Search] Embedding error, falling back to keyword:', embedError.message);
        
        // Fallback a búsqueda por keyword
        const { data, error } = await supabaseAdmin
          .from('project_knowledge')
          .select('id, file_name, file_path, content, doc_type, version, updated_at')
          .ilike('content', `%${query}%`)
          .limit(match_count);

        if (error) throw error;

        results = (data || []).map((r: any) => ({
          ...r,
          similarity: 0, // Keyword search no tiene score
          match_type: 'keyword',
        }));
      }
    } else {
      // Búsqueda por palabras clave
      const { data, error } = await supabaseAdmin
        .from('project_knowledge')
        .select('id, file_name, file_path, content, doc_type, version, updated_at')
        .ilike('content', `%${query}%`)
        .limit(match_count);

      if (error) throw error;

      results = (data || []).map((r: any) => ({
        ...r,
        similarity: 0,
        match_type: 'keyword',
      }));
    }

    // Formatear respuesta
    const formattedResults = results.map((r: any) => ({
      id: r.id,
      file_name: r.file_name,
      file_path: r.file_path,
      doc_type: r.doc_type,
      version: r.version,
      updated_at: r.updated_at,
      similarity: r.similarity || 0,
      match_type: r.match_type || 'semantic',
      // Extraer snippet relevante
      snippet: extractSnippet(r.content, query),
    }));

    res.json({
      query,
      results: formattedResults,
      count: formattedResults.length,
      search_type: results[0]?.match_type || 'semantic',
    });

  } catch (err: any) {
    console.error('[AgentRoutes] POST /rag/search error:', err);
    res.status(500).json({ error: 'Error en busqueda RAG', details: err.message });
  }
});

/**
 * GET /api/agent/rag/stats
 * Estadísticas de la base de conocimiento.
 */
router.get('/rag/stats', async (_req: Request, res: Response) => {
  try {
    const [totalResult, byTypeResult] = await Promise.all([
      supabaseAdmin.from('project_knowledge').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('project_knowledge').select('doc_type').then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach((r: any) => {
          counts[r.doc_type] = (counts[r.doc_type] || 0) + 1;
        });
        return counts;
      }),
    ]);

    res.json({
      total_documents: totalResult.count || 0,
      by_type: byTypeResult,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[AgentRoutes] GET /rag/stats error:', err);
    res.status(500).json({ error: 'Error consultando stats RAG' });
  }
});

/**
 * POST /api/agent/rag/index
 * Endpoint para indexar manualmente un documento (dispara n8n webhook).
 */
router.post('/rag/index', async (req: Request, res: Response) => {
  try {
    const { file_name, file_path, content, version } = req.body;

    if (!file_name || !content) {
      res.status(400).json({ error: 'file_name y content son requeridos' });
      return;
    }

    // Enviar al webhook de n8n
    const n8nWebhookUrl = process.env.N8N_PROJECT_KNOWLEDGE_URL || 'https://n8n.wilkiedevs.com/webhook/project-knowledge-rag';

    const n8nResponse = await axios.post(
      n8nWebhookUrl,
      {
        file_name,
        file_path: file_path || file_name,
        content,
        version: version || new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    res.json({
      success: true,
      n8n_response: n8nResponse.data,
    });

  } catch (err: any) {
    console.error('[AgentRoutes] POST /rag/index error:', err);
    res.status(500).json({
      error: 'Error indexando documento',
      details: err.response?.data || err.message,
    });
  }
});

/**
 * GET /api/agent/rag/list
 * Lista todos los documentos indexados.
 */
router.get('/rag/list', async (req: Request, res: Response) => {
  try {
    const { doc_type, limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('project_knowledge')
      .select('id, file_name, file_path, doc_type, version, updated_at, content_hash')
      .order('updated_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (doc_type) {
      query = query.eq('doc_type', doc_type);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      documents: data,
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset),
    });

  } catch (err: any) {
    console.error('[AgentRoutes] GET /rag/list error:', err);
    res.status(500).json({ error: 'Error listando documentos' });
  }
});

// Helper: extraer snippet relevante
function extractSnippet(content: string, query: string, maxLength = 500): string {
  if (!content) return '';

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);

  // Buscar posición de la query o palabras relacionadas
  let bestPos = 0;
  let bestScore = 0;

  for (const word of queryWords) {
    const pos = lowerContent.indexOf(word);
    if (pos !== -1 && pos > bestScore) {
      bestPos = pos;
      bestScore = pos;
    }
  }

  // Extraer contexto alrededor del match
  const start = Math.max(0, bestPos - 100);
  const end = Math.min(content.length, bestPos + maxLength - 100);

  let snippet = content.substring(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

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

/**
 * GET /api/agent/identity/system-prompt
 * Retorna el system prompt de Rebecca listo para inyectar en n8n o el widget.
 * Query params:
 *   - channel: 'whatsapp' | 'web' (default: 'web')
 *   - include_knowledge: 'true' | 'false' (default: 'true')
 */
router.get('/identity/system-prompt', async (req: Request, res: Response) => {
  try {
    const channel = (req.query.channel === 'whatsapp' ? 'whatsapp' : 'web') as 'whatsapp' | 'web';
    const includeKnowledge = req.query.include_knowledge !== 'false';

    let knowledgeContext = '';

    if (includeKnowledge) {
      const { data, error } = await supabaseAdmin
        .from('lookitry_knowledge')
        .select('category, title, content')
        .eq('is_active', true)
        .order('category')
        .order('title');

      if (!error && data?.length) {
        knowledgeContext = data
          .map((item: any) => `### ${item.title}\n${item.content}`)
          .join('\n\n');
      }
    }

    const systemPrompt = rebeccaIdentityService.getSystemPrompt(channel, knowledgeContext);

    res.json({
      channel,
      system_prompt: systemPrompt,
      knowledge_items: includeKnowledge ? (knowledgeContext ? knowledgeContext.split('###').length - 1 : 0) : null,
    });
  } catch (err: any) {
    console.error('[AgentRoutes] GET /identity/system-prompt error:', err);
    res.status(500).json({ error: 'Error generando system prompt' });
  }
});

export default router;
