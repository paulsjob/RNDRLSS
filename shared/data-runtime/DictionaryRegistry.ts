
import { MLB_CANON_DICTIONARY } from '../../contract/dictionaries/mlb';
import { Dictionary, DictionaryKey, KeyId } from '../../contract/types';

/**
 * Registry responsible for merging and resolving dictionaries across org scopes.
 * This is a shared utility used by both Studio and Data Engine.
 * 
 * Rules: 
 * - Must not import from feature code.
 * - Must handle both built-in (contract) and dynamic (local storage) dictionaries.
 */
class DictionaryRegistry {
  private currentOrgId: string = 'org_default';
  private listeners: Set<() => void> = new Set();

  public setOrgId(id: string) {
    if (this.currentOrgId !== id) {
      this.currentOrgId = id;
      this.notify();
    }
  }

  public getOrgId(): string {
    return this.currentOrgId;
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  /**
   * Returns all dictionaries available to the current organization.
   * Merges read-only built-in dictionaries with user-imported ones from storage.
   */
  public listDictionaries(): Dictionary[] {
    const builtin = [MLB_CANON_DICTIONARY as unknown as Dictionary];
    
    // Load imported dictionaries from Data Engine storage context
    const storageKey = `renderless:${this.currentOrgId}:dataEngine:dictionaries`;
    try {
      const importedRaw = localStorage.getItem(storageKey);
      const imported: Dictionary[] = importedRaw ? JSON.parse(importedRaw) : [];
      return [...builtin, ...imported];
    } catch (e) {
      console.warn(`[DictionaryRegistry] Failed to load dictionaries for org: ${this.currentOrgId}`, e);
      return builtin;
    }
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
