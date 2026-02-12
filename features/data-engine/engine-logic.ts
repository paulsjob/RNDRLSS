
import { DataField, DataEntity } from '../../shared/types';

/**
 * Safely resolves a path like "game.home.score" or "players[0].name" 
 * against a raw JSON object.
 */
export const resolvePath = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  
  // Handle array access in path: players[0].name -> players.0.name
  const cleanPath = path.replace(/\[(\d+)\]/g, '.$1');
  
  return cleanPath.split('.').reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : undefined;
  }, obj);
};

/**
 * Normalizes values based on data types for consistent display.
 */
export const normalizeValue = (value: any, type: string): string => {
  if (value === undefined || value === null) return '—';
  
  switch (type) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'percentage':
      return typeof value === 'number' ? `${value.toFixed(1)}%` : `${value}%`;
    case 'boolean':
      return value ? 'YES' : 'NO';
    default:
      return String(value);
  }
};
