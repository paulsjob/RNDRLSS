
export enum AspectRatio {
  WIDE = '16:9',
  VERTICAL = '9:16',
  SQUARE = '1:1'
}

export enum LayerType {
  TEXT = 'text',
  IMAGE = 'image',
  SHAPE = 'shape',
  GROUP = 'group'
}

export enum LogicLayer {
  BUG = 'bug',
  LOWER_THIRD = 'lower_third',
  FULLSCREEN = 'fullscreen',
  OVERLAY = 'overlay'
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation?: number;
}

export interface Animation {
  in: { type: 'fade' | 'slide-left' | 'mask-reveal'; duration: number };
  out: { type: 'fade' | 'slide-right'; duration: number };
  refresh: { type: 'pulse' | 'flash'; duration: number };
}

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  transform: Transform;
  content: Record<string, any>;
  animation?: Animation;
}

export interface ResponsiveOverride {
  layerId: string;
  property: string;
  value: any;
}

export interface DataBinding {
  dataPath: string;
  transform?: string;
  fallback?: string;
}

export interface Template {
  id: string;
  version: string;
  metadata: {
    name: string;
    tags: string[];
    baseAspectRatio: AspectRatio;
    logicLayer: LogicLayer;
  };
  layers: Layer[];
  bindings: Record<string, DataBinding>; // Key format: "layerId.property"
  responsiveOverrides: {
    vertical: ResponsiveOverride[];
    square: ResponsiveOverride[];
  };
}

export interface LiveGraphicInstance {
  id: string;
  templateId: string;
  logicLayer: LogicLayer;
  dataSnapshot: Record<string, any>;
  onAir: boolean;
  aspectRatio: AspectRatio;
  timestamp: number;
}

// Data Dictionary Schema
export interface DataField {
  key: string;
  label: string;
  dataType: 'number' | 'string' | 'image_url' | 'percentage';
  sourcePath: string;
}

export interface DataEntity {
  type: 'player' | 'team' | 'game' | 'league';
  fields: DataField[];
}
