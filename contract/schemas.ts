
import { z } from 'zod';
import { DataType, KeyKind, KeyScope } from './types';

export const KeyIdSchema = z.string();

export const DictionaryKeySchema = z.object({
  keyId: KeyIdSchema,
  alias: z.string(),
  path: z.string(),
  dataType: z.nativeEnum(DataType),
  kind: z.nativeEnum(KeyKind),
  scope: z.nativeEnum(KeyScope),
  tags: z.array(z.string()).optional(),
  unit: z.string().optional(),
  formatHint: z.string().optional(),
  example: z.any().optional(),
  deprecated: z.object({
    isDeprecated: z.boolean(),
    replacementKeyId: KeyIdSchema.optional(),
    note: z.string().optional(),
  }).optional(),
});

export const DictionarySchema = z.object({
  dictionaryId: z.string(),
  version: z.string(),
  domain: z.enum(['sports', 'politics', 'weather', 'finance', 'news']),
  keys: z.array(DictionaryKeySchema),
});

const BaseEnvelope = z.object({
  dictionaryId: z.string(),
  dictionaryVersion: z.string(),
  sourceId: z.string(),
  seq: z.number(),
  ts: z.number(),
});

export const SnapshotMessageSchema = BaseEnvelope.extend({
  type: z.literal('snapshot'),
  values: z.record(KeyIdSchema, z.any()),
});

export const DeltaMessageSchema = BaseEnvelope.extend({
  type: z.literal('delta'),
  changes: z.array(z.object({
    keyId: KeyIdSchema,
    value: z.any(),
    ts: z.number().optional(),
  })),
});

export const EventMessageSchema = BaseEnvelope.extend({
  type: z.literal('event'),
  eventKeyId: KeyIdSchema,
  payload: z.record(z.string(), z.any()).optional(),
  value: z.any().optional(),
});

export const LiveMessageSchema = z.discriminatedUnion('type', [
  SnapshotMessageSchema,
  DeltaMessageSchema,
  EventMessageSchema,
]);

export const BindingSchema = z.object({
  bindingId: z.string(),
  layerId: z.string(),
  targetPath: z.string(),
  keyId: KeyIdSchema,
  transforms: z.array(z.string()),
  fallback: z.any().optional(),
});
