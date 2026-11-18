import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xmvhnzuidwpwvdnyydio.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2LUs3ORDsu4TrHUQOlsXyw_xP9KgxP9';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const UPLOADS_DIR = path.resolve('public/uploads/properties');

async function uploadAllWebp() {
  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => f.endsWith('.webp') && !f.startsWith('lp_'));
  console.log(`Found ${files.length} optimized WebP files to upload to property-images/listings/...`);

  let successCount = 0;
  for (const file of files) {
    const filePath = path.join(UPLOADS_DIR, file);
    const buffer = fs.readFileSync(filePath);
    const storagePath = `listings/${file}`;

    const { error } = await supabase.storage
      .from('property-images')
      .upload(storagePath, buffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      });

    if (error) {
      console.error(`FAIL [${file}]:`, error.message);
    } else {
      const { data } = supabase.storage.from('property-images').getPublicUrl(storagePath);
      console.log(`OK [${file}] -> ${data.publicUrl}`);
      successCount++;
    }
  }

  console.log(`\nCompleted: ${successCount}/${files.length} WebP images uploaded to Supabase Storage.`);
}

uploadAllWebp().catch((err) => {
  console.error('Upload error:', err);
  process.exit(1);
});
