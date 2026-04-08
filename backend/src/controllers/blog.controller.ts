import { Request, Response } from 'express';
import { sanitizeError } from '../utils/sanitizeError';
import { supabaseAdmin } from '../config/supabase';
import { UploadService, type UploadAssetType } from '../services/upload.service';
import { v4 as uuidv4 } from 'uuid';

const uploadService = new UploadService();

function resolveBlogAssetType(raw: unknown): UploadAssetType {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'blog-social') return 'blog-social';
  if (value === 'download-safe') return 'download-safe';
  return 'blog-inline';
}

async function resolveExpectedBlogSecret(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('blog_settings')
    .select('webhook_secret')
    .eq('id', 1)
    .single();

  return data?.webhook_secret || process.env.BLOG_WEBHOOK_SECRET || '';
}

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
      const secret = String(req.headers['x-blog-secret'] || '');
      const expectedSecret = await resolveExpectedBlogSecret();
      
      if (!expectedSecret || secret !== expectedSecret) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Fallo de autenticación en el acceso al blog' });
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

      // 1. Validar duplicidad extra: si ya existe un post con el mismo título
      const { data: existingPost } = await supabaseAdmin
        .from('blogs')
        .select('id')
        .eq('title', title)
        .single();
      
      if (existingPost) {
        return res.status(409).json({ 
          error: 'CONFLICT', 
          message: 'Ya existe un artículo con ese título exacto.' 
        });
      }

      // 2. Validar si el topic_id ya fue procesado
      const topicId = req.body.topic_id || null;
      if (topicId) {
        const { data: existingTopicPost } = await supabaseAdmin
          .from('blogs')
          .select('id')
          .eq('topic_id', topicId)
          .single();
        
        if (existingTopicPost) {
          return res.status(409).json({ 
            error: 'CONFLICT', 
            message: 'Este tema ya ha sido convertido en un artículo.' 
          });
        }
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
          topic_id: topicId,
          published_at: (status === 'published' || !status) ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Si se usó un topic_id, marcarlo como publicado
      if (topicId) {
        await supabaseAdmin
          .from('blog_topics')
          .update({ status: 'published', updated_at: new Date().toISOString() })
          .eq('id', topicId);
      }

      return res.status(201).json({ message: 'Post creado exitosamente', post: data });
    } catch (error: any) {
      console.error('[BlogController] Webhook error:', error);
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error interno del servidor') });
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
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error interno del servidor') });
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
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error interno del servidor') });
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
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error interno del servidor') });
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
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error interno del servidor') });
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
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error interno del servidor') });
    }
  },

  /** Admin: Listar categorías */
  async adminGetCategories(req: Request, res: Response) {
    try {
      const { data, error } = await supabaseAdmin.from('blog_categories').select('*').order('name');
      if (error) throw error;
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error interno del servidor') });
    }
  },

  /**
   * Subida de imágenes para el blog (vía n8n)
   * POST /api/blog/upload
   * Body (multipart): file, filename, topic_id, image_type (hero|body1|body2)
   */
  async uploadBlogImage(req: Request, res: Response) {
    try {
      const secret = String(req.headers['x-blog-secret'] || '');
      const expectedSecret = await resolveExpectedBlogSecret();

      if (!expectedSecret || secret !== expectedSecret) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Fallo de autenticación en la subida de medios' });
      }

      const topicId = req.body.topic_id as string | undefined;
      const imageType = req.body.image_type as string | undefined;

      const isMultipart = req.is('multipart/form-data');

      if (isMultipart) {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
          return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Campo "file" requerido' });
        }
        const filename = (req.body.filename as string) || file.originalname || 'blog-image.webp';
        const assetType = resolveBlogAssetType(req.body.asset_type || req.body.assetType);
        
        const result = await uploadService.uploadImageBuffer({
          buffer: file.buffer,
          filename,
          temporary: false,
          folder: 'web',
          assetType,
        });

        // Si viene topic_id, actualizar blog_topic_images
        if (topicId && imageType) {
          const url = result.url as string;
          const updateField: Record<string, string> = {
            imagen_hero_url: url,
            updated_at: new Date().toISOString(),
          };
          
          if (imageType === 'hero') updateField.imagen_hero_url = url;
          else if (imageType === 'body1') updateField.imagen_body1_url = url;
          else if (imageType === 'body2') updateField.imagen_body2_url = url;
          updateField.status = 'completed';

          // Upsert: INSERT si no existe, UPDATE si existe
          const { data: existing } = await supabaseAdmin
            .from('blog_topic_images')
            .select('id')
            .eq('topic_id', topicId)
            .maybeSingle();

          if (existing) {
            await supabaseAdmin
              .from('blog_topic_images')
              .update(updateField)
              .eq('topic_id', topicId);
          } else {
            await supabaseAdmin
              .from('blog_topic_images')
              .insert({ topic_id: topicId, ...updateField });
          }
          console.log(`[Blog Upload] Imagen ${imageType} guardada en blog_topic_images para topic ${topicId}: ${url}`);
        }
        
        return res.status(200).json(result);
      }

      const { image_base64, filename, asset_type, assetType } = req.body;
      if (!image_base64 || !filename) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'image_base64 y filename requeridos' });
      }

      const result = await uploadService.uploadImage({
        image_base64,
        filename,
        temporary: false,
        folder: 'web',
        assetType: resolveBlogAssetType(asset_type || assetType),
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[Blog Upload] Error:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al subir imagen') });
    }
  },

  /**
   * Recibe contenido HTML del artículo (sin imágenes) y lo guarda como draft.
   * POST /api/blog/article-content
   * 
   * Flujo:
   * 1. Article Producer genera HTML del artículo
   * 2. Llama este endpoint con title, html_content, topic_id, etc.
   * 3. Backend guarda como draft_article_content
   * 4. Image Generator sube imágenes (que se guardan en blog_topic_images)
   * 5. Image Generator llama /api/blog/assemble-article para publicar
   */
  async articleContent(req: Request, res: Response) {
    try {
      const secret = String(req.headers['x-blog-secret'] || '');
      const expectedSecret = await resolveExpectedBlogSecret();

      if (!expectedSecret || secret !== expectedSecret) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Fallo de autenticación' });
      }

      const { topic_id, title, html_content, excerpt, meta_description, tags, category_slug } = req.body;

      if (!topic_id || !html_content) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'topic_id y html_content son requeridos' });
      }

      // Guardar contenido en blog_draft_articles
      const { data, error } = await supabaseAdmin
        .from('blog_draft_articles')
        .upsert({
          topic_id: topic_id,
          title: title || null,
          html_content: html_content,
          excerpt: excerpt || null,
          meta_description: meta_description || null,
          tags: normalizeTags(tags),
          category_slug: category_slug || 'ia',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`[Blog] Draft guardado para topic ${topic_id}`);

      return res.status(200).json({ 
        success: true, 
        topic_id,
        message: 'Contenido HTML guardado como draft',
        draft_id: data?.id 
      });
    } catch (error: any) {
      console.error('[BlogController] articleContent error:', error);
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error al guardar contenido') });
    }
  },

  /**
   * Ensambla y publica el artículo final con imágenes.
   * POST /api/blog/assemble-article
   * 
   * Flujo:
   * 1. Image Generator terminó de subir todas las imágenes
   * 2. Image Generator llama este endpoint con topic_id
   * 3. Backend obtiene draft + imágenes de blog_topic_images
   * 4. Backend inserta imágenes en el HTML en lugares apropiados
   * 5. Backend crea el artículo final en tabla blogs y lo publica
   */
  async assembleArticle(req: Request, res: Response) {
    try {
      const secret = String(req.headers['x-blog-secret'] || '');
      const expectedSecret = await resolveExpectedBlogSecret();

      if (!expectedSecret || secret !== expectedSecret) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Fallo de autenticación' });
      }

      const { topic_id } = req.body;

      if (!topic_id) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'topic_id es requerido' });
      }

      // 1. Obtener draft article
      const { data: draft, error: draftError } = await supabaseAdmin
        .from('blog_draft_articles')
        .select('*')
        .eq('topic_id', topic_id)
        .single();

      if (draftError || !draft) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Draft no encontrado para este topic_id' });
      }

      // 2. Obtener imágenes de blog_topic_images
      const { data: images, error: imagesError } = await supabaseAdmin
        .from('blog_topic_images')
        .select('imagen_hero_url, imagen_body1_url, imagen_body2_url, status')
        .eq('topic_id', topic_id)
        .single();

      if (imagesError || !images) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Imágenes no encontradas para este topic_id' });
      }

      // 3. Verificar que todas las imágenes estén listas
      if (images.status !== 'completed') {
        return res.status(400).json({ 
          error: 'IMAGES_NOT_READY', 
          message: `Imágenes aún no están listas (status: ${images.status})`,
          status: images.status
        });
      }

      // 4. Ensamblar HTML con imágenes
      let finalHtml = draft.html_content || '';

      // Insertar imagen hero al inicio del artículo (después del primer párrafo o al inicio)
      if (images.imagen_hero_url) {
        const heroImage = `<figure class="blog-hero-image">
          <img src="${images.imagen_hero_url}" alt="${draft.title || 'Imagen del artículo'}" loading="lazy" />
        </figure>`;
        
        // Insertar después del intro/lead si existe, o al inicio
        if (finalHtml.includes('data-blog-intro="lead"')) {
          finalHtml = finalHtml.replace(
            'data-blog-intro="lead"',
            `data-blog-intro="lead"${heroImage}`
          );
        } else {
          finalHtml = heroImage + finalHtml;
        }
      }

      // Insertar imagen body1 en la primera sección h2
      if (images.imagen_body1_url) {
        const body1Image = `<figure class="blog-body-image blog-body-image-1">
          <img src="${images.imagen_body1_url}" alt="${draft.title || 'Imagen'}" loading="lazy" />
        </figure>`;
        
        // Insertar después del primer h2
        const firstH2Match = finalHtml.match(/<h2[^>]*>/);
        if (firstH2Match) {
          const insertPos = firstH2Match.index + firstH2Match[0].length;
          finalHtml = finalHtml.slice(0, insertPos) + body1Image + finalHtml.slice(insertPos);
        }
      }

      // Insertar imagen body2 en la última sección
      if (images.imagen_body2_url) {
        const body2Image = `<figure class="blog-body-image blog-body-image-2">
          <img src="${images.imagen_body2_url}" alt="${draft.title || 'Imagen'}" loading="lazy" />
        </figure>`;
        
        // Insertar antes del último h2 o al final del contenido
        const lastH2Index = finalHtml.lastIndexOf('<h2');
        if (lastH2Index > 0) {
          const beforeLastH2 = finalHtml.slice(0, lastH2Index);
          const fromLastH2 = finalHtml.slice(lastH2Index);
          finalHtml = beforeLastH2 + body2Image + fromLastH2;
        } else {
          finalHtml = finalHtml + body2Image;
        }
      }

      // 5. Obtener categoría
      let categoryId = null;
      const targetSlug = draft.category_slug || 'ia';
      const { data: cat } = await supabaseAdmin
        .from('blog_categories')
        .select('id')
        .eq('slug', targetSlug)
        .single();
      if (cat) categoryId = cat.id;

      // 6. Crear slug único
      const slug = await buildUniqueBlogSlug(draft.title || `article-${topic_id}`);

      // 7. Verificar duplicado por topic_id
      const { data: existingPost } = await supabaseAdmin
        .from('blogs')
        .select('id')
        .eq('topic_id', topic_id)
        .single();

      if (existingPost) {
        return res.status(409).json({ 
          error: 'ALREADY_PUBLISHED', 
          message: 'Este topic_id ya fue publicado' 
        });
      }

      // 8. Insertar artículo final
      const { data: publishedPost, error: publishError } = await supabaseAdmin
        .from('blogs')
        .insert({
          title: draft.title,
          content: finalHtml,
          excerpt: draft.excerpt,
          meta_description: draft.meta_description || draft.excerpt,
          featured_image: images.imagen_hero_url,
          category_id: categoryId,
          tags: draft.tags,
          status: 'published',
          slug,
          topic_id: topic_id,
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (publishError) throw publishError;

      // 9. Marcar topic como published
      await supabaseAdmin
        .from('blog_topics')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', topic_id);

      // 10. Limpiar draft
      await supabaseAdmin
        .from('blog_draft_articles')
        .delete()
        .eq('topic_id', topic_id);

      console.log(`[Blog] Artículo publicado para topic ${topic_id}: ${slug}`);

      return res.status(201).json({ 
        success: true,
        message: 'Artículo ensamblado y publicado exitosamente',
        post: publishedPost,
        images_used: {
          hero: images.imagen_hero_url,
          body1: images.imagen_body1_url,
          body2: images.imagen_body2_url
        }
      });
    } catch (error: any) {
      console.error('[BlogController] assembleArticle error:', error);
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error al ensamblar artículo') });
    }
  }
};
