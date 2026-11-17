import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function uploadToSupabaseStorage() {
  const fileBuffer = fs.readFileSync('public/uploads/properties/godigamuwa-dunagaha-house.jpg');
  const path = 'listings/godigamuwa-dunagaha-house.jpg';

  const { data, error } = await supabase.storage
    .from('property-images')
    .upload(path, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Storage upload error:', error);
  } else {
    const { data: publicUrlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(path);

    console.log('Successfully uploaded to Supabase Storage!');
    console.log('Public URL:', publicUrlData.publicUrl);

    // Update the property record in Supabase with this permanent high-speed CDN URL
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        hero_image: publicUrlData.publicUrl,
        images: [publicUrlData.publicUrl],
      })
      .eq('slug', 'fully-complete-house-for-sale-in-godigamuwa-dunagaha');

    console.log('Property update error:', updateError);
  }
}

uploadToSupabaseStorage();
