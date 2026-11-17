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
    'godigamuwa-dunagaha-house.jpg',
    'godigamuwa-dunagaha-1-hero.jpg',
    'godigamuwa-dunagaha-2-verandah.jpg',
    'godigamuwa-dunagaha-3-living.jpg',
    'godigamuwa-dunagaha-4-bed1.jpg',
    'godigamuwa-dunagaha-5-bed2.jpg',
    'godigamuwa-dunagaha-6-bath.jpg',
    'godigamuwa-dunagaha-7-bath2.jpg',
    'godigamuwa-dunagaha-8-garden.jpg'
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
      // Fallback to domain URL
      cdnUrls.push(`https://lankaproperty.lk/uploads/properties/${f}`);
    } else {
      const { data: pubData } = supabase.storage.from('property-images').getPublicUrl(storagePath);
      console.log(`Uploaded to Supabase CDN: ${f} -> ${pubData.publicUrl}`);
      cdnUrls.push(pubData.publicUrl);
    }
  }

  const primaryImage = cdnUrls[0] || 'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-house.jpg';
  // If we have additional photos, ensure primary is first, then rest
  const allImages = cdnUrls.length > 0 ? cdnUrls : [primaryImage];

  const fullDescription = `An exceptional opportunity to own a beautifully designed luxury residence set in the peaceful and highly sought-after residential enclave of Godigamuwa, Dunagaha. This property offers high-quality finishes throughout and is an outstanding property perfect for living, as well as exceptional long-term investment.

ADDITIONAL LISTING DETAILS & HIGHLIGHTS

Property Highlights:
• Bedrooms: 3 spacious, comfortable bedrooms
• Land extent: Sprawling and beautifully landscaped property positioned in a peaceful setting on 20.7 perches of prime land
• Bathrooms: 2 Bathrooms, with ultra-modern sanitary ware
• Total floor area: Approximately 2,160 square feet of architecturally designed luxury space

Living Spaces:
• Open plan vacant hallway
• Comfortable and elegant dining area
• Large verandah/balcony ideal for relaxing & entertaining

Kitchen & Utilities:
• Modern kitchen facilities
• Efficient layout & fixtures

Security Features:
• CCTV system covering the entire property
• Secure estate with fully-walled boundary
• Roller gate / remote entrance

Outdoor Features:
• Well-maintained large landscaped garden with lush green lawn and mature trees
• Ample parking space for multiple vehicles inside and outside
• Peaceful and serene environment away from noise

This well-maintained, luxury home combines modern architecture with utmost privacy and a serene environment, making it a perfect choice for comfortable family living.`;

  const updatedProperty = {
    id: 'e102f43a-7a19-4849-868d-71285efd9c12',
    listing_ref: 'LP-GAM-2026-8821',
    slug: 'fully-complete-house-for-sale-in-godigamuwa-dunagaha',
    title: 'Fully Complete House for Sale in Godigamuwa, Dunagaha.',
    description: fullDescription,
    property_type: 'house',
    category: 'house',
    purpose: 'buy',
    listing_type: 'buy',
    publication_status: 'published',
    status: 'active',
    price: 0,
    price_lkr: 0,
    price_unit: 'total',
    negotiable: true,
    price_on_request: true,
    city: 'Divulapitiya',
    district: 'Gampaha',
    address: 'Godigamuwa, Dunagaha, Divulapitiya, Gampaha (WP Western Province)',
    latitude: 7.2185,
    longitude: 79.9723,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2160,
    land_perches: 20.7,
    floors: 1,
    parking_spaces: 2,
    hero_image: primaryImage,
    images: allImages,
    amenities: [
      'Air Conditioning',
      '24-Hour Security',
      'CCTV Surveillance',
      'Landscaped Garden',
      'Private Parking'
    ],
    assigned_agent_name: 'Mr Lalith Ranatunga',
    is_featured: true,
    is_trending: true,
    trending_velocity_text: 'High Inquiry Demand in Gampaha This Week',
    collections: ['featured', 'trending'],
    published_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('properties')
    .upsert(updatedProperty, { onConflict: 'id' });

  if (error) {
    console.error('Supabase update failed:', error);
  } else {
    console.log('Successfully updated Godigamuwa listing in Supabase with all 20.7 perches, complete specs and', allImages.length, 'photos!');
  }
}

main().catch((err) => console.error(err));
