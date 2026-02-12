
import { z } from 'zod';
import { LayerType, LogicLayer, AspectRatio } from './types';

export const TransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  opacity: z.number().min(0).max(1),
  rotation: z.number(),
});

export const BaseLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  transform: TransformSchema,
  visible: z.boolean(),
  locked: z.boolean(),
});

export const TextLayerSchema = BaseLayerSchema.extend({
  type: z.literal(LayerType.TEXT),
  content: z.object({
    text: z.string(),
    fontFamily: z.string(),
    fontSize: z.number(),
    fontWeight: z.union([z.string(), z.number()]),
    color: z.string(),
    textAlign: z.enum(['left', 'center', 'right']),
  }),
});

export const ImageLayerSchema = BaseLayerSchema.extend({
  type: z.literal(LayerType.IMAGE),
  content: z.object({
    url: z.string().url(),
    fit: z.enum(['cover', 'contain', 'fill']),
  }),
});

export const ShapeLayerSchema = BaseLayerSchema.extend({
  type: z.literal(LayerType.SHAPE),
  content: z.object({
    color: z.string(),
    borderRadius: z.number(),
    strokeWidth: z.number().optional(),
    strokeColor: z.string().optional(),
  }),
});

export const LayerSchema = z.discriminatedUnion('type', [
  TextLayerSchema,
  ImageLayerSchema,
  ShapeLayerSchema,
  // Add others as they are fleshed out
  z.object({ id: z.string(), type: z.literal(LayerType.VIDEO) }).passthrough() as any,
  z.object({ id: z.string(), type: z.literal(LayerType.ANIMATION) }).passthrough() as any,
  z.object({ id: z.string(), type: z.literal(LayerType.AUDIO) }).passthrough() as any,
]);

export const GraphicTemplateSchema = z.object({
  id: z.string(),
  version: z.string(),
  metadata: z.object({
    name: z.string(),
    tags: z.array(z.string()),
    baseResolution: z.string(),
    logicLayer: z.nativeEnum(LogicLayer),
  }),
  layers: z.array(LayerSchema),
  bindings: z.record(z.string(), z.string()),
  overrides: z.record(z.nativeEnum(AspectRatio), z.array(z.object({
    layerId: z.string(),
    property: z.string(),
    value: z.any(),
  }))),
});
