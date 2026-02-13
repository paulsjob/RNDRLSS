
/**
 * Safely resolves a path like "game.home.score" or "players[0].name" 
 * against a raw JSON object.
 * 
 * This is a contract-level utility used for mapping raw provider data
 * to the canonical Renderless bus.
 */
export const resolvePath = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  
  // Handle array access in path: players[0].name -> players.0.name
  const cleanPath = path.replace(/\[(\d+)\]/g, '.$1');
  
  return cleanPath.split('.').reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : undefined;
  }, obj);
};
