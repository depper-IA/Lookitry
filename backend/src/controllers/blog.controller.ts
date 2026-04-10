import { Request, Response } from 'express';
import { sanitizeError } from '../utils/sanitizeError';
import { supabaseAdmin } from '../config/supabase';
import { UploadService, type UploadAssetType } from '../services/upload.service';

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
  image_position?: number | string; // number (1-4) or string ("body_1", "body1", "hero")
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

// Add interface for SEO interlinking
interface InterlinkingPost {
  title: string;
  slug: string;
}

function generateArticleHTML(
  draft: BlogDraftArticle,
  images: BlogTopicImages,
  ctaTemplates: Record<string, CtaTemplate>,
  interlinkPosts: InterlinkingPost[] = []
): string {
  const { title, excerpt, tags, sections, faqs, cta_context, image_prompts, reading_time_minutes } = draft;

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
  if (images.imagen_hero_url) {
    heroImageHtml = `<div class="blog-hero">
      <img src="${images.imagen_hero_url}" alt="${title || 'Artículo'}" />
    </div>`;
  }

  // Generar pool de imágenes disponibles
  const availableImages = [
    images.imagen_body1_url,
    images.imagen_body2_url,
    images.imagen_body3_url,
    images.imagen_body4_url
  ].filter(Boolean) as string[];

  // Track state across the entire article generation to prevent duplication
  let dropCapApplied = false;

  //Generar sections HTML
  let sectionsHtml = '';
  if (sections && sections.length > 0) {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const slugId = section.id.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      sectionsHtml += `<section id="${slugId}">`;
      sectionsHtml += `<h2>${section.title}</h2>`;

      //Párrafos enriquecidos
      if (section.paragraphs && section.paragraphs.length > 0) {
        for (let pIdx = 0; pIdx < section.paragraphs.length; pIdx++) {
          let para = section.paragraphs[pIdx];

          // 1. Detect and format lists (both bullet and numbered)
          if (para.includes('\n- ') || para.includes('\n* ') || para.includes('\n1. ') || para.trim().startsWith('- ') || para.trim().startsWith('* ') || para.trim().startsWith('1. ')) {
            const lines = para.split('\n');
            let listHtml = '';
            let currentListType: 'ul' | 'ol' | null = null;
            let inList = false;

            for (const line of lines) {
              const trimmed = line.trim();
              const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
              const isNumber = /^\d+\.\s/.test(trimmed);

              if (isBullet || isNumber) {
                const listType = isBullet ? 'ul' : 'ol';
                if (!inList || currentListType !== listType) {
                  if (inList) listHtml += currentListType === 'ul' ? '</ul>' : '</ol>';
                  listHtml += listType === 'ul' 
                    ? '<ul style="margin: 1.5rem 0; padding-left: 1.5rem; list-style-type: none;">'
                    : '<ol style="margin: 1.5rem 0; padding-left: 1.5rem; list-style: decimal; color: #ccc;">';
                  inList = true;
                  currentListType = listType;
                }
                
                const content = isBullet ? trimmed.substring(2) : trimmed.replace(/^\d+\.\s/, '');
                if (listType === 'ul') {
                  listHtml += `<li style="margin-bottom: 0.8rem; position: relative; padding-left: 1.5rem;">
                    <span style="position: absolute; left: 0; color: #FF5C3A; display: flex; align-items: center;">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 0L6.5 3.5L10 5L6.5 6.5L5 10L3.5 6.5L0 5L3.5 3.5L5 0Z" fill="currentColor"/>
                      </svg>
                    </span>
                    ${content}
                  </li>`;
                } else {
                  listHtml += `<li style="margin-bottom: 0.8rem; padding-left: 0.5rem;">${content}</li>`;
                }
              } else if (trimmed !== '') {
                if (inList) {
                  listHtml += currentListType === 'ul' ? '</ul>' : '</ol>';
                  inList = false;
                  currentListType = null;
                }
                listHtml += `<p style="text-align: justify; line-height: 1.8; margin-bottom: 1.5rem;">${trimmed}</p>`;
              }
            }
            if (inList) listHtml += currentListType === 'ul' ? '</ul>' : '</ol>';
            para = listHtml;
          }

          // 2. Parse bold text
          para = para.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff; font-size: 1.05em;">$1</strong>');

          // 3. Drop Cap ONLY for the first paragraph of the ENTIRE article (never duplicated)
          // Use dropCapApplied flag to ensure it only happens once, even if function is called twice
          if (!dropCapApplied && !para.startsWith('<') && para.length > 0) {
            const firstLetter = para.charAt(0);
            // Only apply drop-cap if the first character is a letter (will be capitalized anyway)
            if (/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(firstLetter)) {
              const rest = para.slice(1);
              para = `<span class="drop-cap" style="float: left; font-size: 4rem; line-height: 0.8; font-weight: 800; color: #FF5C3A; margin-right: 0.8rem; margin-top: 0.5rem; text-shadow: 2px 2px 0px rgba(255,92,58,0.2);">${firstLetter.toUpperCase()}</span>${rest}`;
              dropCapApplied = true;
            }
          }

          // Render paragraph (if not already wrapped in block tags)
          if (para.startsWith('<ul') || para.startsWith('<ol') || para.startsWith('<p') || para.startsWith('<div')) {
             sectionsHtml += para;
          } else {
             sectionsHtml += `<p style="text-align: justify; line-height: 1.8; margin-bottom: 1.5rem;">${para}</p>`;
          }
        }
      }

      //Callout block
      if (section.callout) {
        const calloutStyle = section.callout.type === 'stat' 
            ? 'background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6;' 
            : section.callout.type === 'tip'
            ? 'background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981;'
            : 'background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b;';

        const calloutIcons: Record<string, string> = {
          stat: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
          tip: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>`,
          warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
        };
        const calloutIcon = calloutIcons[section.callout.type] || calloutIcons.tip;

        sectionsHtml += `<div class="blog-callout" style="${calloutStyle} padding: 1.2rem 1.5rem; border-radius: 0 8px 8px 0; margin: 2rem 0; font-style: italic; font-weight: 500; display: flex; gap: 1rem; align-items: flex-start;">
          <span style="font-size: 1.5rem; display: flex; align-items: center;">${calloutIcon}</span>
          <div>${section.callout.text}</div>
        </div>`;
      }

      // Inject Body image robustly
      let imgUrl: string | null = null;
      
      // Normalize image_position: "body_1" -> 1, "body_2" -> 2, "1" -> 1, etc.
      let imgPos: number | null = null;
      if (section.image_position !== undefined) {
        if (typeof section.image_position === 'number') {
          imgPos = section.image_position;
        } else if (typeof section.image_position === 'string') {
          // Handle "body_1", "body_2", "hero", etc.
          const match = section.image_position.match(/^body_?(\d+)$/i);
          if (match) {
            imgPos = parseInt(match[1], 10);
          } else if (/^\d+$/.test(section.image_position)) {
            imgPos = parseInt(section.image_position, 10);
          }
        }
      }

      if (imgPos !== null && imgPos >= 1 && imgPos <= 4) {
        if (imgPos === 1) imgUrl = images.imagen_body1_url;
        else if (imgPos === 2) imgUrl = images.imagen_body2_url;
        else if (imgPos === 3) imgUrl = images.imagen_body3_url;
        else if (imgPos === 4) imgUrl = images.imagen_body4_url;
        
        // Remove from available images so we don't reuse it
        const index = imgUrl ? availableImages.indexOf(imgUrl) : -1;
        if (index > -1) availableImages.splice(index, 1);
      } 
      
      // Fallback: If no valid explicit position or the image mapped wasn't found, 
      // but we still have unused images in the pool, use the next available one.
      if (!imgUrl && availableImages.length > 0) {
        imgUrl = availableImages.shift() || null;
      }

      if (imgUrl) {
        sectionsHtml += `<figure class="blog-body-image" style="margin: 3rem 0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <img src="${imgUrl}" alt="${title || 'Imagen explicativa'}" loading="lazy" style="width: 100%; height: auto; display: block; object-fit: cover; max-height: 500px;" />
        </figure>`;
      }

      sectionsHtml += '</section>';

      // SEO Interlinking block after Section #2
      if (interlinkPosts.length > 0 && i === 1) {
        const bookIconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
        sectionsHtml += `
        <div class="blog-interlink-box" style="background: rgba(255, 92, 58, 0.05); border-left: 4px solid #FF5C3A; padding: 1.5rem; margin: 3rem 0; border-radius: 0 8px 8px 0;">
          <h3 style="margin-top: 0; color: #FF5C3A; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">
            ${bookIconSvg} Lectura Recomendada
          </h3>
          <ul style="margin: 0; padding-left: 1.2rem; list-style-type: disc;">
            ${interlinkPosts.map(p => `<li style="margin-bottom: 0.8rem;"><a href="/blog/${p.slug}" style="color: #fff; text-decoration: underline; text-decoration-color: rgba(255,255,255,0.3); text-underline-offset: 4px; font-weight: 500; transition: color 0.2s;" onmouseover="this.style.color='#FF5C3A'; this.style.textDecorationColor='#FF5C3A'" onmouseout="this.style.color='#fff'; this.style.textDecorationColor='rgba(255,255,255,0.3)'">${p.title}</a></li>`).join('')}
          </ul>
        </div>`;
      }

      // CTA Intermedio #1 - After Section #4
      if (i === 3) {
        sectionsHtml += `
        <div class="blog-cta-inline" style="background: linear-gradient(135deg, #141414 0%, #1a1a1a 100%); border: 1px solid #333; padding: 2.5rem 2rem; border-radius: 16px; margin: 3rem 0; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);">
          <div style="background: rgba(255,92,58,0.1); color: #FF5C3A; padding: 0.4rem 1rem; border-radius: 9999px; display: inline-block; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">Destaca tu tienda</div>
          <h3 style="color: #fff; margin-top: 0; margin-bottom: 1rem; font-size: 1.6rem; font-weight: 700;">¿Cansado de devoluciones por tallas incorrectas?</h3>
          <p style="color: #bbb; margin-bottom: 2rem; line-height: 1.6; max-width: 90%; margin-left: auto; margin-right: auto; font-size: 1.05rem;">Integra el probador virtual con Inteligencia Artificial de Lookitry en tu e-commerce y permite a tus clientes verse con las prendas antes de comprar. ¡Aumenta tu conversión hasta un 35%!</p>
          <a href="/register" style="display: inline-block; background: linear-gradient(to right, #FF5C3A, #ff7e63); color: #fff; padding: 1rem 2.5rem; border-radius: 9999px; font-weight: 700; font-size: 1.1rem; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(255,92,58,0.4);" onmouseover="this.style.transform='translateY(-2px) scale(1.02)'; this.style.boxShadow='0 8px 25px rgba(255,92,58,0.6)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 4px 15px rgba(255,92,58,0.4)'">Implementar Probador Web Gratis</a>
        </div>`;
      }

      // CTA Intermedio #2 - After Section #7
      if (i === 6) {
        sectionsHtml += `
        <div style="border-top: 1px dashed #333; border-bottom: 1px dashed #333; padding: 1.5rem 0; margin: 2rem 0;">
          <p style="margin: 0; font-size: 1.1rem; line-height: 1.6; text-align: center;">
            <strong style="color: #FF5C3A;">¡No te quedes atrás en innovación!</strong> El futuro del retail online ya está aquí. Las marcas que implementaron <a href="/register" style="color: #fff; font-weight: bold; text-decoration: underline; text-decoration-color: #FF5C3A; text-underline-offset: 3px;">Lookitry.com</a> han visto cómo aumentan sus tickets promedio creando experiencias inolvidables. <a href="/planes" style="color: #FF5C3A; font-weight: 600; text-decoration: none;">Crear cuenta de demostración ahora →</a>
          </p>
        </div>`;
      }
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
  const tagsHtml = tags && tags.length > 0 ? (tags as string[]).map((t: string) => `<span class="blog-tag">${t}</span>`).join('') : '';
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

/**
 * Auto-ensambla y publica el artículo cuando todas las imágenes están listas.
 * Se llama automáticamente después de cada upload de imagen.
 */
async function autoAssembleIfReady(topicId: string): Promise<{ success: boolean; message: string; slug?: string }> {
  try {
    console.log(`[Blog AutoAssemble] Verificando si topic ${topicId} está listo para ensamblar...`);

    // 1. Verificar que existe draft
    const { data: draft, error: draftError } = await supabaseAdmin
      .from('blog_draft_articles')
      .select('*')
      .eq('topic_id', topicId)
      .maybeSingle();

    if (draftError || !draft) {
      return { success: false, message: 'No hay draft para ensamblar' };
    }

    // 2. Verificar imágenes
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('blog_topic_images')
      .select('imagen_hero_url, imagen_body1_url, imagen_body2_url, imagen_body3_url, imagen_body4_url, status')
      .eq('topic_id', topicId)
      .maybeSingle();

    if (imagesError || !images) {
      return { success: false, message: 'No hay imágenes para ensamblar' };
    }

    // 3. Verificar que al menos el hero esté presente
    if (!images.imagen_hero_url) {
      return { success: false, message: 'Hero image aún no está lista' };
    }

    // 4. Si ya está publicado, verificar si necesita actualización (si llegaron más imágenes body)
    const { data: existingBlog } = await supabaseAdmin
      .from('blogs')
      .select('slug, content')
      .eq('topic_id', topicId)
      .maybeSingle();

    if (existingBlog) {
      // Verificar si el HTML actual ya tiene imágenes body (si no, re-generar)
      const currentContent = existingBlog.content || '';
      const hasBodyImagesInHtml = (images.imagen_body1_url && currentContent.includes(images.imagen_body1_url)) ||
                                 (images.imagen_body2_url && currentContent.includes(images.imagen_body2_url)) ||
                                 (images.imagen_body3_url && currentContent.includes(images.imagen_body3_url)) ||
                                 (images.imagen_body4_url && currentContent.includes(images.imagen_body4_url));

      if (hasBodyImagesInHtml) {
        return { success: true, message: 'Ya publicado con body images', slug: existingBlog.slug };
      }

      // Re-generar HTML con las nuevas imágenes body
      console.log(`[Blog AutoAssemble] Artículo existe pero faltan body images. Re-generando...`);
    }

    // 5. Obtener CTA templates
    const ctaTemplates = await getCtaTemplates();

    // 6. Generar HTML con las imágenes disponibles (usa pool para body images)
    const finalHtml = generateArticleHTML(
      draft as BlogDraftArticle,
      images as BlogTopicImages,
      ctaTemplates,
      []
    );

    // 7. Obtener categoría
    let categoryId = null;
    const targetSlug = (draft as BlogDraftArticle).category_slug || 'ia';
    const { data: cat } = await supabaseAdmin
      .from('blog_categories')
      .select('id')
      .eq('slug', targetSlug)
      .maybeSingle();
    if (cat) categoryId = cat.id;

    // 8. Crear slug único
    const articleSlug = await buildUniqueBlogSlug((draft as BlogDraftArticle).title || `article-${topicId}`);

    // 9. Insertar artículo
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
      slug: articleSlug,
      topic_id: topicId,
      published_at: new Date().toISOString(),
    };

    const { data: publishedPost, error: publishError } = await supabaseAdmin
      .from('blogs')
      .insert(insertData)
      .select()
      .maybeSingle();

    if (publishError) {
      console.error(`[Blog AutoAssemble] Error publicando:`, publishError);
      return { success: false, message: 'Error al publicar' };
    }

    // 10. Marcar topic como published
    await supabaseAdmin
      .from('blog_topics')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', topicId);

    console.log(`[Blog AutoAssemble] Artículo publicado para topic ${topicId}: ${articleSlug}`);

    return { success: true, message: 'Publicado exitosamente', slug: articleSlug };
  } catch (error: any) {
    console.error(`[Blog AutoAssemble] Error:`, error);
    return { success: false, message: sanitizeError(error, 'Error en auto-assemble') };
  }
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

          const normalizedType = imageType.replace('_', '').toLowerCase();

          if (normalizedType === 'hero') updateField.imagen_hero_url = url;
          else if (normalizedType === 'body1') updateField.imagen_body1_url = url;
          else if (normalizedType === 'body2') updateField.imagen_body2_url = url;
          else if (normalizedType === 'body3') updateField.imagen_body3_url = url;
          else if (normalizedType === 'body4') updateField.imagen_body4_url = url;
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
          console.log(`[Blog Upload] Imagen ${normalizedType} guardada en blog_topic_images para topic ${topicId}: ${url}`);

          // AUTO-ASSEMBLE: Verificar si todas las imágenes están listas y publicar
          const autoResult = await autoAssembleIfReady(topicId);
          if (autoResult.success) {
            console.log(`[Blog Upload] Auto-assemble exitoso: ${autoResult.slug}`);
          }
        }

        return res.status(200).json(result);
      }

      // NO es multipart (base64)
      const { image_base64, filename, asset_type, assetType, topic_id, image_type } = req.body;
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
      
      // Asegurarnos de enlazarla al DB si trae metadata
      if (topic_id && image_type) {
        const url = result.url as string;
        const normalizedType = image_type.replace('_', '').toLowerCase();
        const updateField: Record<string, string> = {
          updated_at: new Date().toISOString(),
          status: 'completed'
        };

        if (normalizedType === 'hero') updateField.imagen_hero_url = url;
        else if (normalizedType === 'body1') updateField.imagen_body1_url = url;
        else if (normalizedType === 'body2') updateField.imagen_body2_url = url;
        else if (normalizedType === 'body3') updateField.imagen_body3_url = url;
        else if (normalizedType === 'body4') updateField.imagen_body4_url = url;

        const { data: existing } = await supabaseAdmin
          .from('blog_topic_images')
          .select('id')
          .eq('topic_id', topic_id)
          .maybeSingle();

        if (existing) {
          await supabaseAdmin.from('blog_topic_images').update(updateField).eq('topic_id', topic_id);
        } else {
          await supabaseAdmin.from('blog_topic_images').insert({ topic_id, ...updateField });
        }
        console.log(`[Blog Upload Base64] Imagen ${normalizedType} guardada para topic ${topic_id}: ${url}`);

        // AUTO-ASSEMBLE: Verificar si todas las imágenes están listas y publicar
        const autoResult = await autoAssembleIfReady(topic_id);
        if (autoResult.success) {
          console.log(`[Blog Upload Base64] Auto-assemble exitoso: ${autoResult.slug}`);
        }
      }

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

      //4.5 Fetch Recent Posts for internal linking (SEO magic)
      // Evita interconectar consigo mismo basándonos en title o topic
      const { data: recentPostsData } = await supabaseAdmin
        .from('blogs')
        .select('title, slug')
        .eq('status', 'published')
        .neq('topic_id', topic_id)
        .order('created_at', { ascending: false })
        .limit(3);

      const recentPosts = (recentPostsData as InterlinkingPost[]) || [];

      //5. Generar HTML completo desde JSON estructurado
      const finalHtml = generateArticleHTML(
        draft as BlogDraftArticle,
        images as BlogTopicImages,
        ctaTemplates,
        recentPosts
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
  },

  /**
   * Regenera el artículo para un topic (usa draft e imágenes existentes)
   * POST /api/blog/regenerate/:topicId
   */
  async regenerateArticle(req: Request, res: Response) {
    try {
      const topicId = req.params.topicId;
      const secret = String(req.headers['x-blog-secret'] || '');
      const expectedSecret = await resolveExpectedBlogSecret();

      if (!expectedSecret || secret !== expectedSecret) {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
      }

      // Llamar autoAssemble directamente
      const result = await autoAssembleIfReady(topicId);

      if (result.success) {
        return res.json({ success: true, message: result.message, slug: result.slug });
      } else {
        return res.status(400).json({ success: false, message: result.message });
      }
    } catch (error: any) {
      console.error('[BlogController] regenerateArticle error:', error);
      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error) });
    }
  }
};