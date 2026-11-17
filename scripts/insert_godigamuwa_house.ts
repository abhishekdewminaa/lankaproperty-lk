import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function insertGodigamuwaHouse() {
  const property = {
    id: 'e102f43a-7a19-4849-868d-71285efd9c12',
    listing_ref: 'LP-GAM-2026-8821',
    slug: 'fully-complete-house-for-sale-in-godigamuwa-dunagaha',
    title: 'Fully Complete House for Sale in Godigamuwa, Dunagaha',
    description: 'Beautifully maintained modern bungalow set on landscaped gardens in Godigamuwa, Dunagaha (Divulpitiya, Gampaha). 3 spacious bedrooms, 3 bathrooms, 2,160 sq ft living area with covered verandah, high timber ceiling, secure boundary walls, and rolling lawn. Complete freehold title with all statutory approvals.',
    property_type: 'house',
    category: 'house',
    purpose: 'buy',
    listing_type: 'buy',
    publication_status: 'published',
    status: 'active',
    price_lkr: 0,
    price: 0,
    price_unit: 'total',
    negotiable: true,
    price_on_request: true,
    city: 'Divulapitiya',
    district: 'Gampaha',
    address: 'Godigamuwa, Dunagaha, Divulapitiya',
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2160,
    land_perches: 15,
    floors: 1,
    parking_spaces: 2,
    hero_image: 'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-house.jpg',
    images: [
      'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-house.jpg'
    ],
    amenities: [
      'Landscaped Garden',
      'Covered Car Porch',
      'High Timber Ceilings',
      'Boundary Wall & Gate',
      'Pipe-Borne Water & Electricity',
      'Clear Freehold Deed'
    ],
    assigned_agent_name: 'Mr Lalith Ranatunga',
    is_featured: true,
    is_trending: true,
    trending_velocity_text: 'High Inquiry Demand in Gampaha This Week',
    published_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('properties')
    .upsert(property, { onConflict: 'id' });

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Successfully inserted Godigamuwa Dunagaha property to Supabase:', property.slug);
  }
}

insertGodigamuwaHouse();
