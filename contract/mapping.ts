
import { KeyId } from './types';

export interface MappingRule {
  fromPath: string; // JSONPath-like string from the provider source
  toKeyId: KeyId;   // ULID from the canonical dictionary
  transforms?: string[];
  constant?: any;
}

export interface MappingSpec {
  mappingId: string;
  inputSchemaId: string;      // e.g. "provider.sportradar.mlb.v8"
  outputDictionaryId: string; // e.g. "canon.sports.baseball.v1"
  rules: MappingRule[];
}
