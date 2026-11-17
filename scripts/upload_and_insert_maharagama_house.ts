import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function main() {
  console.log('Connecting to Supabase at:', url);

  const files = [
    'maharagama-janatha-mawatha-1-hero.jpg',
    'maharagama-janatha-mawatha-2-aerial.jpg',
    'maharagama-janatha-mawatha-3-interior.jpg',
  ];

  const cdnUrls: string[] = [];

  for (const f of files) {
    const filePath = path.join(process.cwd(), 'public/uploads/properties', f);
    if (!fs.existsSync(filePath)) {
      console.warn('File not found locally:', f);
      continue;
    }
    const buffer = fs.readFileSync(filePath);
    const storagePath = `listings/${f}`;

    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

    if (error) {
      console.warn(`Storage upload note for ${f}:`, error.message);
      cdnUrls.push(`https://lankaproperty.lk/uploads/properties/${f}`);
    } else {
      const { data: pubData } = supabase.storage.from('property-images').getPublicUrl(storagePath);
      console.log(`Uploaded to Supabase CDN: ${f} -> ${pubData.publicUrl}`);
      cdnUrls.push(pubData.publicUrl);
    }
  }

  const primaryImage = cdnUrls[0] || 'https://lankaproperty.lk/uploads/properties/maharagama-janatha-mawatha-1-hero.jpg';
  const allImages = cdnUrls.length > 0 ? cdnUrls : [primaryImage];

  const fullDescription = `An exceptional opportunity to acquire a solidly built, architect-designed luxury two-storey residence situated in the prime residential enclave of Janatha Mawatha, Navinna, Maharagama.

Conveniently located within minutes of High Level Road, Navinna junction, premier hospitals, and leading international and national schools.

Property Highlights:
• Solidly constructed with 100% brick masonry and premium Kumbuk/Teak timber finishes
• Soaring double-height living room with excellent natural light and cross ventilation
• 4 spacious bedrooms including luxury master suite with private balcony
• 3 modern bathrooms with imported sanitary fittings and solar hot water
• Fully fitted modern pantry with solid mahogany cabinetry and granite countertops
• Enclosed automated roller shutter garage with parking for 2 vehicles
• Secure boundary walls, CCTV surveillance system, and wicket gate
• Open rooftop entertainment terrace offering panoramic neighborhood vistas
• 100% Clear Freehold Title Deed with approved building plan and COC

This magnificent property offers the ideal combination of urban accessibility, premium construction security, and refined residential comfort.`;

  const maharagamaProperty = {
    id: 'b482e911-3942-49da-a859-9943f6057ce8',
    listing_ref: 'LP-COL-2026-6800',
    slug: 'solidly-built-house-for-sale-in-an-excellent-location-janatha-mawatha-maharagama',
    title: 'Solidly Built House for Sale in an Excellent Location – Janatha Mawatha, Maharagama',
    description: fullDescription,
    property_type: 'house',
    category: 'house',
    purpose: 'buy',
    listing_type: 'buy',
    publication_status: 'published',
    status: 'active',
    price: 68000000,
    price_lkr: 68000000,
    price_unit: 'total',
    negotiable: true,
    price_on_request: false,
    city: 'Maharagama',
    district: 'Colombo',
    address: 'Janatha Mawatha, Navinna, Maharagama, Colombo (Western Province)',
    latitude: 6.8485,
    longitude: 79.9267,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2800,
    land_perches: 10.5,
    floors: 2,
    parking_spaces: 2,
    hero_image: primaryImage,
    images: allImages,
    amenities: [
      'Air Conditioning',
      'Solar Hot Water',
      'Automated Roller Gate',
      '24-Hour Security',
      'CCTV Surveillance',
      'Rooftop Terrace',
      'Landscaped Garden',
      'Private Parking'
    ],
    assigned_agent_name: 'Mr Lalith Ranatunga',
    is_featured: true,
    is_trending: true,
    trending_velocity_text: 'High Inquiry Demand in Maharagama This Week',
    collections: ['featured', 'trending'],
    published_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('properties')
    .upsert(maharagamaProperty, { onConflict: 'id' });

  if (error) {
    console.error('Supabase upsert failed:', error);
  } else {
    console.log('Successfully inserted Maharagama listing to Supabase with full specs and', allImages.length, 'photos!');
  }
}

main().catch((err) => console.error(err));
