
export enum AspectRatio {
  WIDE = '16:9',
  VERTICAL = '9:16',
  SQUARE = '1:1',
  PORTRAIT = '4:5'
}

export const RESOLUTIONS = {
  BROADCAST: { width: 1920, height: 1080, ratio: AspectRatio.WIDE },
  SOCIAL_SQUARE: { width: 1080, height: 1080, ratio: AspectRatio.SQUARE },
  SOCIAL_VERTICAL: { width: 1080, height: 1920, ratio: AspectRatio.VERTICAL },
  SOCIAL_PORTRAIT: { width: 1080, height: 1350, ratio: AspectRatio.PORTRAIT },
} as const;

export enum LayerType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  ANIMATION = 'animation',
  AUDIO = 'audio',
  SHAPE = 'shape'
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
  rotation: number;
}

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  transform: Transform;
  visible: boolean;
  locked: boolean;
}

export interface TextLayer extends BaseLayer {
  type: LayerType.TEXT;
  content: {
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string | number;
    color: string;
    textAlign: 'left' | 'center' | 'right';
  };
}

export interface ImageLayer extends BaseLayer {
  type: LayerType.IMAGE;
  content: {
    url: string;
    fit: 'cover' | 'contain' | 'fill';
  };
}

export interface VideoLayer extends BaseLayer {
  type: LayerType.VIDEO;
  content: {
    url: string;
    loop: boolean;
    muted: boolean;
    autoPlay: boolean;
  };
}

export interface AnimationLayer extends BaseLayer {
  type: LayerType.ANIMATION;
  content: {
    source: string; // URL to Lottie/JSON
    playSpeed: number;
    trigger: 'on-load' | 'manual' | 'data-event';
  };
}

export interface AudioLayer extends BaseLayer {
  type: LayerType.AUDIO;
  content: {
    url: string;
    volume: number;
    playbackRate: number;
  };
}

export interface ShapeLayer extends BaseLayer {
  type: LayerType.SHAPE;
  content: {
    color: string;
    borderRadius: number;
    strokeWidth?: number;
    strokeColor?: string;
  };
}

export type Layer = TextLayer | ImageLayer | VideoLayer | AnimationLayer | AudioLayer | ShapeLayer;

export interface DictionaryItem {
  id: string;
  key: string; // Human-readable label
  category: string; // Hierarchical category, e.g., "Game Info > Score"
  providerPath: string; // Raw path for lookup in the snapshot
  dataType: 'string' | 'number' | 'image' | 'boolean' | 'percentage';
}

export interface DataAdapter {
  id: string;
  name: string;
  description: string;
  getDictionary(): DictionaryItem[];
  fetchLive(): Promise<Record<string, any>>;
}

export interface ResponsiveOverride {
  layerId: string;
  property: string;
  value: any;
}

export interface GraphicTemplate {
  id: string;
  version: string;
  metadata: {
    name: string;
    tags: string[];
    baseResolution: keyof typeof RESOLUTIONS;
    logicLayer: LogicLayer;
  };
  layers: Layer[];
  bindings: Record<string, string>; // format: "layerId.property" -> "DictionaryItem.id"
  overrides: Record<AspectRatio, ResponsiveOverride[]>;
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

// Data Dictionary Schema for Logic Engine
export interface DataField {
  key: string;
  label: string;
  dataType: 'number' | 'string' | 'image_url' | 'percentage' | 'image' | 'boolean';
  sourcePath: string;
}

export interface DataEntity {
  type: 'player' | 'team' | 'game' | 'league' | string;
  fields: DataField[];
}
