
import { MLB_CANON_DICTIONARY } from '../../contract/dictionaries/mlb';
import { Dictionary, DictionaryKey, KeyId } from '../../contract/types';

/**
 * Registry responsible for merging and resolving dictionaries across org scopes.
 * This is a shared utility used by both Studio and Data Engine.
 */
class DictionaryRegistry {
  private currentOrgId: string = 'org_default';

  public setOrgId(id: string) {
    this.currentOrgId = id;
  }

  public getOrgId(): string {
    return this.currentOrgId;
  }

  /**
   * Returns all dictionaries available to the current organization.
   * Merges read-only built-in dictionaries with user-imported ones from storage.
   */
  public listDictionaries(): Dictionary[] {
    const builtin = [MLB_CANON_DICTIONARY as unknown as Dictionary];
    
    // Load imported dictionaries from Data Engine storage
    const storageKey = `renderless:${this.currentOrgId}:dataEngine:dictionaries`;
    const importedRaw = localStorage.getItem(storageKey);
    const imported: Dictionary[] = importedRaw ? JSON.parse(importedRaw) : [];
    
    return [...builtin, ...imported];
  }

  /**
   * Safely look up a key and its parent dictionary across all sources.
   */
  public getKey(keyId: KeyId): { key: DictionaryKey; dictionary: Dictionary } | null {
    const dicts = this.listDictionaries();
    for (const dict of dicts) {
      const key = dict.keys.find(k => k.keyId === keyId);
      if (key) return { key, dictionary: dict };
    }
    return null;
  }

  /**
   * Get a specific dictionary by ID and Version.
   */
  public getDictionary(dictionaryId: string, version: string): Dictionary | null {
    return this.listDictionaries().find(d => 
      d.dictionaryId === dictionaryId && d.version === version
    ) || null;
  }
}

export const dictionaryRegistry = new DictionaryRegistry();
