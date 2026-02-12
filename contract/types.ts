
export type KeyId = string; // ULID format recommended

export enum DataType {
  NUMBER = 'number',
  STRING = 'string',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  NULL = 'null',
  PERCENTAGE = 'percentage'
}

export enum KeyKind {
  STATE = 'state',
  EVENT = 'event'
}

export enum KeyScope {
  GLOBAL = 'global',
  GAME = 'game',
  TEAM = 'team',
  PLAYER = 'player',
  CANDIDATE = 'candidate',
  MARKET = 'market',
  LOCATION = 'location',
  CUSTOM = 'custom'
}

export interface DictionaryKey {
  keyId: KeyId;
  alias: string;      // Human label for UI (e.g. "Home Score")
  path: string;       // Stable readable name (e.g. "score.home")
  dataType: DataType;
  kind: KeyKind;
  scope: KeyScope;
  tags?: string[];
  unit?: string;
  formatHint?: string;
  example?: any;
  deprecated?: {
    isDeprecated: boolean;
    replacementKeyId?: KeyId;
    note?: string;
  };
}

export interface Dictionary {
  dictionaryId: string;
  version: string;
  domain: 'sports' | 'politics' | 'weather' | 'finance' | 'news';
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

// Studio Bindings
export interface DataBinding {
  bindingId: string;
  layerId: string;
  targetPath: string; // e.g. "content.text"
  keyId: KeyId;
  transforms: string[];
  fallback?: any;
}
