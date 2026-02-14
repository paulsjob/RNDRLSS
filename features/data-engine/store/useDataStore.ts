
import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange, 
  OnConnect, 
  OnEdgesChange, 
  OnNodesChange, 
  applyEdgeChanges, 
  applyNodeChanges, 
  addEdge 
} from 'reactflow';
import { DataAdapter } from '../../../shared/types';
import { Dictionary, MappingSpec, KeyId } from '../../../contract/types';
import { SportsAdapter } from '../../../services/data/adapters/SportsAdapter';
import { FinanceAdapter } from '../../../services/data/adapters/FinanceAdapter';
import { WeatherAdapter } from '../../../services/data/adapters/WeatherAdapter';
import { MLB_CANON_DICTIONARY, MLB_KEYS } from '../../../contract/dictionaries/mlb';
import { liveBus } from '../../../shared/data-runtime';
import { mlbSimulator } from '../services/MLBSimulator';

const ADAPTERS: DataAdapter[] = [
  new SportsAdapter(),
  new FinanceAdapter(),
  new WeatherAdapter()
];

export type ValidationType = 'error' | 'warning' | 'info';
export interface ValidationResult {
  id: string;
  type: ValidationType;
  message: string;
  nodeId?: string;
  keyId?: string;
}

export interface NodeActivity {
  lastActiveAt: number;
  tickCount: number;
}

export type DeploymentStatus = 'idle' | 'deploying' | 'success';
export type SimStatus = 'idle' | 'ready' | 'running' | 'paused' | 'error';
export type SimMode = 'demoPipeline' | 'feedOnly' | 'scenario';
export type BusState = 'idle' | 'streaming' | 'error';
export type Provenance = 'LIVE' | 'SIM' | 'MANUAL' | 'PIPELINE' | 'STALE' | 'INVALID' | 'UNKNOWN';

export type SourceMode = 'static' | 'simulated' | 'manual' | 'demo';
export type SelectionKind = 'node' | 'key' | 'registryObject';

interface DataState {
  orgId: string;
  availableAdapters: DataAdapter[];
  activeAdapterId: string;
  liveSnapshot: Record<string, any>;
  
  // Unified Simulation Controller (ITEM 33/39)
  simController: {
    status: SimStatus;
    mode: SimMode | null;
    activeScenarioId: string | null;
    lastError: string | null;
  };

  // Node Flow State (ITEM 40)
  nodeActivity: Record<string, NodeActivity>;

  // Unified Selection (ITEM 33)
  selection: {
    kind: SelectionKind | null;
    id: string | null;
    label: string | null;
    canonicalPath: string | null;
  };

  // Live Monitor UI (ITEM 37)
  monitor: {
    pinnedKeyIds: Set<string>;
    collapsedSections: Set<string>;
    searchQuery: string;
    filterType: 'all' | 'pinned' | 'recent';
  };

  // Golden Path Demo State
  goldenPath: {
    sourceMode: SourceMode;
    rawInput: string;
    transformedValue: any;
    isBound: boolean;
    bindingTarget: string;
    lastUpdateTs: number;
    error: string | null;
  };

  // Minimal Demo State
  demoPipeline: {
    timer: number;
    homeScore: number;
    awayScore: number;
  };
  
  // Truth Mode
  isTruthMode: boolean;
  selectedTraceId: string | null;
  
  // Pipeline State
  busState: BusState;
  
  isWiringMode: boolean;
  activeWiringSource: { id: string; type: 'key' | 'node'; label?: string } | null;
  
  builtinDictionaries: Dictionary[];
  importedDictionaries: Dictionary[];
  mappings: MappingSpec[];
  
  isLoading: boolean;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;

  demoCoach: {
    isDismissed: boolean;
  };

  validation: {
    status: 'idle' | 'validating' | 'pass' | 'fail';
    results: ValidationResult[];
    lastValidated: number;
    offendingNodeIds: Set<string>;
  };
  deployment: {
    status: DeploymentStatus;
    lastDeployedAt: number | null;
    deployedEndpointId: string | null;
    endpointUrl: string | null;
    manifest: {
      nodes: number;
      edges: number;
      streamId: string;
    } | null;
  };

  // Unified Transport Actions (ITEM 39)
  transportStart: () => void;
  transportStop: () => void;
  transportPause: () => void;

  // Flow Actions (ITEM 40)
  registerNodeActivity: (nodeId: string) => void;

  setCoachDismissed: (isDismissed: boolean) => void;

  // Setup/Mode Actions (Secondary)
  setSimMode: (mode: SimMode, scenarioId?: string | null) => void;
  startDemoPipeline: () => void;
  startFeed: () => void;
  playScenario: (scenarioId: string) => void;
  pause: () => void;
  stopAll: () => void;
  resetToCleanStart: () => void;
  runDemoTick: () => void;

  // Selection Actions
  setSelection: (kind: SelectionKind | null, id: string | null, label?: string, path?: string) => void;

  // Monitor Actions (ITEM 37)
  togglePin: (keyId: string) => void;
  toggleSection: (section: string) => void;
  setMonitorSearch: (query: string) => void;
  setMonitorFilter: (filter: 'all' | 'pinned' | 'recent') => void;

  resetDemo: () => void;

  // Actions
  setGoldenPathSource: (mode: SourceMode) => void;
  updateRawInput: (val: string) => void;
  bindToGraphic: (target: string) => void;
  validateGoldenPath: () => void;

  // Graph Actions
  createDemoPipeline: () => void;
  fixOrphanedNode: (nodeId: string) => void;
  fixAllOrphans: () => void;
  deployToEdge: () => void;
  copyValidationReport: () => void;
  
  setOrgId: (id: string) => void;
  setBusState: (state: BusState) => void;
  setWiringMode: (active: boolean, source?: { id: string; type: 'key' | 'node'; label?: string }) => void;
  setTruthMode: (active: boolean) => void;
  setTraceId: (id: string | null) => void;
  setActiveAdapter: (id: string) => Promise<void>;
  refreshSnapshot: () => Promise<void>;
  validateGraph: () => void;
  resetDeployment: () => void;
  saveToOrg: () => void;
  loadFromOrg: (id: string) => void;
  importBundleData: (data: { dictionaries: Dictionary[], mappings: MappingSpec[], graphs: any[] }) => any;
}

let demoIntervalId: any = null;

export const useDataStore = create<DataState>((set, get) => ({
  orgId: 'org_default',
  availableAdapters: ADAPTERS,
  activeAdapterId: ADAPTERS[0].id,
  liveSnapshot: {},
  
  simController: {
    status: 'idle',
    mode: null,
    activeScenarioId: null,
    lastError: null,
  },

  nodeActivity: {},

  selection: {
    kind: null,
    id: null,
    label: null,
    canonicalPath: null,
  },

  monitor: {
    pinnedKeyIds: new Set(),
    collapsedSections: new Set(),
    searchQuery: '',
    filterType: 'all',
  },

  goldenPath: {
    sourceMode: 'demo',
    rawInput: '0',
    transformedValue: 0,
    isBound: false,
    bindingTarget: 'MLB Scorebug',
    lastUpdateTs: 0,
    error: null,
  },

  demoPipeline: {
    timer: 900,
    homeScore: 3,
    awayScore: 1
  },
  
  isTruthMode: false,
  selectedTraceId: null,
  busState: 'idle',
  isWiringMode: false,
  activeWiringSource: null,
  builtinDictionaries: [MLB_CANON_DICTIONARY as unknown as Dictionary],
  importedDictionaries: [],
  mappings: [],
  isLoading: false,
  nodes: [],
  edges: [],

  demoCoach: {
    isDismissed: false
  },

  validation: {
    status: 'idle',
    results: [],
    lastValidated: 0,
    offendingNodeIds: new Set(),
  },
  deployment: {
    status: 'idle',
    lastDeployedAt: null,
    deployedEndpointId: null,
    endpointUrl: null,
    manifest: null,
  },

  registerNodeActivity: (nodeId) => set(state => ({
    nodeActivity: {
      ...state.nodeActivity,
      [nodeId]: {
        lastActiveAt: Date.now(),
        tickCount: (state.nodeActivity[nodeId]?.tickCount || 0) + 1
      }
    }
  })),

  setCoachDismissed: (isDismissed) => set(state => ({
    demoCoach: { ...state.demoCoach, isDismissed }
  })),

  transportStart: () => {
    const { simController } = get();
    const targetMode = simController.mode || 'demoPipeline';
    
    if (simController.status === 'paused') {
      get().pause(); 
      return;
    }

    if (targetMode === 'demoPipeline') get().startDemoPipeline();
    else if (targetMode === 'feedOnly') get().startFeed();
    else if (targetMode === 'scenario' && simController.activeScenarioId) {
      get().playScenario(simController.activeScenarioId);
    } else if (targetMode === 'scenario') {
      get().playScenario('opening_pitch');
    }
  },

  transportStop: () => {
    get().stopAll();
  },

  transportPause: () => {
    get().pause();
  },

  setSimMode: (mode, scenarioId = null) => {
    set(state => ({
      simController: {
        ...state.simController,
        mode,
        activeScenarioId: scenarioId
      }
    }));
  },

  togglePin: (keyId) => set(state => {
    const next = new Set(state.monitor.pinnedKeyIds);
    if (next.has(keyId)) next.delete(keyId);
    else next.add(keyId);
    return { monitor: { ...state.monitor, pinnedKeyIds: next } };
  }),

  toggleSection: (section) => set(state => {
    const next = new Set(state.monitor.collapsedSections);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    return { monitor: { ...state.monitor, collapsedSections: next } };
  }),

  setMonitorSearch: (searchQuery) => set(state => ({ monitor: { ...state.monitor, searchQuery } })),
  setMonitorFilter: (filterType) => set(state => ({ monitor: { ...state.monitor, filterType } })),

  setSelection: (kind, id, label, path) => {
    set({ 
      selection: { 
        kind, 
        id, 
        label: label || null, 
        canonicalPath: path || null 
      },
      selectedTraceId: id 
    });
  },

  resetDemo: () => {
    get().stopAll();
    set({
      selection: { kind: null, id: null, label: null, canonicalPath: null },
      validation: { status: 'idle', results: [], lastValidated: 0, offendingNodeIds: new Set() },
      deployment: { status: 'idle', lastDeployedAt: null, deployedEndpointId: null, endpointUrl: null, manifest: null },
      isTruthMode: false,
      selectedTraceId: null,
      demoPipeline: { timer: 900, homeScore: 3, awayScore: 1 },
      goldenPath: { ...get().goldenPath, isBound: false, error: null },
      simController: { status: 'idle', mode: null, activeScenarioId: null, lastError: null },
      nodeActivity: {},
      demoCoach: { isDismissed: false }
    });
  },

  startDemoPipeline: () => {
    get().stopAll();
    demoIntervalId = setInterval(() => {
      get().runDemoTick();
    }, 1000);
    set({ 
      simController: { status: 'running', mode: 'demoPipeline', activeScenarioId: null, lastError: null },
      busState: 'streaming'
    });
  },

  startFeed: () => {
    get().stopAll();
    mlbSimulator.start();
    set({ 
      simController: { status: 'running', mode: 'feedOnly', activeScenarioId: null, lastError: null },
      busState: 'streaming'
    });
  },

  stopFeed: () => {
    get().stopAll();
  },

  playScenario: (scenarioId) => {
    get().stopAll();
    mlbSimulator.applyScenario(scenarioId);
    mlbSimulator.start();
    set({ 
      simController: { status: 'running', mode: 'scenario', activeScenarioId: scenarioId, lastError: null },
      busState: 'streaming'
    });
  },

  pause: () => {
    const { simController } = get();
    if (simController.status === 'running') {
      if (simController.mode === 'demoPipeline' && demoIntervalId) {
        clearInterval(demoIntervalId);
        demoIntervalId = null;
      } else {
        mlbSimulator.stop();
      }
      set({ simController: { ...simController, status: 'paused' } });
    } else if (simController.status === 'paused') {
      if (simController.mode === 'demoPipeline') {
        demoIntervalId = setInterval(() => get().runDemoTick(), 1000);
      } else {
        mlbSimulator.start();
      }
      set({ simController: { ...simController, status: 'running' } });
    }
  },

  stopAll: () => {
    if (demoIntervalId) {
      clearInterval(demoIntervalId);
      demoIntervalId = null;
    }
    mlbSimulator.stop();
    set(state => ({ 
      simController: { ...state.simController, status: 'idle' },
      busState: 'idle'
    }));
  },

  resetToCleanStart: () => {
    get().stopAll();
    set({
      demoPipeline: { timer: 900, homeScore: 3, awayScore: 1 },
      goldenPath: { ...get().goldenPath, lastUpdateTs: 0 }
    });
    get().startDemoPipeline();
  },

  runDemoTick: () => {
    const { demoPipeline } = get();
    const nextTimer = Math.max(0, demoPipeline.timer - 1);
    
    let nextHome = demoPipeline.homeScore;
    let nextAway = demoPipeline.awayScore;
    if (Math.random() > 0.98) nextHome++;
    if (Math.random() > 0.99) nextAway++;

    const minutes = Math.floor(nextTimer / 60);
    const seconds = nextTimer % 60;
    const clockStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    set(state => ({ 
      demoPipeline: { 
        ...state.demoPipeline, 
        timer: nextTimer,
        homeScore: nextHome,
        awayScore: nextAway
      },
      goldenPath: {
        ...state.goldenPath,
        lastUpdateTs: Date.now()
      }
    }));

    liveBus.publish({
      type: 'delta',
      dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
      dictionaryVersion: MLB_CANON_DICTIONARY.version,
      sourceId: 'demo_simulation_v1',
      seq: Date.now(),
      ts: Date.now(),
      changes: [
        { keyId: MLB_KEYS.SCORE_HOME, value: nextHome },
        { keyId: MLB_KEYS.SCORE_AWAY, value: nextAway },
        { keyId: MLB_KEYS.GAME_CLOCK, value: clockStr },
        { keyId: MLB_KEYS.GAME_STATUS, value: 'LIVE' },
        { keyId: MLB_KEYS.TEAM_HOME_ABBR, value: 'LAD' },
        { keyId: MLB_KEYS.TEAM_AWAY_ABBR, value: 'NYY' }
      ]
    });
  },

  setGoldenPathSource: (sourceMode) => {
    set(state => ({ goldenPath: { ...state.goldenPath, sourceMode } }));
  },

  updateRawInput: (rawInput) => {
    let transformedValue: any = rawInput;
    try {
      if (!isNaN(Number(rawInput)) && rawInput.trim() !== '') {
        transformedValue = Number(rawInput);
      } else {
        transformedValue = JSON.parse(rawInput);
      }
    } catch (e) {
      transformedValue = rawInput;
    }

    set(state => ({ 
      goldenPath: { 
        ...state.goldenPath, 
        rawInput, 
        transformedValue, 
        lastUpdateTs: Date.now() 
      } 
    }));

    liveBus.publish({
      type: 'delta',
      dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
      dictionaryVersion: MLB_CANON_DICTIONARY.version,
      sourceId: 'golden_path_demo',
      seq: Date.now(),
      ts: Date.now(),
      changes: [{ keyId: MLB_KEYS.SCORE_HOME, value: transformedValue }]
    });
  },

  bindToGraphic: (target) => {
    set(state => ({ goldenPath: { ...state.goldenPath, isBound: true, bindingTarget: target } }));
  },

  validateGoldenPath: () => {
    const { goldenPath } = get();
    if (!goldenPath.isBound) {
      set(state => ({ goldenPath: { ...state.goldenPath, error: "No graphic field is bound to this pipeline." } }));
    } else {
      set(state => ({ goldenPath: { ...state.goldenPath, error: null } }));
      set(state => ({ validation: { ...state.validation, status: 'pass' } }));
    }
  },

  createDemoPipeline: () => {
    const demoNodes: Node[] = [
      {
        id: 'node-demo-source',
        type: 'default',
        data: { label: 'MLB Demo Source', keyId: MLB_KEYS.GAME_STATUS, value: 'LIVE' },
        position: { x: 50, y: 150 },
        style: { background: '#1e293b', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '8px', fontSize: '11px', padding: '12px', width: 160 }
      },
      {
        id: 'node-demo-logic',
        type: 'default',
        data: { label: 'Score Processor', keyId: MLB_KEYS.SCORE_HOME, value: 0 },
        position: { x: 300, y: 150 },
        style: { background: '#1e293b', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '8px', fontSize: '11px', padding: '12px', width: 160 }
      },
      {
        id: 'node-demo-bus',
        type: 'default',
        data: { label: 'Live Bus Outlet', keyId: MLB_KEYS.GAME_EVENTS, value: 'READY' },
        position: { x: 550, y: 150 },
        style: { background: '#0f172a', color: '#10b981', border: '1px solid #059669', borderRadius: '8px', fontSize: '11px', padding: '12px', width: 160 }
      }
    ];

    const demoEdges: Edge[] = [
      { id: 'edge-demo-1', source: 'node-demo-source', target: 'node-demo-logic', animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 } },
      { id: 'edge-demo-2', source: 'node-demo-logic', target: 'node-demo-bus', animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 } }
    ];

    set({ nodes: demoNodes, edges: demoEdges });
    get().saveToOrg();
    get().validateGraph();
  },

  fixOrphanedNode: (nodeId) => {
    const { nodes, edges } = get();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const sourceNode = nodes.find(n => n.id !== nodeId && !edges.some(e => e.target === n.id));
    if (sourceNode) {
      const newEdge: Edge = {
        id: `edge-auto-${Date.now()}`,
        source: sourceNode.id,
        target: nodeId,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 3 }
      };
      set({ edges: [...edges, newEdge] });
    } else {
      const firstNode = nodes.find(n => n.id !== nodeId);
      if (firstNode) {
        const newEdge: Edge = {
          id: `edge-auto-${Date.now()}`,
          source: firstNode.id,
          target: nodeId,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 3 }
        };
        set({ edges: [...edges, newEdge] });
      }
    }
    get().saveToOrg();
    get().validateGraph();
  },

  fixAllOrphans: () => {
    const { validation } = get();
    validation.offendingNodeIds.forEach(id => get().fixOrphanedNode(id));
  },

  setBusState: (busState) => set({ busState }),
  setWiringMode: (active, source = null) => set({ isWiringMode: active, activeWiringSource: source }),
  setTruthMode: (active) => set({ isTruthMode: active, isWiringMode: false, activeWiringSource: null }),
  setTraceId: (selectedTraceId) => set({ selectedTraceId }),

  onNodesChange: (changes: NodeChange[]) => {
    if (get().isTruthMode) return;
    set({ 
      nodes: applyNodeChanges(changes, get().nodes),
      validation: { ...get().validation, status: 'idle' } 
    });
    get().saveToOrg();
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    if (get().isTruthMode) return;
    set({ 
      edges: applyEdgeChanges(changes, get().edges),
      validation: { ...get().validation, status: 'idle' }
    });
    get().saveToOrg();
  },
  onConnect: (connection: Connection) => {
    if (get().isTruthMode) return;
    set({ 
      edges: addEdge({ ...connection, animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 } }, get().edges),
      validation: { ...get().validation, status: 'idle' }
    });
    get().saveToOrg();
  },
  addNode: (node: Node) => {
    if (get().isTruthMode) return;
    set({ 
      nodes: [...get().nodes, node],
      validation: { ...get().validation, status: 'idle' }
    });
    get().saveToOrg();
  },

  validateGraph: () => {
    set({ validation: { ...get().validation, status: 'validating', results: [], offendingNodeIds: new Set() } });
    
    setTimeout(() => {
      const { nodes, edges, simController } = get();
      const results: ValidationResult[] = [];
      const offendingNodeIds = new Set<string>();

      if (nodes.length === 0) {
        results.push({ id: 'v-0', type: 'error', message: "This pipeline is empty. Connect a source to drive the live bus." });
      } else {
        nodes.forEach(node => {
          const hasInbound = edges.some(edge => edge.target === node.id);
          const hasOutbound = edges.some(edge => edge.source === node.id);
          
          if (!hasInbound && !hasOutbound) {
            results.push({ 
              id: `v-${node.id}`, 
              type: 'error', 
              message: `Node "${node.data.label}" is orphaned and never reaches the live bus.`, 
              nodeId: node.id 
            });
            offendingNodeIds.add(node.id);
          }
        });

        if (simController.status === 'idle') {
          results.push({ 
            id: 'v-w-1', 
            type: 'warning', 
            message: "Simulation is offline. Deployment will contain static snapshots only." 
          });
        }

        results.push({ 
          id: 'v-i-1', 
          type: 'info', 
          message: `Graph contains ${nodes.length} logic steps with ${edges.length} data routes.` 
        });
      }

      const hasErrors = results.some(r => r.type === 'error');

      set({ 
        validation: { 
          status: hasErrors ? 'fail' : 'pass', 
          results,
          lastValidated: Date.now(),
          offendingNodeIds
        } 
      });
    }, 800);
  },

  deployToEdge: () => {
    const { validation, nodes, edges, orgId } = get();
    if (validation.status !== 'pass') return;

    set({ deployment: { ...get().deployment, status: 'deploying' } });

    setTimeout(() => {
      const streamId = `strm_${Math.random().toString(36).substr(2, 9)}`;
      const mockUrl = `https://api.renderless.io/v1/edge/${orgId}/topic/${streamId}`;
      
      set({ 
        deployment: { 
          status: 'success', 
          lastDeployedAt: Date.now(),
          deployedEndpointId: streamId,
          endpointUrl: mockUrl,
          manifest: {
            nodes: nodes.length,
            edges: edges.length,
            streamId
          }
        } 
      });
    }, 2000);
  },

  copyValidationReport: () => {
    const { validation } = get();
    const report = validation.results.map(r => `[${r.type.toUpperCase()}] ${r.message}`).join('\n');
    navigator.clipboard.writeText(`RENDERLESS VALIDATION REPORT - ${new Date().toISOString()}\n\n${report}`);
  },

  resetDeployment: () => {
    set({ deployment: { status: 'idle', lastDeployedAt: null, deployedEndpointId: null, endpointUrl: null, manifest: null } });
  },

  setOrgId: (id) => {
    set({ orgId: id });
    get().loadFromOrg(id);
  },

  setActiveAdapter: async (id) => {
    const adapter = ADAPTERS.find(a => a.id === id);
    if (!adapter) return;
    set({ activeAdapterId: id, isLoading: true });
    const snapshot = await adapter.fetchLive();
    set({ liveSnapshot: snapshot, isLoading: false });
  },

  refreshSnapshot: async () => {
    const { activeAdapterId } = get();
    const adapter = ADAPTERS.find(a => a.id === activeAdapterId);
    if (!adapter) return;
    const snapshot = await adapter.fetchLive();
    set({ liveSnapshot: snapshot });
  },

  saveToOrg: () => {
    const { orgId, importedDictionaries, mappings, nodes, edges } = get();
    localStorage.setItem(`renderless:${orgId}:dataEngine:dictionaries`, JSON.stringify(importedDictionaries));
    localStorage.setItem(`renderless:${orgId}:dataEngine:mappings`, JSON.stringify(mappings));
    localStorage.setItem(`renderless:${orgId}:dataEngine:graphs`, JSON.stringify({ nodes, edges }));
  },

  loadFromOrg: (id) => {
    const dictsRaw = localStorage.getItem(`renderless:${id}:dataEngine:dictionaries`);
    const mapsRaw = localStorage.getItem(`renderless:${id}:dataEngine:mappings`);
    const graphsRaw = localStorage.getItem(`renderless:${id}:dataEngine:graphs`);

    set({
      importedDictionaries: dictsRaw ? JSON.parse(dictsRaw) : [],
      mappings: mapsRaw ? JSON.parse(mapsRaw) : [],
      nodes: graphsRaw ? JSON.parse(graphsRaw).nodes || [] : [],
      edges: graphsRaw ? JSON.parse(graphsRaw).edges || [] : []
    });
  },

  importBundleData: ({ dictionaries, mappings, graphs }) => {
    const { importedDictionaries: currentDicts, mappings: currentMaps } = get();
    
    let importedCount = 0;
    let skippedCount = 0;
    const conflicts: string[] = [];

    const nextDicts = [...currentDicts];
    const nextMaps = [...currentMaps];

    dictionaries.forEach(dict => {
      if (get().builtinDictionaries.some(bd => bd.dictionaryId === dict.dictionaryId)) {
        skippedCount++;
        conflicts.push(`Dictionary [Built-in]: ${dict.dictionaryId}`);
        return;
      }

      const existingIdx = nextDicts.findIndex(d => d.dictionaryId === dict.dictionaryId && d.version === dict.version);
      if (existingIdx === -1) {
        nextDicts.push(dict);
        importedCount++;
      } else {
        skippedCount++;
        conflicts.push(`Dictionary [Exists]: ${dict.dictionaryId} v${dict.version}`);
      }
    });

    mappings.forEach(map => {
      const existingIdx = nextMaps.findIndex(m => m.mappingId === map.mappingId);
      if (existingIdx === -1) {
        nextMaps.push(map);
        importedCount++;
      } else {
        skippedCount++;
        conflicts.push(`Mapping [Exists]: ${map.mappingId}`);
      }
    });

    set({ 
      importedDictionaries: nextDicts,
      mappings: nextMaps,
      nodes: graphs[0]?.nodes || get().nodes,
      edges: graphs[0]?.edges || get().edges
    });

    get().saveToOrg();
    
    return { importedCount, skippedCount, conflicts };
  }
}));

// Initialize LiveBus Sync for Graph
liveBus.subscribeAll((msg) => {
  const store = useDataStore.getState();
  const { nodes, edges } = store;

  if (msg.type) {
    store.setBusState('streaming');
  }

  if (!nodes.length) return;

  let changedKeys: string[] = [];
  if (msg.type === 'snapshot') {
    changedKeys = Object.keys(msg.values);
  } else if (msg.type === 'delta') {
    changedKeys = msg.changes.map(c => c.keyId);
  } else if (msg.type === 'event') {
    changedKeys = [msg.eventKeyId];
  }

  const updatedNodes = [...nodes];
  const updatedEdges = [...edges];
  let hasChanges = false;

  changedKeys.forEach(keyId => {
    const record = liveBus.getValue(keyId);
    if (!record) return;

    updatedNodes.forEach((node, idx) => {
      if (node.data.keyId === keyId) {
        hasChanges = true;
        
        // ITEM 40: Drive Flow Activity
        store.registerNodeActivity(node.id);

        updatedNodes[idx] = {
          ...node,
          data: {
            ...node.data,
            value: record.value,
            lastUpdated: Date.now(),
            sourceId: record.sourceId
          }
        };

        updatedEdges.forEach((edge, eIdx) => {
          if (edge.source === node.id) {
            updatedEdges[eIdx] = { ...edge, animated: true };
          }
        });
      }
    });
  });

  if (hasChanges) {
    useDataStore.setState({ nodes: updatedNodes, edges: updatedEdges });
    
    setTimeout(() => {
      const currentNodes = useDataStore.getState().nodes;
      const currentEdges = useDataStore.getState().edges;
      const cleanedEdges = currentEdges.map(e => ({ ...e, animated: false }));
      useDataStore.setState({ edges: cleanedEdges });
    }, 1000);
  }
});

setTimeout(() => {
  useDataStore.getState().loadFromOrg('org_default');
}, 0);

// Global Helper for Provenance (ITEM 37 Extended)
export const getProvenance = (sourceId?: string, ts?: number): Provenance => {
  if (!sourceId) return 'UNKNOWN';
  if (ts && Date.now() - ts > 30000) return 'STALE';
  if (sourceId.startsWith('sim_')) return 'SIM';
  if (sourceId.startsWith('demo_')) return 'SIM';
  if (sourceId.startsWith('console_')) return 'MANUAL';
  if (sourceId.startsWith('manual_')) return 'MANUAL';
  if (sourceId.startsWith('golden_')) return 'PIPELINE';
  if (sourceId.includes('v1') || sourceId.includes('hub')) return 'LIVE';
  return 'UNKNOWN';
};
