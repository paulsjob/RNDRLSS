
import { MLB_CANON_DICTIONARY } from '../dictionaries/mlb';
import { validateDictionary, buildKeyIndex, buildPathIndex } from '../utils/dictionary';

/**
 * Executes a series of integrity checks on all registered canonical dictionaries.
 * This tool is designed to run during the build process or in a CI environment.
 */
export function validateAllDictionaries() {
  console.log('--- Renderless | Dictionary Sanity Check ---');
  
  // List of dictionaries to validate
  const dictionaries = [
    MLB_CANON_DICTIONARY
  ];

  let errorCount = 0;

  for (const dict of dictionaries) {
    try {
      console.log(`[Validating] ${dict.dictionaryId} (v${dict.version})...`);
      
      // 1. Zod Schema & Normalization Check
      const validated = validateDictionary(dict);
      console.log('  - Schema validation passed.');

      // 2. KeyId Uniqueness Check (Build Index)
      const keyIndex = buildKeyIndex(validated);
      console.log(`  - KeyId index built successfully (${keyIndex.size} entries).`);

      // 3. Path Uniqueness Check (Build Path Index)
      const pathIndex = buildPathIndex(validated);
      console.log(`  - CanonicalPath index built successfully (${pathIndex.size} entries).`);

      console.log(`[SUCCESS] ${dict.dictionaryId} is healthy.`);
    } catch (err: any) {
      console.error(`[FAILURE] Integrity error in dictionary: ${dict.dictionaryId}`);
      console.error(`  Reason: ${err.message}`);
      errorCount++;
    }
  }

  console.log('-------------------------------------------');
  
  if (errorCount > 0) {
    console.error(`Sanity check failed with ${errorCount} error(s).`);
    // Exit with non-zero code if in a Node environment
    // Fix: Cast process to any to access exit() in environments where process types are incomplete or browser-shimmed
    if (typeof process !== 'undefined' && (process as any).exit) {
      (process as any).exit(1);
    }
  } else {
    console.log('All dictionaries passed integrity checks.');
  }
}

// Auto-run if executed as a script
validateAllDictionaries();
