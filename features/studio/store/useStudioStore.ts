
import { create } from 'zustand';
import { 
  GraphicTemplate, 
  Layer, 
  AspectRatio, 
  LayerType, 
  LogicLayer, 
  RESOLUTIONS 
} from '../../../shared/types';
import { MLB_KEYS } from '../../../contract/dictionaries/mlb';
import { Asset } from './useAssetStore';
import { liveBus } from '../../../shared/data-runtime';
import { applyTransforms } from '../../../contract/transforms';

interface StudioState {
  // Template Data
  currentTemplate: GraphicTemplate | null;
  
  // UI & Selection State
  ui: {
    leftPanelOpen: boolean;
    rightPanelOpen: boolean;
    zoomLevel: number;
    activeResolution: keyof typeof RESOLUTIONS;
  };
  selection: {
    selectedLayerId: string | null;
  };
  
  // Actions
  setTemplate: (template: GraphicTemplate) => void;
  selectLayer: (id: string | null) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  togglePanel: (panel: 'left' | 'right') => void;
  setZoom: (zoom: number) => void;
  setResolution: (res: keyof typeof RESOLUTIONS) => void;
  
  // Template Actions
  updateTemplateMetadata: (meta: Partial<GraphicTemplate['metadata']>) => void;
  updateLayerTransform: (layerId: string, transform: Partial<Layer['transform']>) => void;
  updateLayerContent: (layerId: string, content: Partial<any>) => void;
  addLayer: (type: LayerType) => void;
  addAssetLayer: (asset: Asset) => void;
  removeLayer: (id: string) => void;
  setBinding: (layerId: string, property: string, dictionaryItemId: string | null, transform?: string) => void;
}

const INITIAL_TEMPLATE: GraphicTemplate = {
  id: 'tmpl-001',
  version: '1.0.0',
  metadata: {
    name: 'MLB Live Scorebug',
    tags: ['mlb', 'scorebug', 'live'],
    baseResolution: 'BROADCAST',
    logicLayer: LogicLayer.BUG
  },
  layers: [
    {
      id: 'layer-bg',
      type: LayerType.SHAPE,
      name: 'Background Bar',
      visible: true,
      locked: false,
      transform: { x: 40, y: 40, width: 400, height: 60, opacity: 0.9, rotation: 0 },
      content: { color: '#18181b', borderRadius: 8 }
    },
    {
      id: 'layer-home-team',
      type: LayerType.TEXT,
      name: 'Home Team',
      visible: true,
      locked: false,
      transform: { x: 60, y: 55, width: 100, height: 30, opacity: 1, rotation: 0 },
      content: { 
        text: 'LAD', 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#ffffff', 
        fontFamily: 'Inter',
        textAlign: 'center' 
      }
    },
    {
      id: 'layer-home-score',
      type: LayerType.TEXT,
      name: 'Home Score',
      visible: true,
      locked: false,
      transform: { x: 170, y: 55, width: 40, height: 30, opacity: 1, rotation: 0 },
      content: { 
        text: '0', 
        fontSize: 24, 
        fontWeight: 'black', 
        color: '#3b82f6', 
        fontFamily: 'Inter',
        textAlign: 'center' 
      }
    }
  ],
  bindings: {
    'layer-home-team.text': MLB_KEYS.TEAM_HOME_ABBR,
    'layer-home-score.text': MLB_KEYS.SCORE_HOME
  },
  overrides: {
    [AspectRatio.WIDE]: [],
    [AspectRatio.VERTICAL]: [
      { layerId: 'layer-bg', property: 'width', value: 300 },
      { layerId: 'layer-bg', property: 'x', value: 20 }
    ],
    [AspectRatio.SQUARE]: []
  }
};

export const useStudioStore = create<StudioState>((set, get) => ({
  currentTemplate: INITIAL_TEMPLATE,
  ui: {
    leftPanelOpen: true,
    rightPanelOpen: true,
    zoomLevel: 1,
    activeResolution: 'BROADCAST',
  },
  selection: {
    selectedLayerId: null,
  },

  setTemplate: (template) => set({ currentTemplate: template }),
  selectLayer: (id) => set((state) => ({ 
    selection: { ...state.selection, selectedLayerId: id } 
  })),
  
  setAspectRatio: (ratio) => set((state) => {
    const resKey = Object.entries(RESOLUTIONS).find(([_, v]) => v.ratio === ratio)?.[0] as keyof typeof RESOLUTIONS;
    return {
      ui: { ...state.ui, activeResolution: resKey || 'BROADCAST' }
    };
  }),

  togglePanel: (panel) => set((state) => ({
    ui: {
      ...state.ui,
      [panel === 'left' ? 'leftPanelOpen' : 'rightPanelOpen']: !state.ui[panel === 'left' ? 'leftPanelOpen' : 'rightPanelOpen']
    }
  })),

  setZoom: (zoom) => set((state) => ({
    ui: { ...state.ui, zoomLevel: zoom }
  })),

  setResolution: (res) => set((state) => ({
    ui: { ...state.ui, activeResolution: res }
  })),

  updateTemplateMetadata: (meta) => set((state) => ({
    currentTemplate: state.currentTemplate ? {
      ...state.currentTemplate,
      metadata: { ...state.currentTemplate.metadata, ...meta }
    } : null
  })),

  updateLayerTransform: (layerId, transform) => set((state) => {
    if (!state.currentTemplate) return state;
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.map((l) =>
          l.id === layerId ? { ...l, transform: { ...l.transform, ...transform } } : l
        ) as Layer[]
      }
    };
  }),

  updateLayerContent: (layerId, content) => set((state) => {
    if (!state.currentTemplate) return state;
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.map((l) =>
          l.id === layerId ? { ...l, content: { ...l.content, ...content } } : l
        ) as Layer[]
      }
    };
  }),

  addLayer: (type) => set((state) => {
    if (!state.currentTemplate) return state;
    const id = `layer-${Math.random().toString(36).substr(2, 9)}`;
    
    const base = {
      id,
      name: `New ${type}`,
      visible: true,
      locked: false,
      transform: { x: 100, y: 100, width: 150, height: 50, opacity: 1, rotation: 0 },
    };

    let newLayer: Layer;
    if (type === LayerType.TEXT) {
      newLayer = {
        ...base,
        type: LayerType.TEXT,
        content: { 
          text: 'New Text', 
          fontSize: 24, 
          color: '#ffffff', 
          fontFamily: 'Inter', 
          fontWeight: 'normal', 
          textAlign: 'left' 
        }
      };
    } else if (type === LayerType.SHAPE) {
      newLayer = {
        ...base,
        type: LayerType.SHAPE,
        content: { 
          color: '#3b82f6', 
          borderRadius: 0 
        }
      };
    } else {
      return state;
    }

    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: [...state.currentTemplate.layers, newLayer]
      }
    };
  }),

  addAssetLayer: (asset) => set((state) => {
    if (!state.currentTemplate) return state;

    const res = RESOLUTIONS[state.ui.activeResolution] || RESOLUTIONS.BROADCAST;
    const cw = res.width;
    const ch = res.height;
    
    // Use natural dimensions if available, otherwise default
    const iw = asset.width || 800;
    const ih = asset.height || 600;
    
    let width, height, x, y;
    
    // Requirement: If exactly 1920x1080 and canvas is 1920x1080, fill frame
    if (iw === 1920 && ih === 1080 && cw === 1920 && ch === 1080) {
      width = 1920;
      height = 1080;
      x = 0;
      y = 0;
    } else {
      // Requirement: Otherwise, fit within 80% of canvas width/height preserving aspect ratio
      const maxW = cw * 0.8;
      const maxH = ch * 0.8;
      const scale = Math.min(maxW / iw, maxH / ih);
      width = iw * scale;
      height = ih * scale;
      x = (cw - width) / 2;
      y = (ch - height) / 2;
    }

    const id = `layer-asset-${Math.random().toString(36).substr(2, 9)}`;
    const baseLayer = {
      id,
      name: asset.name,
      visible: true,
      locked: false,
      transform: { x, y, width, height, opacity: 1, rotation: 0 }
    };

    let newLayer: Layer;
    if (asset.type === 'video') {
      newLayer = {
        ...baseLayer,
        type: LayerType.VIDEO,
        content: { url: asset.url || '', loop: true, muted: true, autoPlay: true }
      };
    } else if (asset.type === 'audio') {
      newLayer = {
        ...baseLayer,
        type: LayerType.AUDIO,
        content: { url: asset.url || '', volume: 1, playbackRate: 1 }
      };
    } else {
      newLayer = {
        ...baseLayer,
        type: LayerType.IMAGE,
        content: { url: asset.url || '', fit: 'contain' }
      };
    }

    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: [...state.currentTemplate.layers, newLayer]
      },
      selection: { selectedLayerId: id }
    };
  }),

  removeLayer: (id) => set((state) => {
    if (!state.currentTemplate) return state;
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.filter((l) => l.id !== id)
      }
    };
  }),

  setBinding: (layerId, property, dictionaryItemId, transform = 'none') => set((state) => {
    if (!state.currentTemplate) return state;
    const newBindings = { ...state.currentTemplate.bindings };
    const key = `${layerId}.${property}`;
    
    if (!dictionaryItemId) {
      delete newBindings[key];
      // Restore static text if available
      const layer = state.currentTemplate.layers.find(l => l.id === layerId);
      if (layer && (layer.content as any).staticText !== undefined) {
        return {
          currentTemplate: {
            ...state.currentTemplate,
            bindings: newBindings,
            layers: state.currentTemplate.layers.map(l => 
              l.id === layerId ? { 
                ...l, 
                content: { ...l.content, text: (l.content as any).staticText } 
              } : l
            ) as Layer[]
          }
        };
      }
    } else {
      // Encode keyId and transform into the binding value to keep compatibility with Record<string, string>
      newBindings[key] = `${dictionaryItemId}|${transform}`;
    }
    
    return {
      currentTemplate: { ...state.currentTemplate, bindings: newBindings }
    };
  })
}));

/**
 * LIVE DATA SYNC MANAGER
 * Listens to the LiveBus and updates the store state for bound layers.
 * This ensures that even legacy stage components see live data updates in content.text.
 */
liveBus.subscribeAll((msg) => {
  const state = useStudioStore.getState();
  const template = state.currentTemplate;
  if (!template) return;

  // Extract changed keys
  let changedValues: Record<string, any> = {};
  if (msg.type === 'snapshot') {
    changedValues = msg.values;
  } else if (msg.type === 'delta') {
    msg.changes.forEach(c => { changedValues[c.keyId] = c.value; });
  } else {
    return; // Events ignored for simple text binding
  }

  // Find layers affected by these changes
  const updates: Record<string, Partial<any>> = {};
  let hasUpdates = false;

  Object.entries(template.bindings).forEach(([bindingKey, value]) => {
    // FIX: Explicitly cast value to string to resolve 'unknown' type error during split() call.
    const [keyId, transform] = (value as string).split('|');
    if (changedValues[keyId] !== undefined) {
      const [layerId, property] = bindingKey.split('.');
      const layer = template.layers.find(l => l.id === layerId);
      if (layer && property === 'text' && layer.type === LayerType.TEXT) {
        const rawValue = changedValues[keyId];
        const processedValue = applyTransforms(rawValue, transform === 'none' ? [] : [transform]);
        
        // Prepare content update
        const contentUpdate: any = { text: String(processedValue) };
        
        // Persist original static text if not already saved
        if ((layer.content as any).staticText === undefined) {
          contentUpdate.staticText = (layer.content as any).text;
        }

        updates[layerId] = contentUpdate;
        hasUpdates = true;
      }
    }
  });

  if (hasUpdates) {
    useStudioStore.setState({
      currentTemplate: {
        ...template,
        layers: template.layers.map(l => 
          updates[l.id] ? { ...l, content: { ...l.content, ...updates[l.id] } } : l
        ) as Layer[]
      }
    });
  }
});
