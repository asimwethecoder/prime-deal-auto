/**
 * Icon Mapping Constants for Car Specifications
 * 
 * Maps specification field names to custom SVG icons in /public/icons/
 * All icons should be rendered at 24x24px with color #050B20 (primary)
 * or #405FF2 (secondary) for active/hover states.
 */

export interface IconMapping {
  /** The SVG filename (without path) */
  filename: string;
  /** Fallback Lucide icon name if SVG fails to load */
  fallback: string;
}

/**
 * Car Overview/Specifications icon mappings
 * Maps specification field labels to their corresponding SVG icons
 */
export const CAR_SPEC_ICONS: Record<string, IconMapping> = {
  // Body & Design
  'Body Type': {
    filename: 'car-muscle-design-svgrepo-com.svg',
    fallback: 'Car',
  },
  'body_type': {
    filename: 'car-muscle-design-svgrepo-com.svg',
    fallback: 'Car',
  },
  
  // Drivetrain
  'Drive Type': {
    filename: 'car-front-svgrepo-com.svg',
    fallback: 'Gauge',
  },
  'drive_type': {
    filename: 'car-front-svgrepo-com.svg',
    fallback: 'Gauge',
  },
  
  // Condition
  'Condition': {
    filename: 'condition-document-law-svgrepo-com.svg',
    fallback: 'ClipboardCheck',
  },
  'condition': {
    filename: 'condition-document-law-svgrepo-com.svg',
    fallback: 'ClipboardCheck',
  },
  
  // Engine
  'Engine Size': {
    filename: 'engine-motor-svgrepo-com.svg',
    fallback: 'Cog',
  },
  'engine_size': {
    filename: 'engine-motor-svgrepo-com.svg',
    fallback: 'Cog',
  },
  
  // Doors
  'Doors': {
    filename: 'car-door-left-4-svgrepo-com.svg',
    fallback: 'DoorOpen',
  },
  'doors': {
    filename: 'car-door-left-4-svgrepo-com.svg',
    fallback: 'DoorOpen',
  },
  
  // Cylinders
  'Cylinders': {
    filename: 'cylinder-svgrepo-com.svg',
    fallback: 'Circle',
  },
  'cylinders': {
    filename: 'cylinder-svgrepo-com.svg',
    fallback: 'Circle',
  },
  
  // Color
  'Color': {
    filename: 'color-adjustement-mode-channels-svgrepo-com.svg',
    fallback: 'Palette',
  },
  'color': {
    filename: 'color-adjustement-mode-channels-svgrepo-com.svg',
    fallback: 'Palette',
  },
  
  // Transmission
  'Transmission': {
    filename: 'gearbox-svgrepo-com.svg',
    fallback: 'Settings',
  },
  'transmission': {
    filename: 'gearbox-svgrepo-com.svg',
    fallback: 'Settings',
  },
  
  // Fuel Type
  'Fuel Type': {
    filename: 'gas-pump-fill-svgrepo-com.svg',
    fallback: 'Fuel',
  },
  'fuel_type': {
    filename: 'gas-pump-fill-svgrepo-com.svg',
    fallback: 'Fuel',
  },
  
  // Mileage
  'Mileage': {
    filename: 'speedometer-02-svgrepo-com.svg',
    fallback: 'Gauge',
  },
  'mileage': {
    filename: 'speedometer-02-svgrepo-com.svg',
    fallback: 'Gauge',
  },
  
  // Year
  'Year': {
    filename: 'calendar-svgrepo-com.svg',
    fallback: 'Calendar',
  },
  'year': {
    filename: 'calendar-svgrepo-com.svg',
    fallback: 'Calendar',
  },
};

/**
 * Get the icon mapping for a specification field
 * @param fieldName - The field name (case-insensitive, supports snake_case)
 * @returns IconMapping or undefined if no mapping exists
 */
export function getSpecIcon(fieldName: string): IconMapping | undefined {
  // Try exact match first
  if (CAR_SPEC_ICONS[fieldName]) {
    return CAR_SPEC_ICONS[fieldName];
  }
  
  // Try lowercase
  const lowerKey = fieldName.toLowerCase();
  if (CAR_SPEC_ICONS[lowerKey]) {
    return CAR_SPEC_ICONS[lowerKey];
  }
  
  // Try converting to snake_case
  const snakeKey = fieldName.toLowerCase().replace(/\s+/g, '_');
  if (CAR_SPEC_ICONS[snakeKey]) {
    return CAR_SPEC_ICONS[snakeKey];
  }
  
  return undefined;
}

/**
 * Icon styling constants
 */
export const ICON_STYLES = {
  /** Default icon size in pixels */
  size: 24,
  /** Primary color (dark navy) */
  primaryColor: '#050B20',
  /** Secondary color (accent blue) for active/hover states */
  secondaryColor: '#405FF2',
} as const;
