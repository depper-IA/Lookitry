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
    .maybeSingle();

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

// ============================================================
// Tipos para JSON estructurado desde n8n
// ============================================================

interface Section {
  id: string;
  title: string;
  paragraphs: string[];
  callout: { type: 'stat' | 'tip' | 'warning'; text: string } | null;
  image_position?: number;
}

interface Faq {
  question: string;
  answer: string;
}

interface ImagePrompt {
  position: string;
  prompt: string;
  after_section?: string;
}

interface CtaContext {
  type: 'trial' | 'features' | 'pricing' | 'lead_magnet';
}

interface CtaTemplate {
  title: string;
  button_text: string;
  button_url: string;
}

interface BlogDraftArticle {
  id: string;
  topic_id: string;
  title: string | null;
  html_content: string | null;
  excerpt: string | null;
  meta_description: string | null;
  tags: string[];
  category_slug: string | null;
  toc_items: unknown | null;
  sections: Section[];
  faqs: Faq[];
  cta_context: CtaContext;
  image_prompts: ImagePrompt[];
  reading_time_minutes?: number;
  slug?: string;
  created_at: string;
  updated_at: string;
}

interface BlogTopicImages {
  imagen_hero_url: string | null;
  imagen_body1_url: string | null;
  imagen_body2_url: string | null;
  imagen_body3_url: string | null;
  imagen_body4_url: string | null;
  status: string;
}

// ============================================================
// generateArticleHTML - Genera HTML completo desde JSON estructurado
// ============================================================

function generateArticleHTML(
  draft: BlogDraftArticle,
  images: BlogTopicImages,
  ctaTemplates: Record<string, CtaTemplate>
): string {
  const { title, excerpt, meta_description, tags, sections, faqs, cta_context, image_prompts, reading_time_minutes } = draft;

  //Construir Table of Contents desde sections
  let tocHtml = '';
  if (sections && sections.length > 0) {
    tocHtml = '<nav class="blog-toc" aria-label="Tabla de contenidos"><ul>';
    for (const section of sections) {
      const slugId = section.id.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      tocHtml += `<li><a href="#${slugId}">${section.title}</a></li>`;
    }
    tocHtml += '</ul></nav>';
  }

  //Hero image (del primer image_prompt con position=hero)
  let heroImageHtml = '';
  const heroPrompt = image_prompts?.find((p) => p.position === 'hero');
  if (images.imagen_hero_url) {
    heroImageHtml = `<div class="blog-hero">
      <img src="${images.imagen_hero_url}" alt="${title || 'Artículo'}" />
    </div>`;
  }

  //Generar sections HTML
  let sectionsHtml = '';
  if (sections && sections.length > 0) {
    for (const section of sections) {
      const slugId = section.id.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      sectionsHtml += `<section id="${slugId}">`;
      sectionsHtml += `<h2>${section.title}</h2>`;

      //Párrafos
      if (section.paragraphs && section.paragraphs.length > 0) {
        for (const para of section.paragraphs) {
          sectionsHtml += `<p>${para}</p>`;
        }
      }

      //Callout block
      if (section.callout) {
        const calloutClass =
          section.callout.type === 'stat'
            ? 'blog-callout blog-callout-stat'
            : section.callout.type === 'tip'
            ? 'blog-callout blog-callout-tip'
            : 'blog-callout blog-callout-warning';
        sectionsHtml += `<div class="${calloutClass}" data-blog-callout="${section.callout.type}">${section.callout.text}</div>`;
      }

      //Body image según image_position (1 = después de esta sección)
      if (section.image_position === 1 && images.imagen_body1_url) {
        sectionsHtml += `<figure class="blog-body-image">
          <img src="${images.imagen_body1_url}" alt="${title || 'Imagen'}" loading="lazy" />
        </figure>`;
      } else if (section.image_position === 2 && images.imagen_body2_url) {
        sectionsHtml += `<figure class="blog-body-image">
          <img src="${images.imagen_body2_url}" alt="${title || 'Imagen'}" loading="lazy" />
        </figure>`;
      } else if (section.image_position === 3 && images.imagen_body3_url) {
        sectionsHtml += `<figure class="blog-body-image">
          <img src="${images.imagen_body3_url}" alt="${title || 'Imagen'}" loading="lazy" />
        </figure>`;
      } else if (section.image_position === 4 && images.imagen_body4_url) {
        sectionsHtml += `<figure class="blog-body-image">
          <img src="${images.imagen_body4_url}" alt="${title || 'Imagen'}" loading="lazy" />
        </figure>`;
      }

      sectionsHtml += '</section>';
    }
  }

  //FAQ Accordion
  let faqHtml = '';
  if (faqs && faqs.length > 0) {
    faqHtml = '<div class="blog-faqs" data-blog-faq="accordion">';
    for (const faq of faqs) {
      faqHtml += `<details>
        <summary>${faq.question}</summary>
        <div class="faq-answer">${faq.answer}</div>
      </details>`;
    }
    faqHtml += '</div>';
  }

  //CTA Final dinámico según cta_context.type
  let ctaHtml = '';
  if (cta_context && cta_context.type) {
    const ctaTemplate = ctaTemplates[cta_context.type] || ctaTemplates.trial;
    ctaHtml = `<div class="blog-cta" data-blog-cta="${cta_context.type}">
      <h3>${ctaTemplate.title}</h3>
      <a href="${ctaTemplate.button_url}" class="blog-cta-button">${ctaTemplate.button_text}</a>
    </div>`;
  }

  //Meta tags
  const tagsHtml = tags && tags.length > 0 ? tags.map((t) => `<span class="blog-tag">${t}</span>`).join('') : '';
  const readingTime = reading_time_minutes ? `<span class="blog-reading-time">${reading_time_minutes} min de lectura</span>` : '';

  //Armar HTML completo
  const articleHtml = `<article class="blog-article">
  <header class="blog-header">
    ${heroImageHtml}
    <h1>${title || ''}</h1>
    ${excerpt ? `<p class="blog-excerpt">${excerpt}</p>` : ''}
    <div class="blog-meta">${tagsHtml}${readingTime}</div>
  </header>

  <div class="blog-layout">
    ${tocHtml}
    <div class="blog-content">
      ${sectionsHtml}
      ${faqHtml}
      ${ctaHtml}
    </div>
  </div>
</article>`;

  console.log(`[Blog] HTML generado para topic ${draft.topic_id}, longitud: ${articleHtml.length}`);
  return articleHtml;
}

// ============================================================
// Helper para obtener CTA templates desde blog_settings
// ============================================================

async function getCtaTemplates(): Promise<Record<string, CtaTemplate>> {
  const { data } = await supabaseAdmin
    .from('blog_settings')
    .select('cta_templates')
    .eq('id', 1)
    .maybeSingle();

  if (data?.cta_templates) {
    return data.cta_templates as Record<string, CtaTemplate>;
  }

  //Defaults
  return {
    trial: { title: '¿Listo para probar Lookitry?', button_text: 'Comenzar trial', button_url: '/trial' },
    features: { title: '¿Quieres más conversiones?', button_text: 'Ver demo', button_url: '/demo' },
    pricing: { title: 'Elige tu plan', button_text: 'Ver precios', button_url: '/planes' },
    lead_magnet: { title: 'Descarga la guía', button_text: 'Descargar', button_url: '/guia-descarga' },
  };
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
        .maybeSingle();

      if (cat) {
        categoryId = cat.id;
      } else if (targetSlug && targetSlug !== 'ia') {
        const generatedName = targetSlug.charAt(0).toUpperCase() + targetSlug.slice(1).replace(/-/g, ' ');
        const { data: newCat } = await supabaseAdmin.from('blog_categories').insert({
          name: generatedName,
          slug: targetSlug
        }).select('id').maybeSingle();

        if (newCat) {
          categoryId = newCat.id;
        }
      }

      if (!categoryId) {
        // Fallback al primero disponible
        const { data: firstCat } = await supabaseAdmin.from('blog_categories').select('id').limit(1).maybeSingle();
        if (firstCat) categoryId = firstCat.id;
      }

      // 1. Validar duplicidad extra: si ya existe un post con el mismo título
      const { data: existingPost } = await supabaseAdmin
        .from('blogs')
        .select('id')
        .eq('title', title)
        .maybeSingle();

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
          .maybeSingle();

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
        .maybeSingle();

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
        .maybeSingle();

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
        const { data: current } = await supabaseAdmin.from('blogs').select('published_at').eq('id', id).maybeSingle();
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
        .maybeSingle();

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
        .maybeSingle();

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
            updated_at: new Date().toISOString(),
          };

          if (imageType === 'hero') updateField.imagen_hero_url = url;
          else if (imageType === 'body1') updateField.imagen_body1_url = url;
          else if (imageType === 'body2') updateField.imagen_body2_url = url;
          else if (imageType === 'body3') updateField.imagen_body3_url = url;
          else if (imageType === 'body4') updateField.imagen_body4_url = url;
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
   * Recibe contenido estructurado desde n8n y lo guarda como draft.
   * POST /api/blog/article-content
   *
   * Flujo:
   * 1. Article Producer genera JSON estructurado (sections, faqs, etc.)
   * 2. Llama este endpoint con title, topic_id, sections, faqs, etc.
   * 3. Backend guarda todos los campos estructurados
   * 4. Image Generator sube imágenes
   * 5. Image Generator llama /api/blog/assemble-article para publicar
   */
  async articleContent(req: Request, res: Response) {
    try {
      const secret = String(req.headers['x-blog-secret'] || '');
      const expectedSecret = await resolveExpectedBlogSecret();

      if (!expectedSecret || secret !== expectedSecret) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Fallo de autenticación' });
      }

      //JSON estructurado desde n8n
      const {
        topic_id,
        title,
        slug,
        meta_description,
        excerpt,
        tags,
        category_slug,
        reading_time_minutes,
        sections,
        faqs,
        cta_context,
        image_prompts,
        //Legacy: html_content sigue siendo soportado por compatibilidad
        html_content,
      } = req.body;

      if (!topic_id) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'topic_id es requerido' });
      }

      if (!title) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'title es requerido' });
      }

      console.log(`[Blog] articleContent recibido para topic ${topic_id}: title="${title}", sections=${sections?.length || 0}, faqs=${faqs?.length || 0}`);

      //Asegurar que html_content NUNCA sea nulo o undefined
      const finalHtmlContent = html_content ? String(html_content) : '<p>Contenido generado por IA</p>';

      //Guardar contenido estructurado en blog_draft_articles
      const { data, error } = await supabaseAdmin
        .from('blog_draft_articles')
        .upsert({
          topic_id: topic_id,
          title: title,
          slug: slug || null,
          html_content: finalHtmlContent,
          excerpt: excerpt || null,
          meta_description: meta_description || null,
          tags: normalizeTags(tags),
          category_slug: category_slug || 'ia',
          reading_time_minutes: reading_time_minutes || null,
          toc_items: sections ? sections.map((s: Section) => ({ id: s.id, title: s.title })) : null,
          sections: sections || [],
          faqs: faqs || [],
          cta_context: cta_context || { type: 'trial' },
          image_prompts: image_prompts || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'topic_id' })
        .select()
        .maybeSingle();

      if (error) throw error;

      console.log(`[Blog] Draft guardado para topic ${topic_id}, draft_id=${data?.id}`);

      return res.status(200).json({
        success: true,
        topic_id,
        message: 'Contenido estructurado guardado como draft',
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
   * 4. Backend genera HTML desde JSON estructurado usando generateArticleHTML()
   * 5. Backend inserta el artículo final en tabla blogs y lo publica
   */
  async assembleArticle(req: Request, res: Response) {
    try {
      const secret = String(req.headers['x-blog-secret'] || '');
      const expectedSecret = await resolveExpectedBlogSecret();

      if (!expectedSecret || secret !== expectedSecret) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Fallo de autenticación' });
      }

      let { topic_id } = req.body;

      if (!topic_id) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'topic_id es requerido' });
      }

      // Limpiar topic_id por si llega con espacios o caracteres raros
      topic_id = String(topic_id).trim();
      console.log(`[Blog] Intentando ensamblar artículo para topic_id: "${topic_id}"`);


      //0. Verificar idempotencia: Si ya está publicado, devolver 200 y no procesar de nuevo
      const { data: alreadyPublished } = await supabaseAdmin
        .from('blogs')
        .select('*')
        .eq('topic_id', topic_id)
        .maybeSingle();

      if (alreadyPublished) {
         console.log(`[Blog] Reintento de ensamblaje ignorado. El topic_id ${topic_id} ya estaba publicado.`);
         return res.status(200).json({
           success: true,
           message: 'El artículo ya se encontraba ensamblado y publicado previamente',
           post: alreadyPublished,
           slug: alreadyPublished.slug,
           url: `https://lookitry.com/blog/${alreadyPublished.slug}`
         });
      }

      //1. Obtener draft article (con campos estructurados)
      const { data: draft, error: draftError } = await supabaseAdmin
        .from('blog_draft_articles')
        .select('*')
        .eq('topic_id', topic_id)
        .maybeSingle();

      if (draftError || !draft) {
        // Antes de dar 404, verificar si el topic existe. Si existe pero no hay draft, es que aún se está generando.
        const { data: topicObj, error: topicFindError } = await supabaseAdmin
          .from('blog_topics')
          .select('id, status')
          .eq('id', topic_id)
          .maybeSingle();

        console.log(`[Blog] Búsqueda de topic fallback para "${topic_id}":`, { found: !!topicObj, status: topicObj?.status, error: topicFindError });

        if (topicObj) {
           return res.status(425).json({ 
             error: 'TOPIC_NOT_READY', 
             message: 'El borrador del artículo aún no ha sido generado por la IA. Reintentar en unos segundos.',
             topic_status: topicObj.status
           });
        }


        return res.status(404).json({ error: 'NOT_FOUND', message: 'Draft no encontrado para este topic_id' });
      }

      //2. Obtener imágenes de blog_topic_images
      const { data: images, error: imagesError } = await supabaseAdmin
        .from('blog_topic_images')
        .select('imagen_hero_url, imagen_body1_url, imagen_body2_url, imagen_body3_url, imagen_body4_url, status')
        .eq('topic_id', topic_id)
        .maybeSingle();

      if (imagesError || !images) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Imágenes no encontradas para este topic_id' });
      }

      //3. Verificar que todas las imágenes estén listas
      if (images.status !== 'completed') {
        return res.status(400).json({
          error: 'IMAGES_NOT_READY',
          message: `Imágenes aún no están listas (status: ${images.status})`,
          status: images.status
        });
      }

      console.log(`[Blog] Ensamblando artículo para topic ${topic_id}`);

      //4. Obtener CTA templates
      const ctaTemplates = await getCtaTemplates();

      //5. Generar HTML completo desde JSON estructurado
      const finalHtml = generateArticleHTML(
        draft as BlogDraftArticle,
        images as BlogTopicImages,
        ctaTemplates
      );

      //6. Obtener categoría
      let categoryId = null;
      const targetSlug = (draft as BlogDraftArticle).category_slug || 'ia';
      const { data: cat } = await supabaseAdmin
        .from('blog_categories')
        .select('id')
        .eq('slug', targetSlug)
        .maybeSingle();
      if (cat) categoryId = cat.id;

      //7. Crear slug único
      const slug = await buildUniqueBlogSlug((draft as BlogDraftArticle).title || `article-${topic_id}`);

      //9. Insertar artículo final (usando UPSERT para máxima resiliencia)
      const insertData = {
        title: (draft as BlogDraftArticle).title,
        content: finalHtml,
        excerpt: (draft as BlogDraftArticle).excerpt,
        meta_description: (draft as BlogDraftArticle).meta_description || (draft as BlogDraftArticle).excerpt,
        featured_image: images.imagen_hero_url,
        category_id: categoryId,
        tags: (draft as BlogDraftArticle).tags,
        toc_items: (draft as BlogDraftArticle).toc_items,
        status: 'published',
        slug,
        topic_id: topic_id,
        published_at: new Date().toISOString(),
      };

      const { data: publishedPost, error: publishError } = await supabaseAdmin
        .from('blogs')
        .upsert(insertData, { onConflict: 'topic_id' })
        .select()
        .maybeSingle();

      if (publishError) {
        // Fallback por si el slug choca pero el topic_id es nuevo (colisión de slug real)
        if (publishError.code === '23505' && publishError.message?.includes('blogs_slug_key')) {
           console.warn(`[Blog] Colisión de slug detectada. Reintentando con slug aleatorio.`);
           insertData.slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
           const { data: retryPost, error: retryError } = await supabaseAdmin
             .from('blogs')
             .upsert(insertData, { onConflict: 'topic_id' })
             .select()
             .maybeSingle();

           if (retryError) throw retryError;
           (publishedPost as any) = retryPost;
        } else {
           throw publishError;
        }
      }

      //10. Marcar topic como published
      await supabaseAdmin
        .from('blog_topics')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', topic_id);

      //11. Limpiar draft
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
          body2: images.imagen_body2_url,
          body3: images.imagen_body3_url,
          body4: images.imagen_body4_url
        }
      });
    } catch (error: any) {
      console.error('[BlogController] assembleArticle error:', error);
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error al ensamblar artículo') });
    }
  }
};