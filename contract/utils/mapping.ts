
import { MappingSpec } from '../mapping';
import { SnapshotMessage, KeyId } from '../types';
import { resolvePath } from './path';
import { applyTransforms } from '../transforms';

/**
 * Resolves a MappingSpec against a raw source object to produce a valid
 * LiveMessage snapshot for the canonical bus.
 */
export function resolveMapping(
  spec: MappingSpec, 
  sourceData: any, 
  sourceId: string
): SnapshotMessage {
  const values: Record<KeyId, any> = {};

  for (const rule of spec.rules) {
    let value: any;

    if (rule.constant !== undefined) {
      value = rule.constant;
    } else {
      const rawValue = resolvePath(sourceData, rule.fromPath);
      value = rule.transforms 
        ? applyTransforms(rawValue, rule.transforms)
        : rawValue;
    }

    values[rule.toKeyId] = value;
  }

  return {
    type: 'snapshot',
    dictionaryId: spec.outputDictionaryId,
    dictionaryVersion: '1.0.0', // Standardized for mapping outputs
    sourceId,
    seq: Date.now(),
    ts: Date.now(),
    values
  };
}
