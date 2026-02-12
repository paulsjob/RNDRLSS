
import { useSyncExternalStore } from 'react';
import { liveBus, LiveValueRecord } from './index';
import { KeyId } from '../../contract/types';

/**
 * Subscribes to a specific live data key with high efficiency.
 * Uses React 18's useSyncExternalStore to prevent tearing and memory leaks.
 */
export const useLiveValue = (keyId: KeyId | null): LiveValueRecord | null => {
  return useSyncExternalStore(
    liveBus.subscribe,
    () => (keyId ? liveBus.getValue(keyId) : null),
    () => null
  );
};

/**
 * Subscribes to multiple live data keys.
 */
export const useLiveValues = (keyIds: KeyId[]): Record<KeyId, LiveValueRecord | null> => {
  return useSyncExternalStore(
    liveBus.subscribe,
    () => {
      const results: Record<KeyId, LiveValueRecord | null> = {};
      keyIds.forEach((id) => {
        results[id] = liveBus.getValue(id);
      });
      return results;
    },
    () => ({})
  );
};
