/**
 * Default amenities configuration for room types
 * Use this to ensure consistent amenities across all rooms
 */

// Quick equipment shown on room card (room-specific features)
export const DEFAULT_QUICK_EQUIPMENT = [
  'Climatisation',
  'Télévision',
  'Bureau de travail'
];

// Quick amenities shown on room card (general hotel features)
export const DEFAULT_QUICK_AMENITIES = [
  'Wi-Fi gratuit',
  'Réception 24h/24'
];

// Detailed amenities shown in modal (room-specific features)
export const DEFAULT_AMENITIES = {
  equipment: [
    'Climatisation',
    'Télévision',
    'Bureau de travail'
  ],
  amenities: [
    'Eau chaude',
    'Serviettes et draps',
    'Savon et papier toilette'
  ]
};

/**
 * Get default amenities as JSON string
 * @returns {string} - JSON string for amenitiesJson field
 */
export const getDefaultAmenitiesJson = () => {
  return JSON.stringify(DEFAULT_AMENITIES, null, 2);
};

/**
 * Get default quick equipment as JSON string
 * @returns {string} - JSON string for quickEquipment field
 */
export const getDefaultQuickEquipmentJson = () => {
  return JSON.stringify(DEFAULT_QUICK_EQUIPMENT);
};

/**
 * Get default quick amenities as JSON string
 * @returns {string} - JSON string for quickAmenities field
 */
export const getDefaultQuickAmenitiesJson = () => {
  return JSON.stringify(DEFAULT_QUICK_AMENITIES);
};

/**
 * Common amenities in French for easy selection
 */
export const COMMON_EQUIPMENT = [
  'Bureau de travail',
  'Television',
  'Wifi',
  'Climatisation',
  'Mini-bar',
  'Coffre-fort',
  'Téléphone',
  'Radio réveil',
  'Fer à repasser',
  'Sèche-cheveux'
];

export const COMMON_AMENITIES = [
  'Eau chaude',
  'Serviettes et draps',
  'Savon et papier toilette',
  'Shampoing',
  'Gel douche',
  'Peignoir',
  'Chaussons',
  'Miroir grossissant',
  'Baignoire',
  'Douche'
];

export default {
  DEFAULT_AMENITIES,
  DEFAULT_QUICK_EQUIPMENT,
  DEFAULT_QUICK_AMENITIES,
  getDefaultAmenitiesJson,
  getDefaultQuickEquipmentJson,
  getDefaultQuickAmenitiesJson,
  COMMON_EQUIPMENT,
  COMMON_AMENITIES
};
