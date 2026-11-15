import { useEffect } from 'react';

export interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  geoPlacename?: string;
  geoPosition?: { lat?: number; lng?: number; latitude?: number; longitude?: number; isApproximate?: boolean };
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const BASE_URL = 'https://lankaproperty.lk';
const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85';

function setOrCreateMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOrCreateLink(rel: string, href: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function SeoHead({
  title,
  description,
  canonicalPath = '/',
  keywords = 'Sri Lanka real estate, properties for sale Sri Lanka, Colombo apartments, Galle villas, Kandy houses, land for sale Sri Lanka, LankaProperty.lk',
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
  geoPlacename = 'Colombo, Sri Lanka',
  geoPosition = { lat: 6.9271, lng: 79.8612 },
  jsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const fullTitle = title.includes('LankaProperty.lk') ? title : `${title} | LankaProperty.lk`;
    const canonicalUrl = `${BASE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;

    // 1. Document Title
    document.title = fullTitle;

    // 2. Standard SEO & Robots Meta
    setOrCreateMeta('name', 'description', description);
    setOrCreateMeta('name', 'keywords', keywords);
    setOrCreateMeta(
      'name',
      'robots',
      noIndex
        ? 'noindex, nofollow, noarchive, nosnippet'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    setOrCreateMeta(
      'name',
      'googlebot',
      noIndex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1'
    );

    // 3. Regional & Geographic Search Signals (GEO / Local SEO)
    setOrCreateMeta('name', 'geo.region', 'LK');
    setOrCreateMeta('name', 'geo.placename', geoPlacename);
    setOrCreateMeta('name', 'geo.position', `${geoPosition.lat};${geoPosition.lng}`);
    setOrCreateMeta('name', 'ICBM', `${geoPosition.lat}, ${geoPosition.lng}`);

    // 4. Canonical URL
    setOrCreateLink('canonical', canonicalUrl);

    // 5. OpenGraph Social & AI Crawler Metadata
    setOrCreateMeta('property', 'og:title', fullTitle);
    setOrCreateMeta('property', 'og:description', description);
    setOrCreateMeta('property', 'og:url', canonicalUrl);
    setOrCreateMeta('property', 'og:image', ogImage);
    setOrCreateMeta('property', 'og:type', ogType);
    setOrCreateMeta('property', 'og:site_name', 'LankaProperty.lk');
    setOrCreateMeta('property', 'og:locale', 'en_LK');

    // 6. Twitter Cards
    setOrCreateMeta('name', 'twitter:card', 'summary_large_image');
    setOrCreateMeta('name', 'twitter:title', fullTitle);
    setOrCreateMeta('name', 'twitter:description', description);
    setOrCreateMeta('name', 'twitter:image', ogImage);

    // 7. Dynamic Schema.org JSON-LD Graph Injection
    const scriptId = 'lankaproperty-dynamic-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (noIndex) {
      if (scriptEl) scriptEl.remove();
      return;
    }

    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    const baseGraph: Record<string, any>[] = [
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'LankaProperty.lk',
        description:
          'Sri Lanka Real Estate Marketplace — Houses, Luxury Villas, Apartments, Land Plots & Master-Planned Developments across all 25 Districts.',
        inLanguage: 'en-LK',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/properties?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'RealEstateAgent',
        '@id': `${BASE_URL}/#organization`,
        name: 'LankaProperty.lk',
        url: BASE_URL,
        logo: DEFAULT_OG_IMAGE,
        areaServed: {
          '@type': 'Country',
          name: 'Sri Lanka',
        },
        currenciesAccepted: 'LKR, USD, GBP, EUR, AUD',
        priceRange: 'LKR 4,500,000 - LKR 450,000,000',
      },
    ];

    if (jsonLd) {
      if (Array.isArray(jsonLd)) {
        baseGraph.push(...jsonLd);
      } else {
        baseGraph.push(jsonLd);
      }
    }

    scriptEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': baseGraph,
    });
  }, [
    title,
    description,
    canonicalPath,
    keywords,
    ogImage,
    ogType,
    noIndex,
    geoPlacename,
    geoPosition.lat,
    geoPosition.lng,
    jsonLd,
  ]);

  return null;
}
