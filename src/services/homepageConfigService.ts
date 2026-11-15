import { HomepageDraftConfig } from '../admin/types/admin';

export const DEFAULT_HOMEPAGE_CONFIG: HomepageDraftConfig = {
  version: 1,
  lastSavedAt: '2026-10-05 09:15 AM',
  lastPublishedAt: '2026-10-05 09:30 AM',
  hero: {
    headline: 'Find a place that feels like yours.',
    subheadline: 'Property in Sri Lanka',
    supportingCopy: 'Explore homes, land, apartments, and new developments across Sri Lanka with transparent pricing and direct inquiry.',
    exploreBtnText: 'Explore Properties',
    discoverBtnText: 'Discover New Projects',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=2000&q=85',
  },
  editorialStatement: {
    headline: 'More room for the life you want.',
    supportingText: 'Tropical modern homes designed for equatorial shade, oceanic breezes, and enduring architectural calm across Sri Lanka.',
  },
  featuredSectionTitle: 'Featured Properties',
  curatedSectionTitle: 'Exceptional Homes & Land',
  motionPreset: 'gentle_reveal',
  isDraft: false,
};

class HomepageConfigService {
  getPublishedConfig(): HomepageDraftConfig {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('lankaproperty_admin_homepage_published');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.hero) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load published homepage config from storage:', e);
    }
    return DEFAULT_HOMEPAGE_CONFIG;
  }

  getDraftConfig(): HomepageDraftConfig {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('lankaproperty_admin_homepage_draft');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.hero) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load draft homepage config from storage:', e);
    }
    return this.getPublishedConfig();
  }

  subscribe(listener: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => listener();
    window.addEventListener('lankaproperty:homepage-update', handler);
    return () => window.removeEventListener('lankaproperty:homepage-update', handler);
  }
}

export const homepageConfigService = new HomepageConfigService();
