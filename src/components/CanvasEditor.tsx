import { Stage, Layer, Text, Rect } from "react-konva";
import { useEditorStore } from "../store/useEditorStore";
import { ContextMenu } from "./ContextMenu";
import { useState } from "react";

export function CanvasEditor() {
  const { elements, updateElement, selectElement, selectedId } = useEditorStore();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleDrag = (id: string, e: any) => {
    updateElement(id, { x: e.target.x(), y: e.target.y() });
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.evt.preventDefault();
    setMenuPos({ x: e.evt.clientX, y: e.evt.clientY });
  };

  return (
    <div
      className="relative border rounded-lg shadow-sm bg-white"
      onContextMenu={handleRightClick}
      style={{ width: 800, height: 450 }}
    >
      <Stage width={800} height={450}>
        <Layer>
          {elements.map((el) => {
            if (el.type === "text")
              return (
                <Text
                  key={el.id}
                  text={el.text || "Text"}
                  x={el.x}
                  y={el.y}
                  fontSize={24}
                  draggable
                  fill={el.id === selectedId ? "blue" : "black"}
                  onClick={() => selectElement(el.id)}
                  onDragEnd={(e) => handleDrag(el.id, e)}
                />
              );
            if (el.type === "image")
              return (
                <Rect
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width || 120}
                  height={el.height || 80}
                  fill={el.id === selectedId ? "#aaa" : "lightgray"}
                  draggable
                  onClick={() => selectElement(el.id)}
                  onDragEnd={(e) => handleDrag(el.id, e)}
                />
              );
            return null;
          })}
        </Layer>
      </Stage>

      {menuPos && <ContextMenu position={menuPos} onClose={() => setMenuPos(null)} />}
    </div>
  );
}
