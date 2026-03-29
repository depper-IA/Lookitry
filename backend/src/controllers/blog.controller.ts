import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { UploadService } from '../services/upload.service';
import { v4 as uuidv4 } from 'uuid';

const uploadService = new UploadService();

function toBaseSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function buildUniqueBlogSlug(title: string): Promise<string> {
  const baseSlug = toBaseSlug(title);

  const { data, error } = await supabaseAdmin
    .from('blogs')
    .select('slug')
    .like('slug', `${baseSlug}%`);

  if (error) throw error;

  const existingSlugs = new Set((data || []).map((item) => item.slug).filter(Boolean));
  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

function normalizeCategorySlug(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null;
  const slug = toBaseSlug(value);
  return slug || null;
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((tag) => String(tag || '').trim())
      .filter(Boolean);
  }

  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

export const blogController = {
  /**
   * n8n Webhook: Crea un post de blog directamente.
   * Requiere un secreto en el header x-blog-secret.
   */
  async webhookCreatePost(req: Request, res: Response) {
    try {
      const secret = req.headers['x-blog-secret'];
      const expectedSecret = process.env.BLOG_WEBHOOK_SECRET || 'Travis2305**_blog_live';

      if (secret !== expectedSecret) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Secreto de webhook inválido' });
      }

      const {
        title,
        content,
        excerpt,
        meta_description,
        featured_image,
        category_slug,
        categoria,
        category,
        category_name,
        tags,
        status,
      } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Título y contenido son obligatorios' });
      }

      // Buscar categoría por slug o usar default
      let categoryId = null;
      const targetSlug =
        normalizeCategorySlug(category_slug) ||
        normalizeCategorySlug(categoria) ||
        normalizeCategorySlug(category) ||
        normalizeCategorySlug(category_name) ||
        'ia';
      const normalizedTags = normalizeTags(tags);
      
      const { data: cat } = await supabaseAdmin
        .from('blog_categories')
        .select('id')
        .eq('slug', targetSlug)
        .single();
      
      if (cat) {
        categoryId = cat.id;
      } else if (targetSlug && targetSlug !== 'ia') {
        const generatedName = targetSlug.charAt(0).toUpperCase() + targetSlug.slice(1).replace(/-/g, ' ');
        const { data: newCat } = await supabaseAdmin.from('blog_categories').insert({
          name: generatedName,
          slug: targetSlug
        }).select('id').single();

        if (newCat) {
          categoryId = newCat.id;
        }
      }
      
      if (!categoryId) {
        // Fallback al primero disponible
        const { data: firstCat } = await supabaseAdmin.from('blog_categories').select('id').limit(1).single();
        if (firstCat) categoryId = firstCat.id;
      }

      const slug = await buildUniqueBlogSlug(title);

      const { data, error } = await supabaseAdmin
        .from('blogs')
        .insert({
          title,
          content,
          excerpt,
          meta_description,
          featured_image,
          category_id: categoryId,
          tags: normalizedTags,
          status: status || 'published',
          slug,
          published_at: (status === 'published' || !status) ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ message: 'Post creado exitosamente', post: data });
    } catch (error: any) {
      console.error('[BlogController] Webhook error:', error);
      return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  },

  /** Admin: Listar todos los posts */
  async adminGetPosts(req: Request, res: Response) {
    try {
      const { data, error } = await supabaseAdmin
        .from('blogs')
        .select('*, category:blog_categories(name, slug)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  },

  /** Admin: Obtener un post por ID */
  async adminGetPost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { data, error } = await supabaseAdmin
        .from('blogs')
        .select('*, category:blog_categories(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'NOT_FOUND', message: 'Post no encontrado' });

      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  },

  /** Admin: Actualizar post */
  async adminUpdatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Si cambia el status a published y no tenía fecha, ponerla
      if (updates.status === 'published') {
        const { data: current } = await supabaseAdmin.from('blogs').select('published_at').eq('id', id).single();
        if (!current?.published_at) {
          updates.published_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabaseAdmin
        .from('blogs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ message: 'Post actualizado', post: data });
    } catch (error: any) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  },

  /** Admin: Eliminar post */
  async adminDeletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('blogs').delete().eq('id', id);
      if (error) throw error;
      return res.json({ message: 'Post eliminado correctamente' });
    } catch (error: any) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  },

  /** Admin: Crear post manual */
  async adminCreatePost(req: Request, res: Response) {
    try {
      const { title, content, excerpt, meta_description, featured_image, category_id, tags, status } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Título y contenido son obligatorios' });
      }

      const slug = await buildUniqueBlogSlug(title);

      const { data, error } = await supabaseAdmin
        .from('blogs')
        .insert({
          title,
          content,
          excerpt,
          meta_description,
          featured_image,
          category_id,
          tags: tags || [],
          status: status || 'draft',
          slug,
          published_at: status === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ message: 'Post creado exitosamente', post: data });
    } catch (error: any) {
      console.error('[BlogController] Create error:', error);
      return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  },

  /** Admin: Listar categorías */
  async adminGetCategories(req: Request, res: Response) {
    try {
      const { data, error } = await supabaseAdmin.from('blog_categories').select('*').order('name');
      if (error) throw error;
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  },

  /**
   * Subida de imágenes para el blog (vía n8n)
   * POST /api/blog/upload
   */
  async uploadBlogImage(req: Request, res: Response) {
    try {
      const secret = req.headers['x-blog-secret'];
      const expectedSecret = process.env.BLOG_WEBHOOK_SECRET || 'Travis2305**_blog_live';

      if (secret !== expectedSecret) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Secreto de blog inválido' });
      }

      const isMultipart = req.is('multipart/form-data');

      if (isMultipart) {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
          return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Campo "file" requerido' });
        }
        const filename = (req.body.filename as string) || file.originalname || 'blog-image.webp';
        
        const result = await uploadService.uploadImageBuffer({
          buffer: file.buffer,
          filename,
          temporary: false,
        });
        
        return res.status(200).json(result);
      }

      const { image_base64, filename } = req.body;
      if (!image_base64 || !filename) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'image_base64 y filename requeridos' });
      }

      const result = await uploadService.uploadImage({
        image_base64,
        filename,
        temporary: false,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[Blog Upload] Error:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }
};
