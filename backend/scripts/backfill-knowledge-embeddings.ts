// Script: Re-embed all lookitry_knowledge items with text-embedding-004 via Vertex AI
// Run: pnpm exec ts-node scripts/backfill-knowledge-embeddings.ts

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: '.env', override: true });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'secrets', 'vertex-key.json');

const supabase = createClient(
  process.env.SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!
);

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.VERTEX_PROJECT_ID || 'gen-lang-client-0591001769',
  location: 'us-central1',
});

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const result = await (ai.models as any).embedContent({
      model: 'text-embedding-004',
      contents: [{ parts: [{ text }] }],
      taskType: 'RETRIEVAL_DOCUMENT',
    });
    return result?.embeddings?.[0]?.values ?? result?.embedding?.values ?? null;
  } catch (err: any) {
    console.error('Error calling Vertex embedding:', err.message);
    return null;
  }
}

async function main() {
  const { data: items, error } = await supabase
    .from('lookitry_knowledge')
    .select('id, title, content');

  if (error) {
    console.error('Error reading lookitry_knowledge:', error.message);
    process.exit(1);
  }

  console.log(`Processing ${items?.length ?? 0} items with text-embedding-004 (768 dims)...`);
  let ok = 0, failed = 0;

  for (const item of items ?? []) {
    const text = `${item.title}\n\n${item.content}`.slice(0, 2000);
    const embedding = await generateEmbedding(text);
    if (!embedding) {
      console.error(`✗ ${item.id}: embedding failed`);
      failed++;
      continue;
    }
    if (embedding.length !== 768) {
      console.error(`✗ ${item.id}: wrong dimension ${embedding.length} (expected 768)`);
      failed++;
      continue;
    }
    const { error: updateError } = await supabase
      .from('lookitry_knowledge')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', item.id);

    if (updateError) {
      console.error(`✗ ${item.id}: update failed —`, updateError.message);
      failed++;
    } else {
      console.log(`✓ ${item.id}: ${item.title} (${embedding.length} dims)`);
      ok++;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone: ${ok} OK, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();