import { PROPERTIES_DATA } from '../src/data/properties';
import * as fs from 'fs';
import * as path from 'path';

let sql = `-- ==============================================================================
-- 11_🌱_SEED_INITIAL_PROPERTIES.sql
-- Step 11: Authoritative Seed Catalog of Sri Lankan Real Estate (13 Premier Properties)
-- Idempotent insertion: Safe to execute repeatedly without duplicating rows
-- ==============================================================================

INSERT INTO public.properties (
    id,
    listing_ref,
    slug,
    title,
    description,
    property_type,
    purpose,
    publication_status,
    status,
    price_lkr,
    price_unit,
    is_negotiable,
    price_on_request,
    city,
    district,
    address,
    latitude,
    longitude,
    bedrooms,
    bathrooms,
    sqft,
    land_perches,
    parking_spaces,
    hero_image,
    images,
    floor_plans,
    amenities,
    assigned_agent_name,
    view_count,
    inquiry_count,
    save_count,
    is_featured,
    is_trending,
    trending_velocity_text,
    collections,
    published_at
) VALUES
`;

const rows = PROPERTIES_DATA.map((p, index) => {
    const listingRef = 'LP-' + String(index + 1).padStart(3, '0');
    const pubStatus = index === 3 ? 'pending_review' : (index === 7 ? 'draft' : (index === 8 ? 'archived' : 'published'));
    const isTrending = index === 0 || index === 1 || index === 4 || index === 6;
    const trendingVelocityText =
      index === 0 ? 'Viewed 420+ times this week' :
      index === 1 ? '4 Inquiries in 24 hours' :
      index === 4 ? 'High Demand in Colombo 07' :
      index === 6 ? 'Fastest Selling Beachfront' : null;

    const collections: string[] = [];
    if (p.isFeatured) collections.push('featured');
    if (isTrending) collections.push('trending');
    if (p.isSignature) collections.push('signature', 'architectural');
    if (p.type === 'land' || p.purpose === 'land') collections.push('land');

    const hero = p.images?.[0] || null;
    const imagesJson = JSON.stringify(p.images || []).replace(/'/g, "''");
    const floorPlansJson = JSON.stringify(p.floorPlans || []).replace(/'/g, "''");
    const amenitiesJson = JSON.stringify(p.amenities || []).replace(/'/g, "''");
    const collectionsJson = JSON.stringify(collections).replace(/'/g, "''");

    const desc = (p.description || '').replace(/'/g, "''");
    const title = (p.title || '').replace(/'/g, "''");
    const city = (p.location?.city || '').replace(/'/g, "''");
    const district = (p.location?.district || '').replace(/'/g, "''");
    const address = (p.location?.address || '').replace(/'/g, "''");
    const agentName = (p.agent?.name || 'Mr Lalith Ranatunga').replace(/'/g, "''");
    const lat = p.location?.coordinates?.latitude || 6.9271;
    const lng = p.location?.coordinates?.longitude || 79.8612;

    return `  (
    '${p.id}',
    '${listingRef}',
    '${p.slug}',
    '${title}',
    '${desc}',
    '${p.type}',
    '${p.purpose}',
    '${pubStatus}',
    '${p.status || 'active'}',
    ${p.priceLkr},
    '${p.priceUnit || 'total'}',
    ${Boolean(p.isNegotiable)},
    ${Boolean(p.priceOnRequest)},
    '${city}',
    '${district}',
    '${address}',
    ${lat},
    ${lng},
    ${p.specs?.bedrooms ?? 'NULL'},
    ${p.specs?.bathrooms ?? 'NULL'},
    ${p.specs?.floorAreaSqFt ?? 'NULL'},
    ${p.specs?.landPerches ?? 'NULL'},
    ${p.specs?.parkingSpaces ?? 'NULL'},
    ${hero ? "'" + hero + "'" : 'NULL'},
    '${imagesJson}'::jsonb,
    '${floorPlansJson}'::jsonb,
    '${amenitiesJson}'::jsonb,
    '${agentName}',
    ${Math.floor(Math.random() * 200 + 45)},
    ${Math.floor(Math.random() * 15 + 2)},
    ${Math.floor(Math.random() * 30 + 5)},
    ${Boolean(p.isFeatured)},
    ${Boolean(isTrending)},
    ${trendingVelocityText ? "'" + trendingVelocityText.replace(/'/g, "''") + "'" : 'NULL'},
    '${collectionsJson}'::jsonb,
    timezone('utc', now() - interval '${index * 2} days')
  )`;
});

sql += rows.join(',\n') + `
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price_lkr = EXCLUDED.price_lkr,
    property_type = EXCLUDED.property_type,
    purpose = EXCLUDED.purpose,
    publication_status = EXCLUDED.publication_status,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    address = EXCLUDED.address,
    images = EXCLUDED.images,
    amenities = EXCLUDED.amenities,
    updated_at = timezone('utc', now());
`;

const outputPath = path.resolve(process.cwd(), 'supabase/migrations/11_🌱_SEED_INITIAL_PROPERTIES.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log('Successfully generated 11_🌱_SEED_INITIAL_PROPERTIES.sql');
