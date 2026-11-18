import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rnedttrpovxswnraezas.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_vBaZKq7pyNXrYxRymTNdkQ_hGPZV6ca';
const supabase = createClient(url, key);

async function main() {
  console.log('Connecting to Supabase at:', url);

  const heroFilename = 'asgiriya-gampaha-hero.jpg';
  const filePath = path.join(process.cwd(), 'public/uploads/properties', heroFilename);
  let primaryImage = 'https://lankaproperty.lk/uploads/properties/asgiriya-gampaha-hero.jpg';

  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    const storagePath = `listings/${heroFilename}`;

    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

    if (error) {
      console.warn('Storage upload note:', error.message);
    } else {
      const { data: pubData } = supabase.storage.from('property-images').getPublicUrl(storagePath);
      console.log('Uploaded to Supabase CDN:', pubData.publicUrl);
      primaryImage = pubData.publicUrl;
    }
  }

  const allImages = [
    primaryImage,
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=85'
  ];

  const fullDescription = `Paddy field-facing newly built single-storey modern house for sale in a highly peaceful and residential enclave in Asgiriya, Gampaha.

Conveniently situated just 5 minutes to Gampaha town centre, leading national schools (Bandaranayake College, Rathnavali Balika Vidyalaya), railway station, and general hospital.

Property Highlights:
• Breathtaking uninterrupted scenic views facing lush green paddy fields
• Modern architectural design with open verandah and ample natural airflow
• 3 spacious bedrooms designed for comfortable family living
• 1 modern bathroom with quality sanitary fittings
• Open-plan living and dining pavilion with high timber ceiling
• Contemporary kitchen with provisions for pantry cabinetry
• Spacious landscaped garden with ample boundary wall protection
• Parking space for 2 vehicles
• 100% Clear Title Deeds with Bim Saviya First Class documentation

A truly serene and tranquil environment for nature lovers seeking clean air, greenery, and quick access to Gampaha commercial hub.`;

  const asgiriyaProperty = {
    id: 'a59f1089-0415-4300-8000-179490890415',
    listing_ref: 'LP-GAM-2026-2000',
    slug: 'paddy-field-facing-newly-built-house-for-sale-in-asgiriya-gampaha',
    title: 'Paddy Field-Facing, Newly Built House for Sale in Asgiriya, Gampaha',
    description: fullDescription,
    property_type: 'house',
    category: 'house',
    purpose: 'buy',
    listing_type: 'buy',
    publication_status: 'published',
    status: 'active',
    price: 20000000,
    price_lkr: 20000000,
    price_unit: 'total',
    negotiable: true,
    price_on_request: false,
    city: 'Asgiriya',
    district: 'Gampaha',
    address: 'Asgiriya, Gampaha (Western Province)',
    latitude: 7.0897,
    longitude: 79.9928,
    bedrooms: 3,
    bathrooms: 1,
    sqft: 1450,
    land_perches: 10.0,
    floors: 1,
    parking_spaces: 2,
    hero_image: primaryImage,
    images: allImages,
    amenities: [
      'Paddy Field Views',
      'Landscaped Garden',
      'Open Verandah',
      'Boundary Wall',
      'Clear Title',
      'Private Parking',
      'Peaceful Environment'
    ],
    collections: ['featured', 'lifestyle'],
    assigned_agent_name: 'LankaProperty Desk',
    is_featured: true,
    is_trending: true,
    trending_velocity_text: 'High Buyer Interest in Gampaha',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('properties')
    .upsert(asgiriyaProperty, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('Error inserting Asgiriya property to Supabase:', error);
    process.exit(1);
  }

  console.log('Successfully upserted Asgiriya property into Supabase:', data);
}

main().catch(console.error);
