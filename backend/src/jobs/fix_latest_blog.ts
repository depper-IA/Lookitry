import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Fix for relative path in jobs
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function main() {
  const { data: blogs, error } = await supabase
    .from('blogs')
    .select('id, content, title, slug, topic_id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !blogs?.length) {
    console.error('Error fetching blog', error);
    return;
  }

  const blog = blogs[0];
  console.log(`Modernizing blog: ${blog.title}`);

  // Fetch recent blogs for interlinking
  const { data: recentPostsData } = await supabase
    .from('blogs')
    .select('title, slug')
    .eq('status', 'published')
    .neq('id', blog.id)
    .order('created_at', { ascending: false })
    .limit(3);
  
  const recentPosts = (recentPostsData as any[]) || [];

  let html = blog.content;

  // 1. Reset formatting to apply the new high-premium style
  // Remove existing manual injects if any
  html = html.replace(/<div class="blog-interlink-box"[\s\S]*?<\/div>/g, '');
  html = html.replace(/<div class="blog-cta-inline"[\s\S]*?<\/div>/g, '');

  // 2. Wrap orphaned text in justified paragraphs
  // This helps clean up fragmented content
  html = html.replace(/<p>/g, '<p style="text-align: justify; line-height: 1.8; margin-bottom: 1.5rem;">');

  // 3. Apply Drop Cap to the very first section's first paragraph
  const dropCapRegex = /(<section[^>]*>\s*<h2>[^<]+<\/h2>\s*<p style="[^"]+">)([A-ZÁÉÍÓÚÑ])/i;
  html = html.replace(dropCapRegex, (match: string, prefix: string, firstLetter: string) => {
    return `${prefix}<span class="drop-cap" style="float: left; font-size: 4rem; line-height: 0.8; font-weight: 800; color: #FF5C3A; margin-right: 0.8rem; margin-top: 0.5rem; text-shadow: 2px 2px 0px rgba(255,92,58,0.2);">${firstLetter.toUpperCase()}</span>`;
  });

  // 4. Build Interlinking Box
  const interlinkHtml = `
  <div class="blog-interlink-box" style="background: rgba(255, 92, 58, 0.05); border-left: 4px solid #FF5C3A; padding: 1.5rem; margin: 3rem 0; border-radius: 0 8px 8px 0;">
    <h3 style="margin-top: 0; color: #FF5C3A; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
      📚 Lectura Recomendada
    </h3>
    <ul style="margin: 0; padding-left: 1.2rem; list-style-type: disc;">
      ${recentPosts.map(p => `<li style="margin-bottom: 0.8rem;"><a href="/blog/${p.slug}" style="color: #fff; text-decoration: underline; text-decoration-color: rgba(255,255,255,0.3); text-underline-offset: 4px; font-weight: 500; transition: color 0.2s;">${p.title}</a></li>`).join('')}
    </ul>
  </div>`;

  // 5. Build Neon CTAs
  const getCta = (title: string, desc: string, btn: string) => `
  <div class="blog-cta-inline" style="background: linear-gradient(135deg, #141414 0%, #1a1a1a 100%); border: 1px solid #333; padding: 2.5rem 2rem; border-radius: 16px; margin: 3rem 0; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);">
    <div style="background: rgba(255,92,58,0.1); color: #FF5C3A; padding: 0.4rem 1rem; border-radius: 9999px; display: inline-block; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">Destaca tu tienda</div>
    <h3 style="color: #fff; margin-top: 0; margin-bottom: 1rem; font-size: 1.6rem; font-weight: 700;">${title}</h3>
    <p style="color: #bbb; margin-bottom: 2rem; line-height: 1.6; max-width: 90%; margin-left: auto; margin-right: auto; font-size: 1.05rem;">${desc}</p>
    <a href="/register" style="display: inline-block; background: linear-gradient(to right, #FF5C3A, #ff7e63); color: #fff; padding: 1rem 2.5rem; border-radius: 9999px; font-weight: 700; font-size: 1.1rem; text-decoration: none;">Comenzar Ahora</a>
  </div>`;

  const cta1 = getCta("¿Quieres reducir las devoluciones?", "El probador virtual de Lookitry ayuda a tus clientes a elegir la talla correcta.", "Probar Gratis");
  const cta2 = getCta("Lleva la experiencia VIP a tu web", "Personaliza el widget con los colores de tu marca y ofrece una experiencia única.", "Registrar Marca");

  // 6. Inject elements into specific section breaks
  let sectionCount = 0;
  html = html.replace(/<\/section>/g, (match: string) => {
    sectionCount++;
    if (sectionCount === 2 && recentPosts.length) return `</section>${interlinkHtml}`;
    if (sectionCount === 4) return `</section>${cta1}`;
    if (sectionCount === 6) return `</section>${cta2}`;
    return match;
  });

  // 7. Standardize Bold and Lists styles
  html = html.replace(/<strong>(.*?)<\/strong>/g, '<strong style="color: #fff; font-size: 1.05em;">$1</strong>');
  
  // Apply update
  const { error: updateError } = await supabase.from('blogs').update({ content: html }).eq('id', blog.id);

  if (updateError) {
    console.error('Update error', updateError);
  } else {
    console.log(`Successfully modernized "${blog.title}". Hydration-safe logic applied.`);
  }
}

main();
