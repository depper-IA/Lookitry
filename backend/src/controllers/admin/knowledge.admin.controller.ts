import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { sanitizeError } from '../../utils/sanitizeError';
import { knowledgeEmbeddingService } from '../../services/knowledge-embedding.service';

const TABLE = 'lookitry_knowledge';

export const getKnowledgeItems = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let query = supabaseAdmin
      .from(TABLE)
      .select('*')
      .order('category')
      .order('title');

    if (category && category !== 'all') {
      query = query.eq('category', category as string);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ items: data || [], total: data?.length || 0 });
  } catch (err: any) {
    console.error('[Knowledge] getKnowledgeItems:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener knowledge base') });
  }
};

export const createKnowledgeItem = async (req: Request, res: Response) => {
  try {
    const { id, category, title, content, is_active = true } = req.body;

    if (!id || !category || !title || !content) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'id, category, title y content son requeridos' });
    }

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert({ id, category, title, content, is_active })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'DUPLICATE_ID', message: `Ya existe un item con id "${id}"` });
      }
      throw error;
    }

    // Generar embedding de forma asíncrona — no bloquea la respuesta
    knowledgeEmbeddingService.generateAndSave(id, title, content).catch(() => {});

    return res.status(201).json({ item: data });
  } catch (err: any) {
    console.error('[Knowledge] createKnowledgeItem:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al crear item') });
  }
};

export const updateKnowledgeItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, title, content, is_active } = req.body;

    const updates: any = {};
    if (category !== undefined) updates.category = category;
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'No hay campos para actualizar' });
    }

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'NOT_FOUND', message: 'Item no encontrado' });

    // Regenerar embedding si cambió el título o el contenido
    if (updates.title !== undefined || updates.content !== undefined) {
      const newTitle   = updates.title   ?? data.title;
      const newContent = updates.content ?? data.content;
      knowledgeEmbeddingService.generateAndSave(id, newTitle, newContent).catch(() => {});
    }

    return res.json({ item: data });
  } catch (err: any) {
    console.error('[Knowledge] updateKnowledgeItem:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al actualizar item') });
  }
};

export const deleteKnowledgeItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ message: 'Item eliminado' });
  } catch (err: any) {
    console.error('[Knowledge] deleteKnowledgeItem:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al eliminar item') });
  }
};

/**
 * POST /admin/knowledge/backfill-embeddings
 * Regenera embeddings para todos los items que no tienen embedding todavía.
 * Útil para correr una sola vez después de la migración.
 */
export const backfillEmbeddings = async (req: Request, res: Response) => {
  try {
    // Fire-and-forget — el backfill puede tardar varios segundos
    knowledgeEmbeddingService.backfillMissing().then(result => {
      console.log('[Knowledge] Backfill completado:', result);
    }).catch(err => {
      console.error('[Knowledge] Backfill error:', err.message);
    });

    return res.json({ message: 'Backfill iniciado en background. Revisá los logs del servidor.' });
  } catch (err: any) {
    console.error('[Knowledge] backfillEmbeddings:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al iniciar backfill') });
  }
};
