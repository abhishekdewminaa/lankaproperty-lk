export interface CityDetail {
  name: string;
  tag: string;
  description?: string;
}

export interface DistrictLocation {
  district: string;
  province: string;
  character: string;
  landBenchmark: string;
  cities: string[];
  cityDetails?: CityDetail[];
  name?: string;
  slug?: string;
}

export const PROVINCES_OF_SRI_LANKA = [
  'Western Province',
  'Central Province',
  'Southern Province',
  'Northern Province',
  'Eastern Province',
  'North Western Province',
  'North Central Province',
  'Uva Province',
  'Sabaragamuwa Province',
] as const;

export const SRI_LANKA_DISTRICTS: DistrictLocation[] = [
  // ==========================================
  // WESTERN PROVINCE (3 Districts)
  // ==========================================
  {
    district: 'Colombo',
    province: 'Western Province',
    character: 'Capital Financial Core, Diplomatic Residences & High-Rise Waterfront',
    landBenchmark: 'LKR 16M – 28M / perch',
    cities: [
      'Colombo 01 (Fort)',
      'Colombo 02 (Union Place)',
      'Colombo 03 (Kollupitiya)',
      'Colombo 07 (Cinnamon Gardens)',
      'Rajagiriya',
      'Battaramulla',
      'Pelawatte',
      'Kotte',
      'Mount Lavinia',
      'Dehiwala',
      'Nawala',
      'Kohuwala',
    ],
    cityDetails: [
      { name: 'Colombo 07', tag: 'Cinnamon Gardens Diplomatic Enclave', description: 'Premier residential addresses, embassies, and private estates.' },
      { name: 'Colombo 03', tag: 'Kollupitiya Oceanfront & Luxury Towers', description: 'High-density commercial towers and ocean-facing penthouses.' },
      { name: 'Colombo 02', tag: 'Union Place & Beira Lake Corridor', description: 'Masterplanned mixed-use vertical towers and cultural centers.' },
      { name: 'Rajagiriya', tag: 'Waters Edge Lakefront & Sky Condos', description: 'Rapidly appreciating wetland-adjacent executive developments.' },
      { name: 'Battaramulla', tag: 'Administrative Capital Green Belts', description: 'Modernist low-density villas and lush residential compounds.' },
      { name: 'Pelawatte', tag: 'Parliamentary Suburb & Overseas Schools', description: 'Prime community hub for expatriates and institutional buyers.' },
      { name: 'Mount Lavinia', tag: 'Historic Coastal Strip & Golden Sands', description: 'Colonial heritage beachfront properties and boutique hotels.' },
      { name: 'Nawala', tag: 'Canal-Front Architect Residences', description: 'Central urban corridor known for contemporary modern architecture.' },
    ],
  },
  {
    district: 'Gampaha',
    province: 'Western Province',
    character: 'International Aviation Hub, Industrial Corridor & West Coast Beaches',
    landBenchmark: 'LKR 2.5M – 8M / perch',
    cities: [
      'Negombo',
      'Katunayake',
      'Wattala',
      'Kelaniya',
      'Ja-Ela',
      'Kiribathgoda',
      'Kadawatha',
      'Gampaha Town',
    ],
    cityDetails: [
      { name: 'Negombo', tag: 'Golden Coast & Boutique Lagoon Resorts', description: 'Premier coastal tourism hub with high-yield holiday rentals.' },
      { name: 'Katunayake', tag: 'Bandaranaike Int Airport Logistics Core', description: 'Key transit, free-trade zone, and logistics investment zone.' },
      { name: 'Wattala', tag: 'Colombo Port Proximity Commercial Corridor', description: 'Fast-growing affluent suburban strip minutes from Colombo Fort.' },
      { name: 'Kelaniya', tag: 'Sacred Riverfront & Cultural Sanctuary', description: 'Historic riverside properties alongside the Kelani River.' },
      { name: 'Ja-Ela', tag: 'Expressway Interchange Suburb', description: 'Gated residential enclaves with direct highway airport access.' },
    ],
  },
  {
    district: 'Kalutara',
    province: 'Western Province',
    character: 'Southern Coastal Gateway, Luxury Riverfronts & Rubber Plantations',
    landBenchmark: 'LKR 1.8M – 6M / perch',
    cities: [
      'Bentota',
      'Beruwala',
      'Wadduwa',
      'Panadura',
      'Kalutara North',
      'Kalutara South',
      'Aluthgama',
      'Horana',
    ],
    cityDetails: [
      { name: 'Bentota', tag: 'Bawa Architectural Riviera & Broad Beach', description: 'World-renowned coastal sanctuary for bespoke luxury villas.' },
      { name: 'Beruwala', tag: 'Historic Moorish Gem Harbour & Golden Coast', description: 'Natural sea harbors and high-end resort beachfronts.' },
      { name: 'Wadduwa', tag: 'Serene Coconut Palm Beachfront Strip', description: 'Tranquil coastal residential belt between Panadura and Kalutara.' },
      { name: 'Panadura', tag: 'Affluent Commercial Rail & Beach Terminal', description: 'Dense commercial hub with oceanfront residential parcels.' },
    ],
  },

  // ==========================================
  // CENTRAL PROVINCE (3 Districts)
  // ==========================================
  {
    district: 'Kandy',
    province: 'Central Province',
    character: 'Royal Hill Capital, UNESCO Heritage Core & Luxury Golf Estates',
    landBenchmark: 'LKR 1.5M – 5.5M / perch',
    cities: [
      'Kandy City Centre',
      'Digana',
      'Hanthana',
      'Peradeniya',
      'Kundasale',
      'Katugastota',
      'Gampola',
    ],
    cityDetails: [
      { name: 'Kandy City Centre', tag: 'Royal Lake & Sacred Temple Heritage', description: 'Heritage colonial architecture and high-value lakefront plots.' },
      { name: 'Digana', tag: 'Victoria Golf & Country Resort Enclave', description: 'Championship golf fairway villas with Victoria reservoir views.' },
      { name: 'Hanthana', tag: 'Mist Mountain Foothill Estates', description: 'Scenic mountain slope properties with cool micro-climates.' },
      { name: 'Peradeniya', tag: 'Royal Botanical Sanctuary & University Town', description: 'Serene riverbank residences near the Mahaweli River.' },
      { name: 'Kundasale', tag: 'New Mahaweli Waterfront Suburb', description: 'Rapidly emerging luxury residential district in greater Kandy.' },
    ],
  },
  {
    district: 'Matale',
    province: 'Central Province',
    character: 'Spice Valley, Knuckles Mountain Range & Cultural Triangle Core',
    landBenchmark: 'LKR 600K – 2.2M / perch',
    cities: [
      'Matale Town',
      'Dambulla',
      'Sigiriya',
      'Elkaduwa',
      'Ukuwela',
      'Rattota',
    ],
    cityDetails: [
      { name: 'Dambulla', tag: 'Agricultural Logistics & Cave Temple Hub', description: 'Central transport crossroads and UNESCO rock temple corridor.' },
      { name: 'Sigiriya', tag: 'Lion Rock Fortress Heritage Belt', description: 'Eco-resorts, safari villas, and high-growth tourism land.' },
      { name: 'Elkaduwa', tag: 'Knuckles Range Tea & Cloud Forest Estates', description: 'High-altitude eco-lodges with dramatic panoramic views.' },
      { name: 'Matale Town', tag: 'Historic Spice Valley Centre', description: 'Commercial core surrounded by historic spice plantations.' },
    ],
  },
  {
    district: 'Nuwara Eliya',
    province: 'Central Province',
    character: 'Highland Alpine Retreat, Ceylon Tea Corridors & Golf Escapes',
    landBenchmark: 'LKR 2.5M – 7.5M / perch',
    cities: [
      'Nuwara Eliya Town',
      'Pedro Valley',
      'Gregory Lake',
      'Hatton',
      'Maskeliya',
      'Hakgala',
      'Talawakele',
    ],
    cityDetails: [
      { name: 'Pedro Valley', tag: 'High-Elevation Single-Estate Tea Valleys', description: 'Exclusive tea country chalets facing Mount Pedro.' },
      { name: 'Gregory Lake', tag: 'Alpine Waterfront & Promenade Villas', description: 'Prime leisure residential strip with private boat moorings.' },
      { name: 'Nuwara Eliya Town', tag: 'Little England Tudor Heritage & Golf Course', description: 'British colonial manors adjacent to the 18-hole golf links.' },
      { name: 'Hatton', tag: 'Castlereagh Reservoir Luxury Bungalows', description: 'Secluded lakeside bungalows serviced by private floatplanes.' },
    ],
  },

  // ==========================================
  // SOUTHERN PROVINCE (3 Districts)
  // ==========================================
  {
    district: 'Galle',
    province: 'Southern Province',
    character: 'UNESCO World Heritage Fort, Golden Mile Riviera & Surfing Enclaves',
    landBenchmark: 'LKR 3.5M – 9.5M / perch',
    cities: [
      'Galle Fort',
      'Talpe',
      'Unawatuna',
      'Ahangama',
      'Hikkaduwa',
      'Habaraduwa',
      'Koggala',
      'Karapitiya',
    ],
    cityDetails: [
      { name: 'Talpe', tag: 'Golden Mile Luxury Coastal Strip', description: 'The most prestigious oceanfront villa enclave in South Asia.' },
      { name: 'Galle Fort', tag: 'UNESCO 17th Century Dutch Rampart Enclave', description: 'Rare heritage merchant houses and protected stone mansions.' },
      { name: 'Ahangama', tag: 'Global Surf Capital & Boutique Hotel Belt', description: 'Fastest-growing luxury lifestyle and hospitality corridor.' },
      { name: 'Unawatuna', tag: 'Turquoise Bay & Jungle Beach', description: 'Sheltered cove beaches with prime hospitality yields.' },
      { name: 'Hikkaduwa', tag: 'Coral Reef Coast & Vibrant Beach Strip', description: 'Pioneering marine reserve coastline with bustling nightlife.' },
      { name: 'Koggala', tag: 'Koggala Lake & Martin Wickramasinghe Trail', description: 'Pristine freshwater lake estates and private island villas.' },
    ],
  },
  {
    district: 'Matara',
    province: 'Southern Province',
    character: 'Whale Watching Coast, Surf Bays & Southern Expressway Hub',
    landBenchmark: 'LKR 2.2M – 7.0M / perch',
    cities: [
      'Mirissa',
      'Weligama',
      'Dikwella',
      'Hiriketiya',
      'Matara Town',
      'Madiha',
      'Gandara',
    ],
    cityDetails: [
      { name: 'Weligama', tag: 'Crescent Surf Bay & High-End Resorts', description: 'Expansive sandy bay host to 5-star international hotel chains.' },
      { name: 'Mirissa', tag: 'Marine Haven & Coconut Tree Hill', description: 'World-famous whale watching harbor and headland plots.' },
      { name: 'Hiriketiya', tag: 'Horseshoe Bay Bohemian Surf Enclave', description: 'High-density international boutique villas and artisan cafes.' },
      { name: 'Dikwella', tag: 'Long Golden Sand Coast & Blue Beach', description: 'Untouched ocean frontage suitable for large resort estates.' },
      { name: 'Madiha', tag: 'Pebble Point Waves & Coral Reefs', description: 'Low-key coastal enclave popular with international investors.' },
    ],
  },
  {
    district: 'Hambantota',
    province: 'Southern Province',
    character: 'Deep Water Transshipment Harbor, Safari Hinterland & Tangalle Riviera',
    landBenchmark: 'LKR 800K – 3.8M / perch',
    cities: [
      'Tangalle',
      'Hambantota Port City',
      'Tissamaharama',
      'Yala Edge',
      'Beliatta',
      'Ambalantota',
    ],
    cityDetails: [
      { name: 'Tangalle', tag: 'Mawella Bay & Seenimodera Secluded Riviera', description: 'Dramatic cliffside villas, coconut groves, and calm swimming bays.' },
      { name: 'Yala Edge', tag: 'National Wildlife Park Buffer Zone', description: 'Ultra-exclusive eco-safari camps and wilderness sanctuaries.' },
      { name: 'Hambantota Port City', tag: 'International Maritime & Industrial Hub', description: 'Deep seaport infrastructure and industrial trade logistics.' },
      { name: 'Tissamaharama', tag: 'Ancient Reservoir & Gateway to Yala', description: 'Lakeside tourist hotels and heritage paddy lands.' },
    ],
  },

  // ==========================================
  // NORTHERN PROVINCE (5 Districts)
  // ==========================================
  {
    district: 'Jaffna',
    province: 'Northern Province',
    character: 'Cultural Capital of the North, Colonial Mansions & Archipelago Coast',
    landBenchmark: 'LKR 1.2M – 4.5M / perch',
    cities: [
      'Jaffna City Centre',
      'Nallur',
      'Point Pedro',
      'Chavakachcheri',
      'Chunnakam',
      'Karainagar',
      'Valvettithurai',
    ],
    cityDetails: [
      { name: 'Nallur', tag: 'Kandaswamy Temple Sacred Cultural Core', description: 'Prestigious residential streets and traditional courtyard homes.' },
      { name: 'Jaffna City Centre', tag: 'Historic Fort & Commercial Lagoon Port', description: 'Bustling urban center with heritage Dutch colonial architecture.' },
      { name: 'Point Pedro', tag: 'Northernmost Tip of Sri Lanka & Sandy Coast', description: 'Coastal harbor town with deep maritime connections.' },
      { name: 'Karainagar', tag: 'Casuarina Beach & Causeway Islands', description: 'Shallow crystal waters and tourism expansion plots.' },
    ],
  },
  {
    district: 'Kilinochchi',
    province: 'Northern Province',
    character: 'Northern Agricultural Basin, Iranamadu Reservoir & Gateway Plain',
    landBenchmark: 'LKR 300K – 1.2M / perch',
    cities: [
      'Kilinochchi Town',
      'Paranthan',
      'Iranamadu',
      'Pallai',
      'Pooneryn',
    ],
    cityDetails: [
      { name: 'Kilinochchi Town', tag: 'A9 Highway Regional Commercial Spine', description: 'Administrative and trade hub for northern agricultural output.' },
      { name: 'Iranamadu', tag: 'Grand Water Reservoir & Green Agronomy', description: 'Fertile land parcels supported by the massive tank irrigation.' },
      { name: 'Pooneryn', tag: 'Jaffna Lagoon Causeway & Wind Farms', description: 'Strategic crossing point with significant clean energy projects.' },
    ],
  },
  {
    district: 'Mannar',
    province: 'Northern Province',
    character: 'Historic Pearl Coast, Adam’s Bridge & Wind Energy Archipelago',
    landBenchmark: 'LKR 400K – 1.5M / perch',
    cities: [
      'Mannar Town',
      'Talaimannar',
      'Pesalai',
      'Murunkan',
      'Nanattan',
    ],
    cityDetails: [
      { name: 'Mannar Town', tag: 'Portuguese Fort & Ancient Baobab Trees', description: 'Historic island hub connected to the mainland via causeway.' },
      { name: 'Talaimannar', tag: 'Adam’s Bridge Pier & Indo-Lanka Ferry Link', description: 'Direct ocean gateway towards the Indian subcontinent.' },
      { name: 'Pesalai', tag: 'Deep Sea Fisheries & Coastal Enclave', description: 'Vibrant fishing harbor on the northern coast of Mannar Island.' },
    ],
  },
  {
    district: 'Vavuniya',
    province: 'Northern Province',
    character: 'Inter-Provincial Rail Junction & Strategic Northern Logistics Gateway',
    landBenchmark: 'LKR 500K – 1.8M / perch',
    cities: [
      'Vavuniya Town',
      'Cheddikulam',
      'Nedunkeni',
      'Omanthai',
    ],
    cityDetails: [
      { name: 'Vavuniya Town', tag: 'Northern Railway & Trade Crossroads', description: 'Transit crossroads linking the North, North Central, and East.' },
      { name: 'Cheddikulam', tag: 'Agrarian Basin & Water Reserves', description: 'Broad fertile acreage suitable for sustainable agriculture.' },
    ],
  },
  {
    district: 'Mullaitivu',
    province: 'Northern Province',
    character: 'Untouched Northeast Sandy Coastline, Lagoons & Forest Reserves',
    landBenchmark: 'LKR 250K – 900K / perch',
    cities: [
      'Mullaitivu Town',
      'Puthukkudiyiruppu',
      'Oddusuddan',
      'Alampil',
    ],
    cityDetails: [
      { name: 'Mullaitivu Town', tag: 'Open Ocean Beachfront & Lagoon Estuary', description: 'Expansive untouched beaches with long-term tourism potential.' },
      { name: 'Oddusuddan', tag: 'Hardwood Forest & Inland Heritage', description: 'Dense inland forestry and indigenous heritage.' },
    ],
  },

  // ==========================================
  // EASTERN PROVINCE (3 Districts)
  // ==========================================
  {
    district: 'Trincomalee',
    province: 'Eastern Province',
    character: 'World-Class Natural Deep Harbor, Nilaveli Coral Coast & Hot Springs',
    landBenchmark: 'LKR 1.2M – 4.8M / perch',
    cities: [
      'Trincomalee Town',
      'Nilaveli Beach',
      'Uppuveli',
      'Marble Beach',
      'China Bay',
      'Sampoor',
    ],
    cityDetails: [
      { name: 'Nilaveli Beach', tag: 'Pigeon Island Marine Sanctuary Coast', description: 'World-renowned shallow white sand beaches and reef resorts.' },
      { name: 'Uppuveli', tag: 'Boutique Seaside Hospitality Strip', description: 'Bustling beachside culinary and water sports quarter.' },
      { name: 'Trincomalee Town', tag: 'Fort Frederick & Koneswaram Cliff Temple', description: 'Majestic promontory overlooking the vast Indian Ocean.' },
      { name: 'Marble Beach', tag: 'Protected Deep Natural Harbor Cove', description: 'Crystalline waters surrounded by lush coastal jungle.' },
    ],
  },
  {
    district: 'Batticaloa',
    province: 'Eastern Province',
    character: 'Singing Fish Lagoons, Pasikudah Coral Bay & Historic Dutch Fort',
    landBenchmark: 'LKR 900K – 3.5M / perch',
    cities: [
      'Batticaloa Town',
      'Pasikudah',
      'Kalkudah',
      'Kattankudy',
      'Eravur',
      'Valaichchenai',
    ],
    cityDetails: [
      { name: 'Pasikudah', tag: 'Calm Shallow Coral Bay & 5-Star Resorts', description: 'One of the safest swimming bays in the world with luxury hotels.' },
      { name: 'Kalkudah', tag: 'Wild Coconut Beachfront & Surf Points', description: 'Sprawling oceanfront acreage for private luxury estates.' },
      { name: 'Batticaloa Town', tag: 'Historic Lagoon Bridges & Island Fortress', description: 'Unique island-lagoon urban layout with rich heritage.' },
    ],
  },
  {
    district: 'Ampara',
    province: 'Eastern Province',
    character: 'Arugam Bay World Surfing Reserve, Wildlife Sanctuaries & Rice Bowl',
    landBenchmark: 'LKR 800K – 3.2M / perch',
    cities: [
      'Arugam Bay',
      'Pottuvil',
      'Ampara Town',
      'Kalmunai',
      'Lahugala',
    ],
    cityDetails: [
      { name: 'Arugam Bay', tag: 'Global Top-10 Surf Point & Bohemian Coast', description: 'Legendary point break attracts high-spending international surf travelers.' },
      { name: 'Pottuvil', tag: 'Mangrove Lagoons & Whiskey Point', description: 'Serene coastal lagoons and emerging luxury boutique lodges.' },
      { name: 'Ampara Town', tag: 'East Agro-Hub & Gal Oya National Park', description: 'Gateway to elephant boat safaris on Senanayake Samudraya.' },
    ],
  },

  // ==========================================
  // NORTH WESTERN PROVINCE (2 Districts)
  // ==========================================
  {
    district: 'Kurunegala',
    province: 'North Western Province',
    character: 'Ancient Royal Rock City, Coconut Triangle Core & Central Highway Hub',
    landBenchmark: 'LKR 800K – 3.0M / perch',
    cities: [
      'Kurunegala City',
      'Kuliyapitiya',
      'Narammala',
      'Wariyapola',
      'Pannala',
      'Mawathagama',
    ],
    cityDetails: [
      { name: 'Kurunegala City', tag: 'Elephant Rock Urban Commercial Centre', description: 'High-growth junction city connected to the Central Expressway.' },
      { name: 'Kuliyapitiya', tag: 'University Town & Coconut Plantations', description: 'Educational and commercial sub-hub surrounded by lush estates.' },
      { name: 'Pannala', tag: 'Industrial Estate & Motor Racing Enclave', description: 'Export processing zone with strong manufacturing infrastructure.' },
    ],
  },
  {
    district: 'Puttalam',
    province: 'North Western Province',
    character: 'Kalpitiya Kite Surfing Peninsula, Wilpattu Edge & Salt Lagoons',
    landBenchmark: 'LKR 700K – 2.8M / perch',
    cities: [
      'Kalpitiya',
      'Chilaw',
      'Wennappuwa',
      'Marawila',
      'Puttalam Town',
      'Dankotuwa',
    ],
    cityDetails: [
      { name: 'Kalpitiya', tag: 'Kite Surfing Capital & Dolphin Archipelago', description: 'Premier marine wind destination with thriving eco-villa investments.' },
      { name: 'Wennappuwa', tag: 'Little Italy Wealthy Residential Enclave', description: 'Prestigious suburban homes built by European diaspora investors.' },
      { name: 'Chilaw', tag: 'Munneswaram Temple & Coastal Lagoon', description: 'Historic trade town with expansive waterfront frontages.' },
      { name: 'Marawila', tag: 'Quiet Beachfront Resorts & Coconut Estates', description: 'Popular retirement and boutique hospitality coastal stretch.' },
    ],
  },

  // ==========================================
  // NORTH CENTRAL PROVINCE (2 Districts)
  // ==========================================
  {
    district: 'Anuradhapura',
    province: 'North Central Province',
    character: 'First Ancient Capital, UNESCO Sacred Stupas & Giant Hydraulic Reservoirs',
    landBenchmark: 'LKR 600K – 2.4M / perch',
    cities: [
      'Anuradhapura City',
      'Mihintale',
      'Eppawala',
      'Kekirawa',
      'Medawachchiya',
      'Talawa',
    ],
    cityDetails: [
      { name: 'Anuradhapura City', tag: 'Sacred World Heritage & Basawakkulama Lake', description: 'Spiritual heart of Sri Lanka with millennia of hydraulic engineering.' },
      { name: 'Mihintale', tag: 'Cradle of Buddhism & Mountain Monasteries', description: 'Sacred mountain sanctuary with serene natural buffer zones.' },
      { name: 'Kekirawa', tag: 'Kandalama & Kalawewa Reservoir Access', description: 'Waterfront farmland and eco-tourism development sites.' },
    ],
  },
  {
    district: 'Polonnaruwa',
    province: 'North Central Province',
    character: 'Medieval Royal Capital, Sea of Parakrama & Minneriya Elephant Corridor',
    landBenchmark: 'LKR 500K – 1.9M / perch',
    cities: [
      'Polonnaruwa City',
      'Kaduruwela',
      'Minneriya',
      'Medirigiriya',
      'Hingurakgoda',
    ],
    cityDetails: [
      { name: 'Polonnaruwa City', tag: 'Parakrama Samudra Shore & Royal Ruins', description: 'Breathtaking inland sea views and stone temple architecture.' },
      { name: 'Minneriya', tag: 'The Great Elephant Gathering Corridor', description: 'Epicenter for national park eco-safaris and wildlife lodges.' },
      { name: 'Kaduruwela', tag: 'Commercial Hub & Agricultural Market', description: 'Fast-expanding railway and merchant transport hub.' },
    ],
  },

  // ==========================================
  // UVA PROVINCE (2 Districts)
  // ==========================================
  {
    district: 'Badulla',
    province: 'Uva Province',
    character: 'Ella Tourism Phenomenon, Highland Gap, Dunhinda Falls & Tea Hills',
    landBenchmark: 'LKR 900K – 3.8M / perch',
    cities: [
      'Ella',
      'Bandarawela',
      'Badulla Town',
      'Haputale',
      'Diyatalawa',
      'Passara',
    ],
    cityDetails: [
      { name: 'Ella', tag: 'Nine Arch Bridge & Global Mountain Epicenter', description: 'World-renowned scenic mountain retreat commanding top tourist ADRs.' },
      { name: 'Bandarawela', tag: 'Health Sanatorium Climate & Fruit Orchards', description: 'Gentle temperate climate preferred for private retirement villas.' },
      { name: 'Haputale', tag: 'Lipton’s Seat & Southern Escarpment View', description: 'Sheer cliffside views dropping 1,000 meters into southern plains.' },
      { name: 'Diyatalawa', tag: 'Pine Forest Hill Station & Military Cantonment', description: 'High-altitude pine forests with serene private holiday retreats.' },
    ],
  },
  {
    district: 'Monaragala',
    province: 'Uva Province',
    character: 'Kataragama Sacred Sanctuary, Yala North & Rubber/Sugar Plains',
    landBenchmark: 'LKR 300K – 1.1M / perch',
    cities: [
      'Kataragama',
      'Wellawaya',
      'Buttala',
      'Monaragala Town',
      'Bibile',
    ],
    cityDetails: [
      { name: 'Kataragama', tag: 'Sacred Multifaith Shrine & Menik Ganga', description: 'Vibrant spiritual epicenter drawing millions of annual pilgrims.' },
      { name: 'Wellawaya', tag: 'Southern Foothills & Diyaluma Waterfall', description: 'Junction town near spectacular waterfalls and eco-farming land.' },
      { name: 'Buttala', tag: 'Sugar Plantation Valley & Wildlife Corridor', description: 'Expansive flat acreages bordered by dense wildlife sanctuaries.' },
    ],
  },

  // ==========================================
  // SABARAGAMUWA PROVINCE (2 Districts)
  // ==========================================
  {
    district: 'Ratnapura',
    province: 'Sabaragamuwa Province',
    character: 'City of Gems, Adam’s Peak (Sri Pada) Foothills & Sinharaja Rainforest',
    landBenchmark: 'LKR 600K – 2.2M / perch',
    cities: [
      'Ratnapura City',
      'Pelmadulla',
      'Balangoda',
      'Kuruwita',
      'Embilipitiya',
    ],
    cityDetails: [
      { name: 'Ratnapura City', tag: 'Global Sapphire Capital & Colonial Core', description: 'Centuries-old global trading center for rare sapphires and gemstones.' },
      { name: 'Balangoda', tag: 'Prehistoric Caves & Cool Mountain Plateau', description: 'Scenic highland estates perched along the Horton Plains ascent.' },
      { name: 'Kuruwita', tag: 'Bopath Ella Falls & Eco-Plantation Haven', description: 'Lush greenery and pristine waterfall properties on the Colombo route.' },
    ],
  },
  {
    district: 'Kegalle',
    province: 'Sabaragamuwa Province',
    character: 'Pinnawala Elephant Orphanage, Granite Boulders & Central Expressway Corridor',
    landBenchmark: 'LKR 550K – 1.9M / perch',
    cities: [
      'Kegalle Town',
      'Mawanella',
      'Pinnawala',
      'Warakapola',
      'Rambukkana',
      'Yatiyantota',
    ],
    cityDetails: [
      { name: 'Pinnawala', tag: 'Maha Oya River & Elephant Sanctuary', description: 'World-famous riverfront elephant bathing sanctuaries and resort land.' },
      { name: 'Mawanella', tag: 'Utuwankanda Cliff & Hill Country Approach', description: 'Scenic terrain nestled between rocky mountains on the Kandy highway.' },
      { name: 'Kegalle Town', tag: 'Commercial Center & Rubber Plantation Hub', description: 'Vibrant marketplace supported by extensive agro-forestry industries.' },
    ],
  },
];

export function getCitiesForDistrict(districtName: string): string[] {
  if (!districtName) return [];
  const found = SRI_LANKA_DISTRICTS.find(
    (d) => d.district.toLowerCase() === districtName.toLowerCase()
  );
  return found ? found.cities : [];
}

export function getDistrictInfo(districtName: string): DistrictLocation | undefined {
  if (!districtName) return undefined;
  return SRI_LANKA_DISTRICTS.find(
    (d) => d.district.toLowerCase() === districtName.toLowerCase()
  );
}

export function isCityInDistrict(city: string, districtName: string): boolean {
  if (!districtName || !city) return true;
  const cities = getCitiesForDistrict(districtName);
  return cities.some((c) => c.toLowerCase() === city.toLowerCase());
}

export function getDistrictsByProvince(provinceName: string): DistrictLocation[] {
  if (!provinceName || provinceName === 'all') return SRI_LANKA_DISTRICTS;
  return SRI_LANKA_DISTRICTS.filter(
    (d) => d.province.toLowerCase() === provinceName.toLowerCase()
  );
}
