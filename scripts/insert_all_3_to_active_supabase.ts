import { createClient } from '@supabase/supabase-js';

const url = 'https://xmvhnzuidwpwvdnyydio.supabase.co';
const key = 'sb_publishable_2LUs3ORDsu4TrHUQOlsXyw_xP9KgxP9';
const client = createClient(url, key);

async function syncAll3() {
  console.log('Inserting 3 authoritative properties into active Supabase:', url);

  const properties = [
    // 1. Asgiriya Property
    {
      id: 'prop-1794908904153',
      listing_ref: 'LP-GAM-2026-2000 prop-1794908904153',
      slug: 'paddy-field-facing-newly-built-house-for-sale-in-asgiriya-gampaha',
      title: 'Paddy Field-Facing, Newly Built House for Sale in Asgiriya, Gampaha',
      description: `Paddy field-facing newly built single-storey modern house for sale in a highly peaceful and residential enclave in Asgiriya, Gampaha.

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

A truly serene and tranquil environment for nature lovers seeking clean air, greenery, and quick access to Gampaha commercial hub.`,
      property_type: 'house',
      purpose: 'buy',
      publication_status: 'published',
      status: 'active',
      price_lkr: 20000000,
      price_unit: 'total',
      is_negotiable: true,
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
      hero_image: 'https://lankaproperty.lk/uploads/properties/asgiriya-gampaha-hero.jpg',
      images: [
        'https://lankaproperty.lk/uploads/properties/asgiriya-gampaha-hero.jpg',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=85'
      ],
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
      updated_at: new Date().toISOString()
    },

    // 2. Maharagama Property
    {
      id: 'prop-1794902582161',
      listing_ref: 'LP-COL-2026-6800 prop-1794902582161',
      slug: 'solidly-built-house-for-sale-in-an-excellent-location-janatha-mawatha-maharagama',
      title: 'Solidly Built House for Sale in an Excellent Location – Janatha Mawatha, Maharagama',
      description: `An exceptional opportunity to acquire a solidly built, architect-designed luxury two-storey residence situated in the prime residential enclave of Janatha Mawatha, Navinna, Maharagama.

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

This magnificent property offers the ideal combination of urban accessibility, premium construction security, and refined residential comfort.`,
      property_type: 'house',
      purpose: 'buy',
      publication_status: 'published',
      status: 'active',
      price_lkr: 68000000,
      price_unit: 'total',
      is_negotiable: true,
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
      hero_image: 'https://lankaproperty.lk/uploads/properties/maharagama-janatha-mawatha-1-hero.jpg',
      images: [
        'https://lankaproperty.lk/uploads/properties/maharagama-janatha-mawatha-1-hero.jpg',
        'https://lankaproperty.lk/uploads/properties/maharagama-janatha-mawatha-2-aerial.jpg',
        'https://lankaproperty.lk/uploads/properties/maharagama-janatha-mawatha-3-interior.jpg',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=85'
      ],
      amenities: [
        'Air Conditioning',
        'Solar Hot Water',
        'Automated Roller Gate',
        '24-Hour Security',
        'CCTV Surveillance',
        'Landscaped Garden',
        'Rooftop Terrace'
      ],
      collections: ['featured', 'luxury'],
      assigned_agent_name: 'Dr. Roshan Senanayake',
      is_featured: true,
      is_trending: true,
      trending_velocity_text: 'High Buyer Interest in Maharagama',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // 3. Godigamuwa, Dunagaha Property
    {
      id: 'prop-1794898758796',
      listing_ref: 'LP-GAM-2026-9875 prop-1794898758796',
      slug: 'fully-complete-house-for-sale-in-godigamuwa-dunagaha',
      title: 'Fully Complete House for Sale in Godigamuwa, Dunagaha.',
      description: `An exceptional opportunity to own a beautifully designed luxury modern home located in the peaceful and highly sought-after residential enclave of Godigamuwa, Dunagaha. Offering uncompromised build quality, generous land extent, and a commanding single-level footprint, this property is perfect for living, retirement, or long-term capital investment.

Key Architectural & Property Details:
• Bedrooms: 3 spacious air-conditioned bedrooms
• Bathrooms: 2 modern bathrooms with imported sanitary fittings and solar-assisted hot water
• Open-plan front verandah with polished titanium floor finishes
• Expansive living and dining room with soaring exposed-rafter ceilings
• Contemporary fitted kitchen with solid teak pantry cabinetry
• Dedicated maid's quarters with separate washroom
• CCTV camera security system covering whole property perimeter
• Securely enclosed by a full-height boundary wall and automated remote gate
• Landscaped tropical garden featuring mature fruit trees and flowering shrubs
• Dual covered parking spaces with ample paved visitor parking`,
      property_type: 'house',
      purpose: 'buy',
      publication_status: 'published',
      status: 'active',
      price_lkr: 0,
      price_unit: 'total',
      is_negotiable: true,
      price_on_request: true,
      city: 'Divulapitiya',
      district: 'Gampaha',
      address: 'Godigamuwa, Dunagaha, Divulapitiya, Gampaha (Western Province)',
      latitude: 7.2345,
      longitude: 80.0123,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 2160,
      land_perches: 20.7,
      floors: 1,
      parking_spaces: 2,
      hero_image: 'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-1-hero.jpg',
      images: [
        'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-1-hero.jpg',
        'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-2-verandah.jpg',
        'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-3-living.jpg',
        'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-4-bed1.jpg',
        'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-5-bed2.jpg',
        'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-6-bath.jpg',
        'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-7-bath2.jpg',
        'https://lankaproperty.lk/uploads/properties/godigamuwa-dunagaha-8-garden.jpg'
      ],
      amenities: [
        'Air Conditioning',
        '24-Hour Security',
        'CCTV Surveillance',
        'Landscaped Garden',
        'Private Parking',
        'Solar Hot Water',
        'Boundary Wall & Remote Gate'
      ],
      collections: ['featured'],
      assigned_agent_name: 'Dr. Roshan Senanayake',
      is_featured: true,
      is_trending: false,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  for (const p of properties) {
    const { data, error } = await client
      .from('properties')
      .upsert(p as any, { onConflict: 'id' })
      .select('id, title, slug, publication_status');

    if (error) {
      console.error(`Error inserting ${p.title}:`, error);
    } else {
      console.log(`SUCCESS: Upserted "${p.title}" (ID: ${p.id})`);
    }
  }

  process.exit(0);
}

syncAll3().catch((e) => {
  console.error(e);
  process.exit(1);
});
