
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layer, LayerType } from '../../../shared/types';
import { useLiveValue } from '../../../shared/data-runtime/hooks';
import { applyTransforms } from '../../../contract/transforms';
import { useStudioStore } from '../store/useStudioStore';

/**
 * Resolver function to determine the final display string for a text layer.
 * Prioritizes bound live data, fallback to static text.
 */
export const getDisplayText = (layer: Layer, liveValue?: any, transform: string = 'none'): string => {
  if (layer.type !== LayerType.TEXT) return '';
  
  if (liveValue !== undefined && liveValue !== null) {
    const transforms = transform === 'none' ? [] : [transform];
    return String(applyTransforms(liveValue, transforms));
  }
  
  return layer.content.text || '';
};

interface TextLayerRendererProps {
  layer: Layer;
  scale: number;
}

/**
 * High-performance stage renderer for text layers.
 * Handles display and in-situ editing with pixel-perfect alignment.
 */
export const TextLayerRenderer: React.FC<TextLayerRendererProps> = ({ layer, scale }) => {
  // Fix: Move type guard to the top to narrow Layer type to TextLayer for safe content property access throughout the component
  if (layer.type !== LayerType.TEXT) return null;

  const { ui, selection, setEditingLayerId, updateLayerContent, currentTemplate } = useStudioStore();
  const bindings = currentTemplate?.bindings || {};
  
  const isEditing = ui.editingLayerId === layer.id;
  const isSelected = selection.selectedLayerId === layer.id;
  const [localText, setLocalText] = useState(layer.content.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine if it is in multiline "Area" mode vs single-line "Point" mode
  // Heuristic: If height is significantly larger than fontSize * lineHeight, treat as Area
  const isAreaMode = useMemo(() => {
    const fontSize = layer.content.fontSize || 16;
    return layer.transform.height > fontSize * 1.8;
  }, [layer.transform.height, layer.content.fontSize]);

  // Sync local text when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalText(layer.content.text || '');
    }
  }, [layer.content.text, isEditing]);

  // Focus and put cursor at end when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      const length = el.value.length;
      el.setSelectionRange(length, length);
    }
  }, [isEditing]);

  // Auto-commit on selection change
  useEffect(() => {
    if (isEditing && !isSelected) {
      commitChanges();
    }
  }, [isSelected, isEditing]);

  // Resolve binding info
  const bindingKey = `${layer.id}.text`;
  const bindingValue = bindings[bindingKey] || '';
  const [keyId, transform] = bindingValue.includes('|') ? bindingValue.split('|') : [bindingValue, 'none'];
  const isBound = !!keyId;

  // Subscribe to live data for display
  const record = useLiveValue(keyId || null);
  
  const displayValue = useMemo(() => {
    return getDisplayText(layer, record?.value, transform);
  }, [layer, record?.value, transform]);

  const commitChanges = () => {
    // Only commit if the layer still exists and we are editing
    const currentStore = useStudioStore.getState();
    const exists = currentStore.currentTemplate?.layers.some(l => l.id === layer.id);
    if (!exists) return;

    updateLayerContent(layer.id, { text: localText });
    setEditingLayerId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Enter / Ctrl+Enter always commits
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commitChanges();
      return;
    }

    // Standard Enter behavior
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!isAreaMode) {
        // Point mode: Enter commits
        e.preventDefault();
        commitChanges();
      }
      // Area mode: Enter inserts newline (default behavior)
    }

    // Revert and exit on Escape
    if (e.key === 'Escape') {
      setLocalText(layer.content.text || ''); 
      setEditingLayerId(null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Prevent manual editing of live-bound fields to avoid state confusion
    if (!isBound) {
      setEditingLayerId(layer.id);
    }
  };

  // Shared typography styles to prevent "jumps" during transition
  const typoStyles: React.CSSProperties = {
    fontSize: (layer.content.fontSize || 16) * scale,
    color: layer.content.color || 'white',
    fontWeight: layer.content.fontWeight || 'normal',
    textAlign: layer.content.textAlign || 'left',
    fontFamily: layer.content.fontFamily || 'Inter',
    lineHeight: 1.2, 
    letterSpacing: 'normal',
    textTransform: 'none', 
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        onBlur={commitChanges}
        onKeyDown={handleKeyDown}
        className="w-full h-full p-0 m-0 border-none outline-none resize-none bg-transparent overflow-hidden"
        style={{
          ...typoStyles,
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-all',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Precise vertical centering logic matching the display div
          paddingTop: isAreaMode ? '0' : 'calc(50% - 0.6em)',
          marginTop: isAreaMode ? '0' : '-0.1em'
        }}
      />
    );
  }

  return (
    <div 
      onDoubleClick={handleDoubleClick}
      style={typoStyles}
      className="w-full h-full flex items-center justify-center whitespace-pre-wrap overflow-hidden select-none cursor-text"
    >
      {displayValue}
    </div>
  );
};
