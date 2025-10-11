import { useEditorStore } from "../store/useEditorStore";

export function ElementInspector() {
  const { elements, selectedId, updateElement } = useEditorStore();
  const element = elements.find((e) => e.id === selectedId);

  if (!element)
    return (
      <div className="w-64 border-l bg-gray-50 flex justify-center items-center text-gray-500">
        No element selected
      </div>
    );

  return (
    <div className="w-64 border-l bg-white p-4">
      <h3 className="font-semibold mb-2">Element Inspector</h3>

      {element.type === "text" && (
        <>
          <label className="block text-sm text-gray-600 mb-1">Text</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1 mb-3"
            value={element.text || ""}
            onChange={(e) => updateElement(element.id, { text: e.target.value })}
          />
        </>
      )}

      <label className="block text-sm text-gray-600 mb-1">X</label>
      <input
        type="number"
        className="w-full border rounded px-2 py-1 mb-3"
        value={element.x}
        onChange={(e) =>
          updateElement(element.id, { x: parseInt(e.target.value) })
        }
      />

      <label className="block text-sm text-gray-600 mb-1">Y</label>
      <input
        type="number"
        className="w-full border rounded px-2 py-1 mb-3"
        value={element.y}
        onChange={(e) =>
          updateElement(element.id, { y: parseInt(e.target.value) })
        }
      />
    </div>
  );
}
