export interface LandmarkItem {
  id: string;
  name: string;
  category: 'school' | 'hospital' | 'location';
  typeLabel: string;
  district: string;
  city: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface CityCentroid {
  city: string;
  district: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Top Sri Lankan Schools & Universities with verified GPS coordinates
 */
export const SRI_LANKA_SCHOOLS: LandmarkItem[] = [
  {
    id: 'school-royal',
    name: 'Royal College',
    category: 'school',
    typeLabel: 'Premier National Boys School',
    district: 'Colombo',
    city: 'Colombo 07',
    address: 'Rajakeeya Mawatha, Colombo 07',
    coordinates: { latitude: 6.9056, longitude: 79.8617 },
  },
  {
    id: 'school-cis',
    name: 'Colombo International School (CIS)',
    category: 'school',
    typeLabel: 'British Curriculum International School',
    district: 'Colombo',
    city: 'Colombo 07',
    address: 'Gregory\'s Road, Colombo 07',
    coordinates: { latitude: 6.9112, longitude: 79.8719 },
  },
  {
    id: 'school-sthomas',
    name: 'S. Thomas\' College',
    category: 'school',
    typeLabel: 'Private Anglican Boys College',
    district: 'Colombo',
    city: 'Mount Lavinia',
    address: 'Hotel Road, Mount Lavinia',
    coordinates: { latitude: 6.8378, longitude: 79.8647 },
  },
  {
    id: 'school-british',
    name: 'The British School in Colombo',
    category: 'school',
    typeLabel: 'International Baccalaureate & Edexcel',
    district: 'Colombo',
    city: 'Colombo 08',
    address: 'Elvitigala Mawatha, Colombo 08',
    coordinates: { latitude: 6.9118, longitude: 79.8794 },
  },
  {
    id: 'school-ladies',
    name: 'Ladies\' College',
    category: 'school',
    typeLabel: 'Private Anglican Girls College',
    district: 'Colombo',
    city: 'Colombo 07',
    address: 'Sir Ernest de Silva Mawatha, Colombo 07',
    coordinates: { latitude: 6.9114, longitude: 79.8592 },
  },
  {
    id: 'school-bishops',
    name: 'Bishop\'s College',
    category: 'school',
    typeLabel: 'Private Anglican Girls School',
    district: 'Colombo',
    city: 'Colombo 03',
    address: 'Boyd Place, Colombo 03',
    coordinates: { latitude: 6.9178, longitude: 79.8556 },
  },
  {
    id: 'school-bridgets',
    name: 'St. Bridget\'s Convent',
    category: 'school',
    typeLabel: 'Private Catholic Girls School',
    district: 'Colombo',
    city: 'Colombo 07',
    address: 'Malalasekera Mawatha, Colombo 07',
    coordinates: { latitude: 6.9079, longitude: 79.8672 },
  },
  {
    id: 'school-gateway',
    name: 'Gateway College Colombo',
    category: 'school',
    typeLabel: 'British Curriculum International School',
    district: 'Colombo',
    city: 'Rajagiriya',
    address: 'Parliament Road, Rajagiriya',
    coordinates: { latitude: 6.9094, longitude: 79.8942 },
  },
  {
    id: 'school-elizabeth-moir',
    name: 'Elizabeth Moir School',
    category: 'school',
    typeLabel: 'International Senior School',
    district: 'Colombo',
    city: 'Colombo 05',
    address: 'Park Church Road, Colombo 05',
    coordinates: { latitude: 6.8906, longitude: 79.8694 },
  },
  {
    id: 'school-ananda',
    name: 'Ananda College',
    category: 'school',
    typeLabel: 'National Buddhist Boys College',
    district: 'Colombo',
    city: 'Colombo 10',
    address: 'Maradana Road, Colombo 10',
    coordinates: { latitude: 6.9272, longitude: 79.8708 },
  },
  {
    id: 'school-trinity',
    name: 'Trinity College',
    category: 'school',
    typeLabel: 'Historic Anglican Private College',
    district: 'Kandy',
    city: 'Kandy Central',
    address: 'Trinity College, Kandy',
    coordinates: { latitude: 7.2989, longitude: 80.6389 },
  },
  {
    id: 'school-mahinda',
    name: 'Mahinda College',
    category: 'school',
    typeLabel: 'National Boys College',
    district: 'Galle',
    city: 'Galle Town',
    address: 'Richmond Hill, Galle',
    coordinates: { latitude: 6.0547, longitude: 80.2081 },
  },
  {
    id: 'uni-colombo',
    name: 'University of Colombo',
    category: 'school',
    typeLabel: 'Premier State University',
    district: 'Colombo',
    city: 'Colombo 03',
    address: 'College House, Cumaratunga Munidasa Mawatha',
    coordinates: { latitude: 6.9000, longitude: 79.8594 },
  },
  {
    id: 'uni-moratuwa',
    name: 'University of Moratuwa',
    category: 'school',
    typeLabel: 'Engineering & Architecture Faculty Hub',
    district: 'Colombo',
    city: 'Moratuwa',
    address: 'Katubedda, Moratuwa',
    coordinates: { latitude: 6.7969, longitude: 79.9018 },
  },
  {
    id: 'uni-sliit',
    name: 'SLIIT Malabe Campus',
    category: 'school',
    typeLabel: 'Technology & Computing Institute',
    district: 'Colombo',
    city: 'Malabe',
    address: 'New Kandy Road, Malabe',
    coordinates: { latitude: 6.9147, longitude: 79.9729 },
  },
];

/**
 * Top Sri Lankan Hospitals & Healthcare Hubs with verified GPS coordinates
 */
export const SRI_LANKA_HOSPITALS: LandmarkItem[] = [
  {
    id: 'hosp-lanka',
    name: 'Lanka Hospitals',
    category: 'hospital',
    typeLabel: 'JCI-Accredited Tertiary Private Hospital',
    district: 'Colombo',
    city: 'Colombo 05',
    address: '578 Elvitigala Mawatha, Narahenpita',
    coordinates: { latitude: 6.8967, longitude: 79.8789 },
  },
  {
    id: 'hosp-asiri-central',
    name: 'Asiri Central Hospital',
    category: 'hospital',
    typeLabel: 'Flagship Multi-Specialty Hospital',
    district: 'Colombo',
    city: 'Colombo 10',
    address: '114 Norris Canal Road, Colombo 10',
    coordinates: { latitude: 6.9208, longitude: 79.8675 },
  },
  {
    id: 'hosp-asiri-surgical',
    name: 'Asiri Surgical Hospital',
    category: 'hospital',
    typeLabel: 'Specialized Surgical & Cardiology Hub',
    district: 'Colombo',
    city: 'Colombo 05',
    address: '21 Kirimandala Mawatha, Narahenpita',
    coordinates: { latitude: 6.8942, longitude: 79.8806 },
  },
  {
    id: 'hosp-nawaloka',
    name: 'Nawaloka Hospital',
    category: 'hospital',
    typeLabel: 'Pioneer Private Medical Center',
    district: 'Colombo',
    city: 'Colombo 02',
    address: 'Deshamanya H.K. Dharmadasa Mawatha, Colombo 02',
    coordinates: { latitude: 6.9228, longitude: 79.8550 },
  },
  {
    id: 'hosp-durdans',
    name: 'Durdans Hospital',
    category: 'hospital',
    typeLabel: 'JCI-Accredited Heart Surgical Center',
    district: 'Colombo',
    city: 'Colombo 03',
    address: '3 Alfred Place, Kollupitiya',
    coordinates: { latitude: 6.9011, longitude: 79.8539 },
  },
  {
    id: 'hosp-ninewells',
    name: 'Ninewells Hospital',
    category: 'hospital',
    typeLabel: 'Women & Child Healthcare Specialist',
    district: 'Colombo',
    city: 'Colombo 05',
    address: '55/1 Kirimandala Mawatha, Narahenpita',
    coordinates: { latitude: 6.8925, longitude: 79.8828 },
  },
  {
    id: 'hosp-kings',
    name: 'Kings Hospital Colombo',
    category: 'hospital',
    typeLabel: 'Modern Multi-Specialty Hospital',
    district: 'Colombo',
    city: 'Colombo 05',
    address: 'Evergreen Park Road, Narahenpita',
    coordinates: { latitude: 6.8936, longitude: 79.8800 },
  },
  {
    id: 'hosp-nhsl',
    name: 'National Hospital of Sri Lanka (NHSL)',
    category: 'hospital',
    typeLabel: 'Premier State Apex Hospital',
    district: 'Colombo',
    city: 'Colombo 10',
    address: 'Regent Street, Colombo 10',
    coordinates: { latitude: 6.9189, longitude: 79.8686 },
  },
  {
    id: 'hosp-karapitiya',
    name: 'Teaching Hospital Karapitiya',
    category: 'hospital',
    typeLabel: 'Southern Province Apex Teaching Hospital',
    district: 'Galle',
    city: 'Karapitiya',
    address: 'Labuduwa Road, Karapitiya, Galle',
    coordinates: { latitude: 6.0683, longitude: 80.2289 },
  },
  {
    id: 'hosp-kandy-national',
    name: 'National Hospital Kandy',
    category: 'hospital',
    typeLabel: 'Central Province Apex Hospital',
    district: 'Kandy',
    city: 'Kandy Central',
    address: 'William Gopallawa Mawatha, Kandy',
    coordinates: { latitude: 7.2889, longitude: 80.6278 },
  },
];

/**
 * Prime Sri Lankan Enclave & City Centroids
 */
export const SRI_LANKA_CITY_CENTROIDS: CityCentroid[] = [
  { city: 'Colombo 07 (Cinnamon Gardens)', district: 'Colombo', coordinates: { latitude: 6.9068, longitude: 79.8708 } },
  { city: 'Colombo 03 (Kollupitiya)', district: 'Colombo', coordinates: { latitude: 6.9042, longitude: 79.8542 } },
  { city: 'Colombo 02 (Union Place / Beira)', district: 'Colombo', coordinates: { latitude: 6.9208, longitude: 79.8550 } },
  { city: 'Rajagiriya (Waters Edge)', district: 'Colombo', coordinates: { latitude: 6.9083, longitude: 79.8967 } },
  { city: 'Battaramulla', district: 'Colombo', coordinates: { latitude: 6.8992, longitude: 79.9189 } },
  { city: 'Pelawatte', district: 'Colombo', coordinates: { latitude: 6.8875, longitude: 79.9306 } },
  { city: 'Mount Lavinia', district: 'Colombo', coordinates: { latitude: 6.8378, longitude: 79.8647 } },
  { city: 'Dehiwala', district: 'Colombo', coordinates: { latitude: 6.8533, longitude: 79.8667 } },
  { city: 'Nawala', district: 'Colombo', coordinates: { latitude: 6.8933, longitude: 79.8894 } },
  { city: 'Talpe (Beach Strip)', district: 'Galle', coordinates: { latitude: 6.0025, longitude: 80.2811 } },
  { city: 'Galle Fort (UNESCO Heritage)', district: 'Galle', coordinates: { latitude: 6.0267, longitude: 80.2178 } },
  { city: 'Mirissa (Southern Coast)', district: 'Matara', coordinates: { latitude: 5.9483, longitude: 80.4578 } },
  { city: 'Kandy (Hill Country)', district: 'Kandy', coordinates: { latitude: 7.2906, longitude: 80.6337 } },
  { city: 'Nuwara Eliya (Tea Estates)', district: 'Nuwara Eliya', coordinates: { latitude: 6.9497, longitude: 80.7891 } },
  { city: 'Negombo (Coastal & Airport Hub)', district: 'Gampaha', coordinates: { latitude: 7.2008, longitude: 79.8736 } },
];

/**
 * Standard Sri Lanka Centroid (Colombo Central) for fallbacks
 */
export const DEFAULT_COLOMBO_COORDINATES = {
  latitude: 6.9271,
  longitude: 79.8612,
};

/**
 * High-precision Haversine formula calculation returning distance in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place (e.g. 1.4 km)
  return Math.round(distance * 10) / 10;
}
