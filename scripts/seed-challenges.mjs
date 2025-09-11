#!/usr/bin/env node
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.\nSee .env.example for placeholders.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const filePath = new URL('../challenges.json', import.meta.url);
  const raw = await fs.readFile(filePath, 'utf8');
  const items = JSON.parse(raw);

  console.log(`Found ${items.length} challenge items in challenges.json`);

  // Upsert in chunks to avoid giant requests
  const chunkSize = 50;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    console.log(`Uploading chunk ${i}..${i + chunk.length - 1} (${chunk.length} items)`);
    const { data, error } = await supabase.from('challenges').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error('Upsert error:', error);
      process.exit(1);
    }
    console.log(`Chunk uploaded: ${chunk.length} items`);
  }

  console.log('All challenges uploaded successfully');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
