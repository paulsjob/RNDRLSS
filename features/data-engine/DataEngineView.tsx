
import React from 'react';
import { DataDictionaryBrowser } from './DataDictionaryBrowser';
import { NodeCanvas } from './NodeCanvas';
import { LiveMonitor } from './components/LiveMonitor';
import { BindingTestConsole } from './components/BindingTestConsole';
import { SnapshotManager } from './components/SnapshotManager';

export const DataEngineView: React.FC = () => {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Dictionary Sidebar */}
      <DataDictionaryBrowser />
      
      {/* Main Flow Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 relative">
          <NodeCanvas />
        </div>
        <BindingTestConsole />
        <SnapshotManager />
      </div>

      {/* Live Bus Monitor Sidebar */}
      <LiveMonitor />
    </div>
  );
};
