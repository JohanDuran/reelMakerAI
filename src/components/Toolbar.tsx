import { useEditorStore } from "../store/useEditorStore";

export function Toolbar() {
  const { addElement } = useEditorStore();

  return (
    <div className="flex gap-2 p-2 bg-gray-100 border-b items-center">
      <button
        onClick={() =>
          addElement({ type: "text", x: 50, y: 50, text: "New Text" })
        }
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Text
      </button>
      <button
        onClick={() =>
          addElement({ type: "image", x: 100, y: 100, width: 120, height: 80 })
        }
        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        + Image
      </button>
    </div>
  );
}
