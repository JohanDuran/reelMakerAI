import { useEditorStore } from "../store/useEditorStore";
import { useEffect } from "react";

type ContextMenuProps = {
  position: { x: number; y: number };
  onClose: () => void;
};

export function ContextMenu({ position, onClose }: ContextMenuProps) {
  const { selectedId, elements, selectElement, addElement } = useEditorStore();
  const element = elements.find((e) => e.id === selectedId);

  useEffect(() => {
    const handleClickOutside = () => onClose();
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  if (!element) return null;

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: position.y,
    left: position.x,
    width: 180,
    background: 'var(--cm-bg, #0f1724)', // dark slate
    color: 'var(--cm-color, #e6eef8)',
    boxShadow: '0 6px 20px rgba(2,6,23,0.6)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    zIndex: 1000,
    overflow: 'hidden'
  };

  const btnBase: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', color: 'inherit', border: 'none', cursor: 'pointer' };
  const btnHover: React.CSSProperties = { background: 'rgba(255,255,255,0.02)' };

  return (
    <div style={menuStyle}>
      <button
        style={btnBase}
        onMouseEnter={(e) => (e.currentTarget.style.background = btnHover.background as string)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={() => {
          const state = useEditorStore.getState();
          if (state.selectedId) state.bringForward(state.selectedId);
          onClose();
        }}
      >
        Bring forward
      </button>
      <button
        style={btnBase}
        onMouseEnter={(e) => (e.currentTarget.style.background = btnHover.background as string)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={() => {
          const state = useEditorStore.getState();
          if (state.selectedId) state.sendBackward(state.selectedId);
          onClose();
        }}
      >
        Send backward
      </button>
      <button
        style={btnBase}
        onMouseEnter={(e) => (e.currentTarget.style.background = btnHover.background as string)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={() => {
          // create a duplicate element (same properties, new id) and select it
          const { id, ...rest } = element as any;
          addElement({ ...rest });
          onClose();
        }}
      >
        Duplicate
      </button>
      <button
        style={btnBase}
        onMouseEnter={(e) => (e.currentTarget.style.background = btnHover.background as string)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={() => {
          selectElement(null);
          onClose();
        }}
      >
        Deselect
      </button>
    </div>
  );
}
