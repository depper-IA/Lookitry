/**
 * Script para regenerar artículos de blog que tienen imágenes duplicadas
 * Uso: npx ts-node scripts/regenerate-blog-articles.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

interface InterlinkingPost {
  title: string;
  slug: string;
}

interface BlogTopicImages {
  imagen_hero_url: string | null;
  imagen_body1_url: string | null;
  imagen_body2_url: string | null;
  imagen_body3_url: string | null;
  imagen_body4_url: string | null;
  status: string;
}

interface BlogDraftArticle {
  topic_id: string;
  title: string;
  excerpt: string | null;
  meta_description: string | null;
  tags: string[] | null;
  sections: any[];
  faqs: any[];
  cta_context: any;
  image_prompts: any[];
  reading_time_minutes: number | null;
  category_slug: string | null;
  toc_items: any;
}

interface CtaTemplate {
  title: string;
  button_text: string;
  button_url: string;
}

async function getCtaTemplates(): Promise<Record<string, CtaTemplate>> {
  const { data } = await supabaseAdmin
    .from('blog_settings')
    .select('cta_templates')
    .eq('id', 1)
    .maybeSingle();

  if (data?.cta_templates) {
    return data.cta_templates as Record<string, CtaTemplate>;
  }
  return {
    trial: { title: '¿Listo para probar Lookitry?', button_text: 'Comenzar ahora', button_url: '/planes' },
    features: { title: '¿Quieres más conversiones?', button_text: 'Ver planes', button_url: '/planes' },
    pricing: { title: 'Elige tu plan', button_text: 'Ver precios', button_url: '/planes' },
    lead_magnet: { title: 'Descarga la guía', button_text: 'Descargar', button_url: '/planes' },
  };
}

async function buildUniqueBlogSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);

  let slug = baseSlug;
  let counter = 0;
  const { data: existing } = await supabaseAdmin
    .from('blogs')
    .select('id')
    .or(`slug.eq.${slug}${excludeId ? `,id.neq.${excludeId}` : ''}`)
    .maybeSingle();

  while (existing) {
    counter++;
    slug = `${baseSlug}-${counter}`;
    const { data: next } = await supabaseAdmin
      .from('blogs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!next) break;
  }
  return slug;
}

function generateArticleHTML(
  draft: BlogDraftArticle,
  images: BlogTopicImages,
  ctaTemplates: Record<string, CtaTemplate>,
  interlinkPosts: InterlinkingPost[] = []
): string {
  const { title, excerpt, tags, sections, faqs, cta_context, image_prompts, reading_time_minutes } = draft;

  let tocHtml = '';
  if (sections && sections.length > 0) {
    tocHtml = '<nav class="blog-toc" aria-label="Tabla de contenidos"><ul>';
    for (const section of sections) {
      const slugId = section.id.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      tocHtml += `<li><a href="#${slugId}">${section.title}</a></li>`;
    }
    tocHtml += '</ul></nav>';
  }

  let heroImageHtml = '';
  if (images.imagen_hero_url) {
    heroImageHtml = `<div class="blog-hero">
      <img src="${images.imagen_hero_url}" alt="${title || 'Artículo'}" />
    </div>`;
  }

  const availableImages = [
    images.imagen_body1_url,
    images.imagen_body2_url,
    images.imagen_body3_url,
    images.imagen_body4_url
  ].filter(Boolean) as string[];

  let dropCapApplied = false;
  let sectionsHtml = '';

  if (sections && sections.length > 0) {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const slugId = section.id.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      sectionsHtml += `<section id="${slugId}">`;
      sectionsHtml += `<h2>${section.title}</h2>`;

      if (section.paragraphs && section.paragraphs.length > 0) {
        for (let pIdx = 0; pIdx < section.paragraphs.length; pIdx++) {
          let para = section.paragraphs[pIdx];

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

          para = para.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff; font-size: 1.05em;">$1</strong>');

          if (!dropCapApplied && !para.startsWith('<') && para.length > 0) {
            const firstLetter = para.charAt(0);
            if (/[a-zA-ZáéíóúñÑ]/.test(firstLetter)) {
              const rest = para.slice(1);
              para = `<span class="drop-cap" style="float: left; font-size: 4rem; line-height: 0.8; font-weight: 800; color: #FF5C3A; margin-right: 0.8rem; margin-top: 0.5rem; text-shadow: 2px 2px 0px rgba(255,92,58,0.2);">${firstLetter.toUpperCase()}</span>${rest}`;
              dropCapApplied = true;
            }
          }

          if (para.startsWith('<ul') || para.startsWith('<ol') || para.startsWith('<p') || para.startsWith('<div')) {
            sectionsHtml += para;
          } else {
            sectionsHtml += `<p style="text-align: justify; line-height: 1.8; margin-bottom: 1.5rem;">${para}</p>`;
          }
        }
      }

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

      let imgUrl: string | null = null;
      let imgPos: number | null = null;
      if (section.image_position !== undefined) {
        if (typeof section.image_position === 'number') {
          imgPos = section.image_position;
        } else if (typeof section.image_position === 'string') {
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

        if (imgUrl && sectionsHtml.includes(imgUrl)) {
          imgUrl = null;
        } else if (imgUrl) {
          const index = imgUrl ? availableImages.indexOf(imgUrl) : -1;
          if (index > -1) availableImages.splice(index, 1);
        }
      }

      if (!imgUrl) {
        const nextAvailable = availableImages.find(url => !sectionsHtml.includes(url));
        if (nextAvailable) {
          imgUrl = nextAvailable;
          const index = availableImages.indexOf(imgUrl);
          if (index > -1) availableImages.splice(index, 1);
        }
      }

      if (imgUrl) {
        sectionsHtml += `<figure class="blog-body-image" style="margin: 3rem 0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <img src="${imgUrl}" alt="${title || 'Imagen explicativa'}" loading="lazy" style="width: 100%; height: auto; display: block; object-fit: cover; max-height: 500px;" />
        </figure>`;
      }

      sectionsHtml += '</section>';

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

      if (i === 2) {
        sectionsHtml += `
        <div class="blog-cta-mid" style="background: #141414; border: 1px solid rgba(255, 92, 58, 0.25); border-radius: 16px; padding: 2rem 2.5rem; margin: 3rem 0; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; right: 0; width: 120px; height: 120px; background: radial-gradient(circle at top right, rgba(255,92,58,0.15), transparent 70%); pointer-events: none;"></div>
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(255,92,58,0.15); display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5C3A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              </div>
              <span style="color: #FF5C3A; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px;">Herramienta recomendada</span>
            </div>
            <div>
              <h3 style="color: #ffffff; margin: 0 0 0.5rem 0; font-size: 1.4rem; font-weight: 700; line-height: 1.3;">¿Listo para reducir devoluciones en tu ecommerce?</h3>
              <p style="color: #999999; margin: 0; font-size: 0.95rem; line-height: 1.6; max-width: 85%;">Permite que tus clientes se prueben virtualmente las prendas antes de comprar. <strong style="color: #ccc;">Hasta 35% más conversión</strong> y <strong style="color: #ccc;">devoluciones reducidas</strong> en tiendas que ya usan Lookitry.</p>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
              <a href="/planes" style="display: inline-flex; align-items: center; gap: 0.5rem; background: #FF5C3A; color: #fff; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 700; font-size: 0.95rem; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255,92,58,0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255,92,58,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255,92,58,0.3)'">Comenzar ahora <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
              <a href="/planes#basic" style="display: inline-flex; align-items: center; gap: 0.5rem; background: transparent; color: #999; padding: 0.75rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; text-decoration: none; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;" onmouseover="this.style.borderColor='rgba(255,255,255,0.25)'; this.style.color='#fff'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.color='#999'">Ver plan básico</a>
            </div>
          </div>
        </div>`;
      }

      if (i === 5) {
        sectionsHtml += `
        <div style="border-top: 1px dashed #333; border-bottom: 1px dashed #333; padding: 1.5rem 0; margin: 2rem 0;">
          <p style="margin: 0; font-size: 1.1rem; line-height: 1.6; text-align: center;">
            <strong style="color: #FF5C3A;">¡No te quedes atrás en innovación!</strong> El futuro del retail online ya está aquí. Las marcas que implementaron Lookitry han visto cómo aumentan sus tickets promedio creando experiencias inolvidables. <a href="/planes" style="color: #FF5C3A; font-weight: 600; text-decoration: none;">Comenzar ahora →</a>
          </p>
        </div>`;
      }
    }
  }

  // ============================================================
  // FAQ Section - Render after sections, before final CTA
  // ============================================================
  let faqHtml = '';
  if (faqs && faqs.length > 0) {
    faqHtml = '<div class="blog-faqs" data-blog-faq="accordion" style="margin: 3rem 0; border-top: 1px solid #333; padding-top: 2rem;">';
    faqHtml += '<h2 style="color: #fff; font-size: 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">';
    faqHtml += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5C3A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    faqHtml += 'Preguntas Frecuentes</h2>';
    faqHtml += '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';
    for (const faq of faqs) {
      faqHtml += `<details style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; overflow: hidden; transition: all 0.2s;">
        <summary style="padding: 1.25rem 1.5rem; cursor: pointer; font-weight: 600; color: #fff; display: flex; justify-content: space-between; align-items: center; list-style: none;">
          ${faq.question}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5C3A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s; flex-shrink: 0;"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </summary>
        <div style="padding: 0 1.5rem 1.25rem 1.5rem; color: #999; line-height: 1.7; border-top: 1px solid #333; padding-top: 1rem; margin-top: 0.5rem;">
          ${faq.answer}
        </div>
      </details>`;
    }
    faqHtml += '</div></div>';
  }

  // ============================================================
  // Final CTA Block - Contextual based on cta_context
  // ============================================================
  const ctaBlock = `
  <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border: 1px solid rgba(255,92,58,0.3); border-radius: 20px; padding: 3rem; margin: 3rem 0; text-align: center; position: relative; overflow: hidden;">
    <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at center, rgba(255,92,58,0.05), transparent 50%); pointer-events: none;"></div>
    <div style="position: relative; z-index: 1;">
      <h3 style="color: #fff; font-size: 1.8rem; margin-bottom: 1rem; font-weight: 800;">${cta_context?.title || '¿Quieres reducir devoluciones en tu tienda?'}</h3>
      <p style="color: #999; font-size: 1.05rem; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.6;">${cta_context?.subtitle || 'Permite que tus clientes se prueben virtualmente las prendas antes de comprar. Hasta 35% más conversión.'}</p>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; align-items: center;">
        <a href="${cta_context?.primary_cta_url || '/trial-checkout'}" style="display: inline-flex; align-items: center; gap: 0.5rem; background: #FF5C3A; color: #fff; padding: 1rem 2rem; border-radius: 12px; font-weight: 700; font-size: 1rem; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 20px rgba(255,92,58,0.4);">
          ${cta_context?.primary_cta_text || 'Comenzar prueba gratis'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <a href="${cta_context?.secondary_cta_url || '/planes'}" style="display: inline-flex; align-items: center; gap: 0.5rem; background: transparent; color: #999; padding: 1rem 1.5rem; border-radius: 12px; font-weight: 600; font-size: 0.95rem; text-decoration: none; border: 1px solid #333; transition: all 0.2s;">
          ${cta_context?.secondary_cta_text || 'Ver precios'}
        </a>
      </div>
    </div>
  </div>`;

  const articleHtml = `
<article class="blog-article">
  ${heroImageHtml}
  <div class="blog-content">
    ${tocHtml}
    <div class="blog-header">
      <h1>${title}</h1>
      ${excerpt ? `<p style="color: #999; font-size: 1.1rem; line-height: 1.6; margin: 1rem 0 1.5rem 0;">${excerpt}</p>` : ''}
    </div>
    ${sectionsHtml}
    ${faqHtml}
    ${ctaBlock}
  </div>
</article>`;

  console.log(`[Blog] HTML generado para topic ${draft.topic_id}, longitud: ${articleHtml.length}`);
  return articleHtml;
}

async function regenerateArticle(blogId: string, topicId: string): Promise<void> {
  console.log(`\n🔄 Regenerando artículo: ${blogId}`);

  const { data: draft, error: draftError } = await supabaseAdmin
    .from('blog_draft_articles')
    .select('*')
    .eq('topic_id', topicId)
    .maybeSingle();

  if (draftError || !draft) {
    console.log(`  ⚠️ No se encontró draft para topic ${topicId}`);
    return;
  }

  const { data: images, error: imagesError } = await supabaseAdmin
    .from('blog_topic_images')
    .select('imagen_hero_url, imagen_body1_url, imagen_body2_url, imagen_body3_url, imagen_body4_url, status')
    .eq('topic_id', topicId)
    .maybeSingle();

  if (imagesError || !images) {
    console.log(`  ⚠️ No se encontró imágenes para topic ${topicId}`);
    return;
  }

  if (images.status !== 'completed') {
    console.log(`  ⚠️ Imágenes no listas (status: ${images.status})`);
    return;
  }

  const ctaTemplates = await getCtaTemplates();

  const { data: recentPostsData } = await supabaseAdmin
    .from('blogs')
    .select('title, slug')
    .eq('status', 'published')
    .neq('topic_id', topicId)
    .order('created_at', { ascending: false })
    .limit(3);

  const recentPosts = (recentPostsData as InterlinkingPost[]) || [];

  const finalHtml = generateArticleHTML(
    draft as BlogDraftArticle,
    images as BlogTopicImages,
    ctaTemplates,
    recentPosts
  );

  let categoryId = null;
  const targetSlug = (draft as BlogDraftArticle).category_slug || 'ia';
  const { data: cat } = await supabaseAdmin
    .from('blog_categories')
    .select('id')
    .eq('slug', targetSlug)
    .maybeSingle();
  if (cat) categoryId = cat.id;

  const { data: existingBlog } = await supabaseAdmin
    .from('blogs')
    .select('id, slug')
    .eq('topic_id', topicId)
    .maybeSingle();

  const articleSlug = existingBlog?.slug || await buildUniqueBlogSlug((draft as BlogDraftArticle).title || `article-${topicId}`);

  const upsertData = {
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
    published_at: existingBlog ? (existingBlog as any).published_at || new Date().toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: publishedPost, error: publishError } = await supabaseAdmin
    .from('blogs')
    .upsert(upsertData, { onConflict: 'topic_id' })
    .select()
    .maybeSingle();

  if (publishError) {
    console.log(`  ❌ Error: ${publishError.message}`);
    return;
  }

  console.log(`  ✅ Regenerado: https://lookitry.com/blog/${articleSlug}`);
}

async function main() {
  console.log('🚀 Iniciando regeneración de artículos de blog\n');

  const { data: blogs, error } = await supabaseAdmin
    .from('blogs')
    .select('id, topic_id, title')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching blogs:', error);
    return;
  }

  console.log(`📝 Artículos a regenerar: ${blogs?.length || 0}\n`);

  for (const blog of blogs || []) {
    await regenerateArticle(blog.id, blog.topic_id);
  }

  console.log('\n✅ Proceso completado');
}

main().catch(console.error);