
export type KeyId = string; // ULID format recommended for immutability and provider-agnosticism

export enum ValueType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array'
}

export enum DataDomain {
  SPORTS = 'sports',
  WEATHER = 'weather',
  FINANCE = 'finance',
  POLITICS = 'politics',
  GENERIC = 'generic'
}

// Added KeyKind enum for UI filtering and simulation logic
export enum KeyKind {
  STATE = 'state',
  EVENT = 'event'
}

/**
 * Provider-specific metadata for mapping hints.
 * This is informational and decoupled from the stable KeyId.
 */
export interface ProviderHint {
  providerId: string; // e.g. "sportradar", "genius", "statsperform"
  path: string;       // provider-specific JSON path
  notes?: string;
}

/**
 * Leaf node in the dictionary representing a specific data point.
 */
export interface DictionaryKey {
  type: 'key';
  keyId: KeyId;       // Machine-safe, immutable, provider-agnostic
  alias: string;      // UI display name (rename-safe)
  valueType: ValueType;
  domain: DataDomain;
  // Added fields to resolve TypeScript errors in UI components
  kind: KeyKind;      
  path: string;       // JSON path for simulator and raw data resolution
  scope: string;      // Categorization for UI grouping
  dataType: string;   // UI-friendly type string
  tags?: string[];
  providerHints?: ProviderHint[];
  unit?: string;
  example?: any;
}

/**
 * Branch node used for grouping keys into folders/categories.
 */
export interface DictionaryNode {
  type: 'node';
  name: string;
  children: (DictionaryNode | DictionaryKey)[];
}

/**
 * Root container for a Canonical Data Dictionary.
 */
export interface DictionaryRoot {
  dictionaryId: string;
  version: string;
  domain: DataDomain;
  root: DictionaryNode;
}

/**
 * Mapping Rule for converting raw data to canonical keys.
 */
export interface MappingRule {
  fromPath: string;
  toKeyId: KeyId;
  transforms?: string[];
  constant?: any;
}

/**
 * Specification for a data mapping engine.
 */
export interface MappingSpec {
  mappingId: string;
  inputSchemaId: string;
  outputDictionaryId: string;
  rules: MappingRule[];
}

/**
 * Legacy/Compatibility types (retained for shared layer stability)
 */
export interface Dictionary extends DictionaryRoot {
  // Flat view helper for legacy logic
  keys: DictionaryKey[]; 
}

// Message Envelopes
export interface BaseMessage {
  dictionaryId: string;
  dictionaryVersion: string;
  sourceId: string;
  seq: number;
  ts: number; // Unix ms
}

export interface SnapshotMessage extends BaseMessage {
  type: 'snapshot';
  values: Record<KeyId, any>;
}

export interface DeltaMessage extends BaseMessage {
  type: 'delta';
  changes: Array<{
    keyId: KeyId;
    value: any;
    ts?: number;
  }>;
}

export interface EventMessage extends BaseMessage {
  type: 'event';
  eventKeyId: KeyId;
  payload?: Record<string, any>;
  value?: any;
}

export type LiveMessage = SnapshotMessage | DeltaMessage | EventMessage;

// ITEM 03: Snapshot Bundle V1
export interface SnapshotBundleV1 {
  bundleVersion: "1.0.0";
  exportedAt: number;
  orgId: string;
  dictionaries: DictionaryRoot[];
  mappings: MappingSpec[]; // Added to fix SnapshotManager error
  graphs: any[];           // Added to fix SnapshotManager error
  sampleSnapshot?: SnapshotMessage;
}
