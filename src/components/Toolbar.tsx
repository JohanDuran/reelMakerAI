import { useEditorStore } from "../store/useEditorStore";

export function Toolbar() {
  const { addElement } = useEditorStore();
  const { setAspectRatio, canvasWidth, canvasHeight } = useEditorStore();

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

      <div className="ml-4 flex items-center gap-2">
        <span className="text-sm text-gray-600">Canvas:</span>
        <button
          onClick={() => setAspectRatio("9:16")}
          className="px-2 py-1 border rounded text-sm bg-white hover:bg-gray-50"
        >
          9:16
        </button>
        <button
          onClick={() => setAspectRatio("16:9")}
          className="px-2 py-1 border rounded text-sm bg-white hover:bg-gray-50"
        >
          16:9
        </button>
        <div className="text-xs text-gray-500 ml-2">{canvasWidth}×{canvasHeight}</div>
      </div>
    </div>
  );
}
