/**
 * Shared utility for parsing amenitiesJson across the application
 * Ensures consistent parsing logic and error handling
 */

export class AmenitiesParser {
  /**
   * Parse amenitiesJson string into structured object
   * @param {string} amenitiesJson - JSON string containing equipment and amenities
   * @returns {Object} - { equipment: string[], amenities: string[] }
   */
  static parse(amenitiesJson) {
    try {
      if (!amenitiesJson || amenitiesJson.trim() === '') {
        return { equipment: [], amenities: [] };
      }

      const parsed = JSON.parse(amenitiesJson);
      
      return {
        equipment: Array.isArray(parsed.equipment) ? parsed.equipment : [],
        amenities: Array.isArray(parsed.amenities) ? parsed.amenities : []
      };
    } catch (e) {
      console.error('Error parsing amenitiesJson:', e);
      return { equipment: [], amenities: [] };
    }
  }

  /**
   * Stringify amenities object to JSON
   * @param {string[]} equipment - Array of equipment items
   * @param {string[]} amenities - Array of amenity items
   * @returns {string} - JSON string
   */
  static stringify(equipment = [], amenities = []) {
    return JSON.stringify({
      equipment: Array.isArray(equipment) ? equipment : [],
      amenities: Array.isArray(amenities) ? amenities : []
    }, null, 2);
  }

  /**
   * Validate amenities data
   * @param {Object} amenities - { equipment: string[], amenities: string[] }
   * @returns {boolean} - true if valid
   */
  static validate(amenities) {
    if (!amenities || typeof amenities !== 'object') {
      return false;
    }

    const hasValidEquipment = Array.isArray(amenities.equipment);
    const hasValidAmenities = Array.isArray(amenities.amenities);

    return hasValidEquipment && hasValidAmenities;
  }
}

export default AmenitiesParser;
