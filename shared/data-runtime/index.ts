
import { 
  KeyId, 
  LiveMessage, 
  SnapshotMessage, 
  DeltaMessage, 
  EventMessage 
} from '../../contract/types';
import { 
  SnapshotMessageSchema, 
  DeltaMessageSchema, 
  EventMessageSchema 
} from '../../contract/schemas';

export interface LiveValueRecord {
  value: any;
  ts: number;
  sourceId: string;
  seq: number;
}

export type LiveBusSubscriber = (record: LiveValueRecord | null, keyId: KeyId) => void;
export type GlobalSubscriber = () => void;

class LiveBus {
  private state: Map<KeyId, LiveValueRecord> = new Map();
  private subscribers: Map<KeyId, Set<LiveBusSubscriber>> = new Map();
  private globalSubscribers: Set<GlobalSubscriber> = new Set();
  private allSubscribers: Set<(message: LiveMessage) => void> = new Set();
  private version: number = 0;

  public publish(message: LiveMessage) {
    // Validation
    try {
      if (message.type === 'snapshot') SnapshotMessageSchema.parse(message);
      if (message.type === 'delta') DeltaMessageSchema.parse(message);
      if (message.type === 'event') EventMessageSchema.parse(message);
    } catch (e) {
      console.error('[LiveBus] Validation Failed', e, message);
      return;
    }

    if (message.type === 'snapshot') {
      this.handleSnapshot(message);
    } else if (message.type === 'delta') {
      this.handleDelta(message);
    } else if (message.type === 'event') {
      this.handleEvent(message);
    }

    this.version++;
    this.notifyGlobal();
    this.allSubscribers.forEach(cb => cb(message));
  }

  private handleSnapshot(msg: SnapshotMessage) {
    Object.entries(msg.values).forEach(([keyId, value]) => {
      this.updateKeyInternal(keyId, value, msg.ts, msg.sourceId, msg.seq);
    });
  }

  private handleDelta(msg: DeltaMessage) {
    msg.changes.forEach(change => {
      this.updateKeyInternal(change.keyId, change.value, change.ts || msg.ts, msg.sourceId, msg.seq);
    });
  }

  private handleEvent(msg: EventMessage) {
    const existing = this.state.get(msg.eventKeyId);
    let list = Array.isArray(existing?.value) ? [...existing.value] : [];
    
    list.push({
      ts: msg.ts,
      payload: msg.payload,
      value: msg.value,
      sourceId: msg.sourceId,
      seq: msg.seq
    });

    if (list.length > 200) list.shift();
    this.updateKeyInternal(msg.eventKeyId, list, msg.ts, msg.sourceId, msg.seq);
  }

  private updateKeyInternal(keyId: KeyId, value: any, ts: number, sourceId: string, seq: number) {
    const current = this.state.get(keyId);
    if (current && current.sourceId === sourceId && current.seq >= seq) return;

    const record: LiveValueRecord = { value, ts, sourceId, seq };
    this.state.set(keyId, record);

    const subs = this.subscribers.get(keyId);
    if (subs) subs.forEach(cb => cb(record, keyId));
  }

  public getValue(keyId: KeyId): LiveValueRecord | null {
    return this.state.get(keyId) || null;
  }

  public getVersion(): number {
    return this.version;
  }

  private notifyGlobal() {
    this.globalSubscribers.forEach(cb => cb());
  }

  // useSyncExternalStore compatible subscribe
  public subscribe = (callback: GlobalSubscriber): () => void => {
    this.globalSubscribers.add(callback);
    return () => this.globalSubscribers.delete(callback);
  };

  public subscribeToKey(keyId: KeyId, cb: LiveBusSubscriber): () => void {
    if (!this.subscribers.has(keyId)) {
      this.subscribers.set(keyId, new Set());
    }
    this.subscribers.get(keyId)!.add(cb);
    cb(this.getValue(keyId), keyId);
    return () => {
      this.subscribers.get(keyId)?.delete(cb);
    };
  }

  public subscribeAll(cb: (message: LiveMessage) => void): () => void {
    this.allSubscribers.add(cb);
    return () => this.allSubscribers.delete(cb);
  }

  public runSelfTest() {
    console.group('[LiveBus] Diagnostics');
    const testKey = '00000000000000000000000000';
    this.publish({
      type: 'snapshot',
      dictionaryId: 'diag',
      dictionaryVersion: '1',
      sourceId: 'diag-sim',
      seq: Date.now(),
      ts: Date.now(),
      values: { [testKey]: 'BOOT_OK' }
    });
    const val = this.getValue(testKey);
    console.log('Snapshot Test:', val?.value === 'BOOT_OK' ? 'PASSED' : 'FAILED');
    console.groupEnd();
  }
}

export const liveBus = new LiveBus();
