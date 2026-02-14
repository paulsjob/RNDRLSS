
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
  const { ui, setEditingLayerId, updateLayerContent, currentTemplate } = useStudioStore();
  const bindings = currentTemplate?.bindings || {};
  
  const isEditing = ui.editingLayerId === layer.id;
  const [localText, setLocalText] = useState(layer.content.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local text when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalText(layer.content.text || '');
    }
  }, [layer.content.text, isEditing]);

  // Focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

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
    updateLayerContent(layer.id, { text: localText });
    setEditingLayerId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitChanges();
    }
    if (e.key === 'Escape') {
      setLocalText(layer.content.text || ''); // Revert
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

  if (layer.type !== LayerType.TEXT) return null;

  // Shared typography styles to prevent "jumps" during transition
  const typoStyles: React.CSSProperties = {
    fontSize: (layer.content.fontSize || 16) * scale,
    color: layer.content.color || 'white',
    fontWeight: layer.content.fontWeight || 'normal',
    textAlign: layer.content.textAlign || 'left',
    fontFamily: layer.content.fontFamily || 'Inter',
    lineHeight: 1.2, // Fixed line height for deterministic alignment
    letterSpacing: 'normal',
    textTransform: 'none', // We render raw text in the editor
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
          whiteSpace: 'pre-wrap', // Support multi-line area mode
          wordBreak: 'break-all',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Force alignment to match the flex container of the display div
          paddingTop: 'calc(50% - 0.6em)', 
          marginTop: '-0.1em'
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
