
import { DictionaryRootSchema } from '../schemas';
import { DictionaryRoot, DictionaryKey, KeyId, DictionaryNode } from '../types';

/**
 * Validates and normalizes a dictionary using the contract Zod schemas.
 * Ensures legacy 'path' fields are migrated to 'canonicalPath'.
 */
export function validateDictionary(input: any): DictionaryRoot {
  const result = DictionaryRootSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`[Contract] Dictionary Validation Failed: ${result.error.message}`);
  }
  return result.data;
}

export interface FlatKey extends Omit<DictionaryKey, 'type'> {
  breadcrumb: string[];
}

/**
 * Traverses the dictionary tree and returns a flat array of keys with breadcrumbs.
 */
export function flattenKeys(dict: DictionaryRoot): FlatKey[] {
  const flattened: FlatKey[] = [];

  function walk(node: DictionaryNode | DictionaryKey, breadcrumb: string[]) {
    if (node.type === 'node') {
      node.children.forEach(child => walk(child, [...breadcrumb, node.name]));
    } else {
      const { type, ...keyProps } = node;
      flattened.push({
        ...keyProps,
        breadcrumb
      });
    }
  }

  walk(dict.root, []);
  return flattened;
}

/**
 * Builds a fast lookup index keyed by KeyId (ULID).
 */
export function buildKeyIndex(dict: DictionaryRoot): Map<KeyId, DictionaryKey> {
  const index = new Map<KeyId, DictionaryKey>();
  const flat = flattenKeys(dict);
  
  flat.forEach(key => {
    // Reconstruct the key object as expected by consumers
    const dictionaryKey: DictionaryKey = { type: 'key', ...key };
    // Remove breadcrumb if it snuck in from the spread
    delete (dictionaryKey as any).breadcrumb;
    index.set(key.keyId, dictionaryKey);
  });
  
  return index;
}

/**
 * Builds a reverse lookup index keyed by canonicalPath.
 * Throws if duplicate paths are detected within the same dictionary.
 */
export function buildPathIndex(dict: DictionaryRoot): Map<string, KeyId> {
  const index = new Map<string, KeyId>();
  const flat = flattenKeys(dict);

  flat.forEach(key => {
    if (index.has(key.canonicalPath)) {
      throw new Error(`[Contract] Collision detected: Duplicate canonicalPath "${key.canonicalPath}" in dictionary "${dict.dictionaryId}"`);
    }
    index.set(key.canonicalPath, key.keyId);
  });

  return index;
}
