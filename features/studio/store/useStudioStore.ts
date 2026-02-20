
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
    editingLayerId: string | null; // Track text editing mode
    lastPulseLayerId: string | null; // Track visual pulse on data update
    alignTo: 'selection' | 'canvas';
  };
  selection: {
    selectedLayerIds: string[];
  };
  
  // Actions
  setTemplate: (template: GraphicTemplate) => void;
  selectLayer: (id: string | null, multi?: boolean, range?: boolean) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  togglePanel: (panel: 'left' | 'right') => void;
  setZoom: (zoom: number) => void;
  setResolution: (res: keyof typeof RESOLUTIONS) => void;
  setAlignTo: (alignTo: 'selection' | 'canvas') => void;
  setEditingLayerId: (id: string | null) => void; // Toggle text edit mode
  
  // Template Actions
  updateTemplateMetadata: (meta: Partial<GraphicTemplate['metadata']>) => void;
  updateLayerTransform: (layerId: string, transform: Partial<Layer['transform']>) => void;
  updateLayerContent: (layerId: string, content: Partial<any>) => void;
  addLayer: (type: LayerType) => void;
  addAssetLayer: (asset: Asset) => void;
  removeLayer: (id: string) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  setBinding: (layerId: string, property: string, dictionaryItemId: string | null, transform?: string) => void;
  
  // Alignment Actions
  alignLayers: (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom', relativeTo: 'selection' | 'comp') => void;
  distributeLayers: (direction: 'horizontal' | 'vertical') => void;
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
      transform: { x: 40, y: 40, width: 560, height: 60, opacity: 0.9, rotation: 0 },
      content: { color: '#18181b', borderRadius: 8 }
    },
    {
      id: 'layer-home-team',
      type: LayerType.TEXT,
      name: 'Home Team',
      visible: true,
      locked: false,
      transform: { x: 60, y: 55, width: 80, height: 30, opacity: 1, rotation: 0 },
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
      transform: { x: 150, y: 55, width: 40, height: 30, opacity: 1, rotation: 0 },
      content: { 
        text: '0', 
        fontSize: 24, 
        fontWeight: 'black', 
        color: '#3b82f6', 
        fontFamily: 'Inter',
        textAlign: 'center' 
      }
    },
    {
      id: 'layer-game-clock',
      type: LayerType.TEXT,
      name: 'Clock',
      visible: true,
      locked: false,
      transform: { x: 210, y: 55, width: 120, height: 30, opacity: 1, rotation: 0 },
      content: { 
        text: '00:00', 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#fbbf24', 
        fontFamily: 'Inter',
        textAlign: 'center' 
      }
    },
    {
      id: 'layer-away-score',
      type: LayerType.TEXT,
      name: 'Away Score',
      visible: true,
      locked: false,
      transform: { x: 350, y: 55, width: 40, height: 30, opacity: 1, rotation: 0 },
      content: { 
        text: '0', 
        fontSize: 24, 
        fontWeight: 'black', 
        color: '#3b82f6', 
        fontFamily: 'Inter',
        textAlign: 'center' 
      }
    },
    {
      id: 'layer-away-team',
      type: LayerType.TEXT,
      name: 'Away Team',
      visible: true,
      locked: false,
      transform: { x: 410, y: 55, width: 80, height: 30, opacity: 1, rotation: 0 },
      content: { 
        text: 'NYY', 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#ffffff', 
        fontFamily: 'Inter',
        textAlign: 'center' 
      }
    }
  ],
  bindings: {
    'layer-home-team.text': MLB_KEYS.TEAM_HOME_ABBR,
    'layer-away-team.text': MLB_KEYS.TEAM_AWAY_ABBR
  },
  overrides: {
    [AspectRatio.WIDE]: [],
    [AspectRatio.VERTICAL]: [
      { layerId: 'layer-bg', property: 'width', value: 300 },
      { layerId: 'layer-bg', property: 'x', value: 20 }
    ],
    [AspectRatio.SQUARE]: [],
    [AspectRatio.PORTRAIT]: []
  }
};

export const useStudioStore = create<StudioState>((set, get) => ({
  currentTemplate: INITIAL_TEMPLATE,
  ui: {
    leftPanelOpen: true,
    rightPanelOpen: true,
    zoomLevel: 1,
    activeResolution: 'BROADCAST',
    editingLayerId: null,
    lastPulseLayerId: null,
    alignTo: 'selection',
  },
  selection: {
    selectedLayerIds: [],
  },

  setTemplate: (template) => set({ currentTemplate: template }),
  
  selectLayer: (id, multi = false, range = false) => set((state) => {
    if (!id) return { selection: { selectedLayerIds: [] } };
    
    let newIds: string[] = [...state.selection.selectedLayerIds];
    
    if (range && state.currentTemplate && newIds.length > 0) {
      const allIds = state.currentTemplate.layers.map(l => l.id);
      const lastId = newIds[newIds.length - 1];
      const startIdx = allIds.indexOf(lastId);
      const endIdx = allIds.indexOf(id);
      const rangeIds = allIds.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
      newIds = Array.from(new Set([...newIds, ...rangeIds]));
    } else if (multi) {
      if (newIds.includes(id)) {
        newIds = newIds.filter(i => i !== id);
      } else {
        newIds.push(id);
      }
    } else {
      newIds = [id];
    }
    
    return { selection: { selectedLayerIds: newIds } };
  }),
  
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

  setAlignTo: (alignTo) => set((state) => ({
    ui: { ...state.ui, alignTo }
  })),

  setEditingLayerId: (id) => set((state) => ({
    ui: { ...state.ui, editingLayerId: id }
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
    
    const iw = asset.width || 800;
    const ih = asset.height || 600;
    
    let width, height, x, y;
    
    if ((iw === 1920 && ih === 1080) || (iw === cw && ih === ch)) {
      width = cw;
      height = ch;
      x = 0;
      y = 0;
    } else {
      const maxW = cw * 0.6;
      const maxH = ch * 0.6;
      const scaleToFit = Math.min(maxW / iw, maxH / ih);
      width = iw * scaleToFit;
      height = ih * scaleToFit;
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
      selection: { selectedLayerIds: [id] }
    };
  }),

  removeLayer: (id) => set((state) => {
    if (!state.currentTemplate) return state;
    const isEditing = state.ui.editingLayerId === id;
    
    return {
      ui: {
        ...state.ui,
        editingLayerId: isEditing ? null : state.ui.editingLayerId
      },
      selection: {
        selectedLayerIds: state.selection.selectedLayerIds.filter(sid => sid !== id)
      },
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.filter((l) => l.id !== id)
      }
    };
  }),

  moveLayer: (id, direction) => set((state) => {
    if (!state.currentTemplate) return state;
    const layers = [...state.currentTemplate.layers];
    const index = layers.findIndex(l => l.id === id);
    if (index === -1) return state;

    const newIndex = direction === 'up' ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= layers.length) return state;

    const [removed] = layers.splice(index, 1);
    layers.splice(newIndex, 0, removed);

    return {
      currentTemplate: { ...state.currentTemplate, layers }
    };
  }),

  toggleLayerVisibility: (id) => set((state) => {
    if (!state.currentTemplate) return state;
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.map(l => 
          l.id === id ? { ...l, visible: !l.visible } : l
        ) as Layer[]
      }
    };
  }),

  toggleLayerLock: (id) => set((state) => {
    if (!state.currentTemplate) return state;
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.map(l => 
          l.id === id ? { ...l, locked: !l.locked } : l
        ) as Layer[]
      }
    };
  }),

  alignLayers: (mode, relativeTo) => set((state) => {
    if (!state.currentTemplate || state.selection.selectedLayerIds.length === 0) return state;
    
    const res = RESOLUTIONS[state.ui.activeResolution];
    const layers = [...state.currentTemplate.layers];
    const selectedIds = state.selection.selectedLayerIds;
    const selectedLayers = layers.filter(l => selectedIds.includes(l.id));

    let bounds = {
      minX: Math.min(...selectedLayers.map(l => l.transform.x)),
      maxX: Math.max(...selectedLayers.map(l => l.transform.x + l.transform.width)),
      minY: Math.min(...selectedLayers.map(l => l.transform.y)),
      maxY: Math.max(...selectedLayers.map(l => l.transform.y + l.transform.height)),
    };

    if (relativeTo === 'comp') {
      bounds = { minX: 0, maxX: res.width, minY: 0, maxY: res.height };
    }

    const updatedLayers = layers.map(l => {
      if (!selectedIds.includes(l.id)) return l;
      const t = { ...l.transform };
      
      switch (mode) {
        case 'left': t.x = bounds.minX; break;
        case 'right': t.x = bounds.maxX - t.width; break;
        case 'center': t.x = bounds.minX + (bounds.maxX - bounds.minX) / 2 - t.width / 2; break;
        case 'top': t.y = bounds.minY; break;
        case 'bottom': t.y = bounds.maxY - t.height; break;
        case 'middle': t.y = bounds.minY + (bounds.maxY - bounds.minY) / 2 - t.height / 2; break;
      }
      return { ...l, transform: t };
    });

    return { currentTemplate: { ...state.currentTemplate, layers: updatedLayers as Layer[] } };
  }),

  distributeLayers: (direction) => set((state) => {
    if (!state.currentTemplate || state.selection.selectedLayerIds.length < 3) return state;
    
    const layers = [...state.currentTemplate.layers];
    const selectedIds = state.selection.selectedLayerIds;
    const selectedLayers = layers.filter(l => selectedIds.includes(l.id));

    if (direction === 'horizontal') {
      const sorted = [...selectedLayers].sort((a, b) => a.transform.x - b.transform.x);
      const minX = sorted[0].transform.x;
      const maxX = sorted[sorted.length - 1].transform.x + sorted[sorted.length - 1].transform.width;
      const totalWidth = sorted.reduce((sum, l) => sum + l.transform.width, 0);
      const gap = (maxX - minX - totalWidth) / (sorted.length - 1);
      
      let currentX = minX;
      const updatedLayers = layers.map(l => {
        const sIdx = sorted.findIndex(sl => sl.id === l.id);
        if (sIdx === -1) return l;
        const updated = { ...l, transform: { ...l.transform, x: currentX } };
        currentX += l.transform.width + gap;
        return updated;
      });
      return { currentTemplate: { ...state.currentTemplate, layers: updatedLayers as Layer[] } };
    } else {
      const sorted = [...selectedLayers].sort((a, b) => a.transform.y - b.transform.y);
      const minY = sorted[0].transform.y;
      const maxY = sorted[sorted.length - 1].transform.y + sorted[sorted.length - 1].transform.height;
      const totalHeight = sorted.reduce((sum, l) => sum + l.transform.height, 0);
      const gap = (maxY - minY - totalHeight) / (sorted.length - 1);
      
      let currentY = minY;
      const updatedLayers = layers.map(l => {
        const sIdx = sorted.findIndex(sl => sl.id === l.id);
        if (sIdx === -1) return l;
        const updated = { ...l, transform: { ...l.transform, y: currentY } };
        currentY += l.transform.height + gap;
        return updated;
      });
      return { currentTemplate: { ...state.currentTemplate, layers: updatedLayers as Layer[] } };
    }
  }),

  setBinding: (layerId, property, dictionaryItemId, transform = 'none') => set((state) => {
    if (!state.currentTemplate) return state;
    const newBindings = { ...state.currentTemplate.bindings };
    const key = `${layerId}.${property}`;
    
    if (!dictionaryItemId) {
      delete newBindings[key];
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
      newBindings[key] = `${dictionaryItemId}|${transform}`;
    }
    
    return {
      currentTemplate: { ...state.currentTemplate, bindings: newBindings }
    };
  })
}));

/**
 * LIVE DATA SYNC MANAGER
 */
liveBus.subscribeAll((msg) => {
  const state = useStudioStore.getState();
  const template = state.currentTemplate;
  if (!template) return;

  let changedValues: Record<string, any> = {};
  if (msg.type === 'snapshot') {
    changedValues = msg.values;
  } else if (msg.type === 'delta') {
    msg.changes.forEach(c => { changedValues[c.keyId] = c.value; });
  } else {
    return;
  }

  const updates: Record<string, Partial<any>> = {};
  let hasUpdates = false;
  let pulseLayerId: string | null = null;

  Object.entries(template.bindings).forEach(([bindingKey, value]) => {
    const parts = (value as string).split('|');
    const keyId = parts[0];
    const transform = parts[1] || 'none';
    
    if (changedValues[keyId] !== undefined) {
      const [layerId, property] = bindingKey.split('.');
      const layer = template.layers.find(l => l.id === layerId);
      
      if (layer && property === 'text' && layer.type === LayerType.TEXT && state.ui.editingLayerId !== layer.id) {
        const rawValue = changedValues[keyId];
        const processedValue = applyTransforms(rawValue, transform === 'none' ? [] : [transform]);
        
        const contentUpdate: any = { text: String(processedValue) };
        if ((layer.content as any).staticText === undefined) {
          contentUpdate.staticText = (layer.content as any).text;
        }

        updates[layerId] = contentUpdate;
        hasUpdates = true;
        pulseLayerId = layerId; // Trigger visual payoff
      }
    }
  });

  if (hasUpdates) {
    useStudioStore.setState((s) => ({
      ui: { ...s.ui, lastPulseLayerId: pulseLayerId },
      currentTemplate: {
        ...template,
        layers: template.layers.map(l => 
          updates[l.id] ? { ...l, content: { ...l.content, ...updates[l.id] } } : l
        ) as Layer[]
      }
    }));

    // Reset pulse after duration
    setTimeout(() => {
      useStudioStore.setState(s => ({ ui: { ...s.ui, lastPulseLayerId: null } }));
    }, 500);
  }
});
