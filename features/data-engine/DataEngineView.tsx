
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DataDictionaryBrowser } from './DataDictionaryBrowser';
import { NodeCanvas } from './NodeCanvas';
import { LiveMonitor } from './components/LiveMonitor';
import { BindingTestConsole } from './components/BindingTestConsole';
import { SnapshotManager } from './components/SnapshotManager';

export const DataEngineView: React.FC = () => {
  const [monitorWidth, setMonitorWidth] = useState(380);
  const isResizing = useRef(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    
    // Calculate new width based on mouse position from the right edge
    const newWidth = window.innerWidth - e.clientX;
    
    // Constraints: Min 300px, Max 40% of window width
    const minWidth = 300;
    const maxWidth = Math.min(600, window.innerWidth * 0.45);
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setMonitorWidth(newWidth);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

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

      {/* Resize Handle */}
      <div 
        onMouseDown={startResizing}
        className="w-1 bg-zinc-800 hover:bg-blue-500 transition-colors cursor-col-resize z-50 flex-shrink-0"
        title="Drag to resize monitor"
      />

      {/* Live Bus Monitor Sidebar */}
      <div style={{ width: monitorWidth }} className="flex-shrink-0 flex flex-col h-full overflow-hidden bg-zinc-900 border-l border-zinc-800">
        <LiveMonitor />
      </div>
    </div>
  );
};
