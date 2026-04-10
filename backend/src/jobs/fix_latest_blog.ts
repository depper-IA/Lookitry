import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function main() {
  const { data: blogs, error } = await supabase
    .from('blogs')
    .select('id, content, title')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !blogs?.length) {
    console.error('Error fetching blog', error);
    return;
  }

  const blog = blogs[0];
  let html = blog.content;

  console.log(`Fixing blog: ${blog.title}`);

  // Fetch recent blogs for interlinking
  const { data: recentPosts } = await supabase
    .from('blogs')
    .select('title, slug')
    .neq('id', blog.id)
    .order('created_at', { ascending: false })
    .limit(3);

  // 1. Add Drop Cap to first paragraph
  // Encontrar el primer <p> del primer <section>
  html = html.replace(/<section[^>]*>\s*<h2>[^<]+<\/h2>\s*<p>/, (match: string) => {
    return match.replace(/<p>/, '<p style="text-align: justify; line-height: 1.8; margin-bottom: 1.5rem;">');
  });
  html = html.replace(
    /(<p style="text-align: justify; line-height: 1.8; margin-bottom: 1.5rem;">)([A-ZÁÉÍÓÚÑ])/,
    '$1<span class="drop-cap" style="float: left; font-size: 4rem; line-height: 0.8; font-weight: 800; color: #FF5C3A; margin-right: 0.8rem; margin-top: 0.5rem; text-shadow: 2px 2px 0px rgba(255,92,58,0.2);">$2</span>'
  );

  // 2. Justify all remaining <p> not inside lists and not already justified
  html = html.replace(/<p>(?!<)/g, '<p style="text-align: justify; line-height: 1.8; margin-bottom: 1.5rem;">');

  // 3. Inject internal links
  const interlinkHtml = `
  <div class="blog-interlink-box" style="background: rgba(255, 92, 58, 0.05); border-left: 4px solid #FF5C3A; padding: 1.5rem; margin: 3rem 0; border-radius: 0 8px 8px 0;">
    <h3 style="margin-top: 0; color: #FF5C3A; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">
      📚 Lectura Recomendada
    </h3>
    <ul style="margin: 0; padding-left: 1.2rem; list-style-type: disc;">
      ${recentPosts?.map(p => `<li style="margin-bottom: 0.8rem;"><a href="/blog/${p.slug}" style="color: #fff; text-decoration: underline; text-decoration-color: rgba(255,255,255,0.3); text-underline-offset: 4px; font-weight: 500; transition: color 0.2s;">${p.title}</a></li>`).join('')}
    </ul>
  </div>`;

  // Insert after the second section closes (roughly occurrence 2 of </section>)
  let sectionCount = 0;
  html = html.replace(/<\/section>/g, (match: string) => {
    sectionCount++;
    if (sectionCount === 2 && recentPosts?.length) {
      return `</section>${interlinkHtml}`;
    }
    return match;
  });

  // 4. Inject neon CTA
  const neonCta = `
  <div class="blog-cta-inline" style="background: linear-gradient(135deg, #141414 0%, #1a1a1a 100%); border: 1px solid #333; padding: 2.5rem 2rem; border-radius: 16px; margin: 3rem 0; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);">
    <div style="background: rgba(255,92,58,0.1); color: #FF5C3A; padding: 0.4rem 1rem; border-radius: 9999px; display: inline-block; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">Destaca tu tienda</div>
    <h3 style="color: #fff; margin-top: 0; margin-bottom: 1rem; font-size: 1.6rem; font-weight: 700;">¿Cansado de devoluciones por tallas incorrectas?</h3>
    <p style="color: #bbb; margin-bottom: 2rem; line-height: 1.6; max-width: 90%; margin-left: auto; margin-right: auto; font-size: 1.05rem;">Integra el probador virtual con Inteligencia Artificial de Lookitry en tu e-commerce y permite a tus clientes verse con las prendas antes de comprar. ¡Aumenta tu conversión hasta un 35%!</p>
    <a href="/register" style="display: inline-block; background: linear-gradient(to right, #FF5C3A, #ff7e63); color: #fff; padding: 1rem 2.5rem; border-radius: 9999px; font-weight: 700; font-size: 1.1rem; text-decoration: none;">Implementar Probador Web Gratis</a>
  </div>`;
  
  sectionCount = 0;
  html = html.replace(/<\/section>/g, (match: string) => {
    sectionCount++;
    if (sectionCount === 4) {
      return `</section>${neonCta}`;
    }
    return match;
  });

  // 5. Build simple list parser
  // Look for paragraphs that have bullets
  html = html.replace(/<p[^>]*>(-|\*) (.*?)<\/p>/g, '<li style="margin-bottom: 0.8rem; position: relative; padding-left: 1.5rem;"><span style="position: absolute; left: 0; color: #FF5C3A;">✦</span>$2</li>');
  
  // Update DB
  const { error: updateError } = await supabase.from('blogs').update({ content: html }).eq('id', blog.id);

  if (updateError) {
    console.error('Update error', updateError);
  } else {
    console.log('Successfully modernized the last published article!');
  }
}

main();
