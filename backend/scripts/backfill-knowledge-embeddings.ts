// Script: Re-embed all lookitry_knowledge items with text-embedding-004 via Vertex AI
// Run: pnpm exec ts-node scripts/backfill-knowledge-embeddings.ts

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env', override: true });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!
);

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.VERTEX_PROJECT_ID || 'gen-lang-client-0591001769',
  location: 'us-central1',
});

async function generateEmbedding(title: string, content: string): Promise<number[] | null> {
  const text = `${title}\n\n${content}`.slice(0, 2000);
  try {
    const result = await (ai.models as any).embedContent({
      model: 'text-embedding-004',
      contents: [{ parts: [{ text }] }],
      taskType: 'RETRIEVAL_DOCUMENT',
    });
    // SDK returns { embeddings: [{ values: number[] }] } or { embedding: { values: number[] } }
    const values: number[] | undefined =
      result?.embeddings?.[0]?.values ??
      result?.embedding?.values ??
      result?.predictions?.[0]?.embeddings?.values;
    return values ?? null;
  } catch (err: any) {
    console.error('Error llamando Vertex embedding:', err.message);
    return null;
  }
}

async function main() {
  const { data: items, error } = await supabase
    .from('lookitry_knowledge')
    .select('id, title, content');

  if (error) {
    console.error('Error leyendo lookitry_knowledge:', error.message);
    process.exit(1);
  }

  console.log(`Procesando ${items?.length ?? 0} items...`);
  let ok = 0, failed = 0;

  for (const item of items ?? []) {
    const embedding = await generateEmbedding(item.title, item.content);
    if (!embedding) {
      console.error(`✗ ${item.id}: embedding falló`);
      failed++;
      continue;
    }
    if (embedding.length !== 768) {
      console.error(`✗ ${item.id}: dimensión incorrecta ${embedding.length} (esperada 768)`);
      failed++;
      continue;
    }
    const { error: updateError } = await supabase
      .from('lookitry_knowledge')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', item.id);

    if (updateError) {
      console.error(`✗ ${item.id}: update falló —`, updateError.message);
      failed++;
    } else {
      console.log(`✓ ${item.id}: ${item.title} (${embedding.length} dims)`);
      ok++;
    }
    // Rate limit: Vertex AI embedding ~300ms entre requests
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nFin: ${ok} OK, ${failed} fallidos`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
