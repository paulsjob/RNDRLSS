
import React from 'react';
import { DataDictionaryBrowser } from './DataDictionaryBrowser';
import { NodeCanvas } from './NodeCanvas';
import { LiveMonitor } from './components/LiveMonitor';

export const DataEngineView: React.FC = () => {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Dictionary Sidebar */}
      <DataDictionaryBrowser />
      
      {/* Main Flow Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <NodeCanvas />
      </div>

      {/* Live Bus Monitor Sidebar */}
      <LiveMonitor />
    </div>
  );
};
