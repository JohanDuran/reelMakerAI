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

  return (
    <div
      className="absolute bg-white shadow-lg border rounded-md z-50"
      style={{ top: position.y, left: position.x, width: 160 }}
    >
      <button
        className="w-full text-left px-3 py-2 hover:bg-gray-100"
        onClick={() => {
          const state = useEditorStore.getState();
          if (state.selectedId) state.bringForward(state.selectedId);
          onClose();
        }}
      >
        Bring forward
      </button>
      <button
        className="w-full text-left px-3 py-2 hover:bg-gray-100"
        onClick={() => {
          const state = useEditorStore.getState();
          if (state.selectedId) state.sendBackward(state.selectedId);
          onClose();
        }}
      >
        Send backward
      </button>
      <button
        className="w-full text-left px-3 py-2 hover:bg-gray-100"
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
        className="w-full text-left px-3 py-2 hover:bg-gray-100"
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
