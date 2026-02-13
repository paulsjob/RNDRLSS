
import { z } from 'zod';
import { ValueType, DataDomain, KeyKind } from './types';

export const KeyIdSchema = z.string();

export const ProviderHintSchema = z.object({
  providerId: z.string(),
  path: z.string(),
  notes: z.string().optional(),
});

export const DictionaryKeySchema = z.object({
  type: z.literal('key'),
  keyId: KeyIdSchema,
  alias: z.string(),
  valueType: z.nativeEnum(ValueType),
  domain: z.nativeEnum(DataDomain),
  kind: z.nativeEnum(KeyKind),
  
  // Backwards compatibility: Accept either path or canonicalPath on input
  path: z.string().optional(),
  canonicalPath: z.string().optional(),
  
  scope: z.string(),
  dataType: z.string(),
  tags: z.array(z.string()).optional(),
  providerHints: z.array(ProviderHintSchema).optional(),
  unit: z.string().optional(),
  example: z.any().optional(),
}).transform((data) => {
  // Migration logic: Normalize path to canonicalPath if canonicalPath is missing
  const canonicalPath = data.canonicalPath || data.path || "";
  return { ...data, canonicalPath };
});

// Recursive schema for hierarchical nodes
export const DictionaryNodeSchema: z.ZodType<any> = z.lazy(() => 
  z.object({
    type: z.literal('node'),
    name: z.string(),
    children: z.array(z.union([DictionaryNodeSchema, DictionaryKeySchema])),
  })
);

export const DictionaryRootSchema = z.object({
  dictionaryId: z.string(),
  version: z.string(),
  domain: z.nativeEnum(DataDomain),
  root: DictionaryNodeSchema,
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

export const SnapshotBundleV1Schema = z.object({
  bundleVersion: z.literal("1.0.0"),
  exportedAt: z.number(),
  orgId: z.string(),
  dictionaries: z.array(DictionaryRootSchema),
  mappings: z.array(z.any()).optional(),
  graphs: z.array(z.any()).optional(),
  sampleSnapshot: SnapshotMessageSchema.optional(),
});
