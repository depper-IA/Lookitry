/**
 * Script de cleanup para artículos de blog con HTML duplicado.
 * 
 * PROBLEMA: Algunos artículos tienen:
 * - Drop-caps duplicados en múltiples secciones
 * - CTAs fragmentados/huerfanos después de blog-cta-inline
 * 
 * SOLUCIÑN: Limpiar el HTML eliminando elementos duplicados yä¿®å¾© fragmentos.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function cleanupBlog(blogId: string, slug: string): Promise<void> {
  console.log(`\nð Limpiando: ${slug} (${blogId})`);
  
  // 1. Fetch el artículo
  const { data: blog, error: fetchError } = await supabase
    .from('blogs')
    .select('id, title, content, slug')
    .eq('id', blogId)
    .single();
    
  if (fetchError || !blog) {
    console.error(`  â Error fetching: ${fetchError?.message}`);
    return;
  }
  
  let html = blog.content as string;
  const originalLen = html.length;
  
  // 2. Limpiar drop-caps duplicados: solo mantener el primero
  // Encontrar todas las posiciones de drop-cap
  const dropCapPositions: number[] = [];
  let searchPos = 0;
  const dropCapMarker = '<span class="drop-cap"';
  while (true) {
    const pos = html.indexOf(dropCapMarker, searchPos);
    if (pos === -1) break;
    dropCapPositions.push(pos);
    searchPos = pos + 1;
  }
  console.log(`  - Drop-caps encontrados: ${dropCapPositions.length}`);
  
  if (dropCapPositions.length > 1) {
    // Remover todos los drop-caps excepto el primero
    // Empezar desde el último para no cambiar posiciones
    for (let i = dropCapPositions.length - 1; i >= 1; i--) {
      const pos = dropCapPositions[i];
      // Encontrar el final del span (hasta </span>)
      const endTag = '</span>';
      const endPos = html.indexOf(endTag, pos);
      if (endPos !== -1) {
        const spanEnd = endPos + endTag.length;
        // Extraer: <span class="drop-cap"...>X</span> -> solo dejar X (la letra)
        const spanContent = html.substring(pos, spanEnd);
        const letterMatch = spanContent.match(/<span[^>]*>([A-ZÑÑÑÑÑÑ])<\/span>/i);
        if (letterMatch) {
          const letter = letterMatch[1];
          // Reemplazar el span completo con solo la letra
          html = html.substring(0, pos) + letter + html.substring(spanEnd);
        } else {
          // Si no matcheamos, simplemente remover el span wrapper
          html = html.substring(0, pos) + html.substring(spanEnd);
        }
      }
    }
    console.log(`  â Drop-caps duplicados removidos`);
  }
  
  // 3. Limpiar CTAs huérfanos: buscar el patrón después de blog-cta-inline
  // El patrón problemático es: </div> seguido de h3+p+a sin contenedor
  const orphanCtaPattern = /<\/div>\s*<h3 style="color: #fff; margin-top: 0; margin-bottom: 1rem; font-size: 1\.6rem; font-weight: 700;">[^<]+<\/h3>\s*<p style="color: #bbb;[^<]+<\/p>\s*<a href="\/register"[^>]+>[^<]+<\/a>\s*<\/div>/g;
  const matches = html.match(orphanCtaPattern);
  if (matches) {
    console.log(`  - CTAs huérfanos encontrados: ${matches.length}`);
    // Remover los CTAs huérfanos (ya tenemos CTAs válidos en generateArticleHTML)
    html = html.replace(orphanCtaPattern, '');
    console.log(`  â CTAs huérfanos removidos`);
  }
  
  // 4. Verificar que no haya más elementos problemáticos
  const remainingDropCaps = (html.match(/<span class="drop-cap"/g) || []).length;
  const remainingOrphanCtas = (html.match(/<h3 style="color: #fff; margin-top: 0; margin-bottom: 1rem; font-size: 1\.6rem; font-weight: 700;">Â¿Cansado[^<]*<\/h3>\s*<p style="color: #bbb;[^<]*<\/p>\s*<a href="\/register"/g) || []).length;
  
  console.log(`  - Drop-caps restantes: ${remainingDropCaps}`);
  console.log(`  - CTAs huérfanos restantes: ${remainingOrphanCtas}`);
  
  // 5. Si hicimos cambios, actualizar
  if (html.length !== originalLen) {
    const { error: updateError } = await supabase
      .from('blogs')
      .update({ content: html, updated_at: new Date().toISOString() })
      .eq('id', blogId);
      
    if (updateError) {
      console.error(`  â Error actualizando: ${updateError.message}`);
    } else {
      console.log(`  â Actualizado: ${originalLen} -> ${html.length} bytes`);
    }
  } else {
    console.log(`  â Sin cambios necesarios`);
  }
}

async function main() {
  console.log('ð§¹ Blog Cleanup Script');
  console.log('====================\n');
  
  // Artículos conocidos con problemas
  const problematicSlugs = [
    { id: 'f8e94415-79d3-4a4b-8a77-99e95483afdf', slug: 'estrategias-clave-para-impulsar-las-ventas-en-moda-digital-colombiana-2' },
    { id: '3baec0ef-cf93-4995-80a1-5f9786a90092', slug: 'moda-en-colombia-2026-tendencias-crecimiento-y-consolidacion-2' },
    { id: '5311cd93-90a4-437e-b329-6b2c93feaea5', slug: '5-consejos-clave-para-disparar-tus-ventas-con-live-shopping-en-colombia' },
  ];
  
  for (const blog of problematicSlugs) {
    await cleanupBlog(blog.id, blog.slug);
  }
  
  console.log('\nâ Cleanup completo');
}

main().catch(console.error);
