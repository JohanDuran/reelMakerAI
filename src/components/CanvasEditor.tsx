import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Text, Rect, Transformer } from "react-konva";
import { useEditorStore } from "../store/useEditorStore";
import { ContextMenu } from "./ContextMenu";

export function CanvasEditor() {
  const { elements, updateElement, selectElement, selectedId, canvasWidth, canvasHeight } = useEditorStore();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefsRef = useRef<Record<string, any>>({});
  const trRef = useRef<any>(null);
  const [editing, setEditing] = useState<null | { id: string; text: string; left: number; top: number; width: number; height: number }>(null);
  const measureQueueRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const prevFontsRef = useRef<Record<string, number>>({});

  const processMeasureQueue = (modeMap?: Record<string, "fitFont" | "updateBox">) => {
    rafRef.current = null;
    const ids = Array.from(measureQueueRef.current);
    measureQueueRef.current.clear();
    ids.forEach((rid) => {
      const node = nodeRefsRef.current[rid];
      if (!node || typeof node.height !== "function") return;
      const measured = node.height();
      const elNow = elements.find((x) => x.id === rid);
      if (!elNow) return;
      const mode = modeMap?.[rid] || "fitFont";
      if (mode === "updateBox") {
        if (measured && measured !== elNow.height) updateElement(rid, { height: measured });
        return;
      }
      const boxH = elNow.height ?? measured;
      const currentFont = elNow.fontSize ?? 24;
      if (measured > boxH) {
        const ratio = boxH / measured;
        const newFont = Math.max(8, Math.round(currentFont * ratio));
        if (newFont !== elNow.fontSize) updateElement(rid, { fontSize: newFont });
      } else if (measured < boxH) {
        const ratio = boxH / measured;
        if (ratio > 1.02) {
          const newFont = Math.min(72, Math.round(currentFont * ratio));
          if (newFont !== elNow.fontSize) updateElement(rid, { fontSize: newFont });
        }
      }
    });
  };

  const scheduleMeasure = (id: string, mode: "fitFont" | "updateBox" = "fitFont") => {
    measureQueueRef.current.add(id);
    const modeMap: Record<string, "fitFont" | "updateBox"> = {};
    measureQueueRef.current.forEach((i) => (modeMap[i] = "fitFont"));
    modeMap[id] = mode;
    if (rafRef.current == null) {
      rafRef.current = window.requestAnimationFrame(() => processMeasureQueue(modeMap));
    }
  };

  // attach transformer to selected node (text or image)
  useEffect(() => {
    const node = selectedId ? nodeRefsRef.current[selectedId] : null;
    if (trRef.current) {
      if (node && node.getStage()) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
      } else {
        trRef.current.nodes([]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId, elements]);

  // smooth transform handler: convert scale to fontSize and reset scale
  const handleTransform = (id: string) => {
    const node = nodeRefsRef.current[id];
    if (!node) return;
    const elNow = elements.find((x) => x.id === id);
    if (!elNow) return;
    // determine the active anchor on the transformer (if any)
    const activeAnchor = trRef.current?.getActiveAnchor ? trRef.current.getActiveAnchor() : null;
    if (elNow.type === "text") {
      // If the user is dragging middle-left/right, only update width (keep fontSize unchanged).
      // If the user is dragging top-center/bottom-center, only update height (keep fontSize unchanged).
      const defaultW = elNow.width ?? Math.max(80, Math.min(600, (elNow.text?.length || 0) * 8));
      const defaultH = elNow.height ?? 30;
      if (activeAnchor === 'middle-left' || activeAnchor === 'middle-right') {
        const scaleX = node.scaleX() || 1;
        const newW = Math.max(10, Math.round((elNow.width ?? defaultW) * scaleX));
        node.width(newW);
        node.scaleX(1);
        // update width only; schedule a box update so height aligns
        updateElement(id, { width: newW });
        scheduleMeasure(id, 'updateBox');
      } else if (activeAnchor === 'top-center' || activeAnchor === 'bottom-center') {
        const scaleY = node.scaleY() || 1;
        const newH = Math.max(10, Math.round((elNow.height ?? defaultH) * scaleY));
        node.height(newH);
        node.scaleY(1);
        updateElement(id, { height: newH });
      } else {
        // Use the node's scale to compute new font size and width, but don't overwrite x/y here
        const scaleX = node.scaleX() || 1;
        const scaleY = node.scaleY() || 1;
        const scale = (scaleX + scaleY) / 2;
        const currentFont = elNow.fontSize ?? 24;
        const newFont = Math.max(6, Math.round(currentFont * scale));

        const newW = Math.max(10, Math.round((elNow.width ?? defaultW) * scale));

        // apply directly to node: set width and fontSize, then reset scale
        node.width(newW);
        node.fontSize(newFont);
        node.scaleX(1);
        node.scaleY(1);

        // measure the rendered height after applying fontSize
        const measuredH = typeof node.height === 'function' ? node.height() : (elNow.height ?? 30);

        // update store (do not change x/y here to avoid jumps)
        updateElement(id, { fontSize: newFont, width: newW, height: measuredH });
      }
    } else {
      // image or other shapes: allow independent scaleX/scaleY and rotation
      const scaleX = node.scaleX() || 1;
      const scaleY = node.scaleY() || 1;
      const defaultW = elNow.width ?? 120;
      const defaultH = elNow.height ?? 80;
      if (activeAnchor === 'middle-left' || activeAnchor === 'middle-right') {
        const newW = Math.max(10, Math.round((elNow.width ?? defaultW) * scaleX));
        const x = Math.round(node.x());
        updateElement(id, { width: newW, x });
        node.scaleX(1);
      } else if (activeAnchor === 'top-center' || activeAnchor === 'bottom-center') {
        const newH = Math.max(10, Math.round((elNow.height ?? defaultH) * scaleY));
        const y = Math.round(node.y());
        updateElement(id, { height: newH, y });
        node.scaleY(1);
      } else {
        const newW = Math.max(10, Math.round((elNow.width ?? defaultW) * scaleX));
        const newH = Math.max(10, Math.round((elNow.height ?? defaultH) * scaleY));
        const x = Math.round(node.x());
        const y = Math.round(node.y());
        updateElement(id, { width: newW, height: newH, x, y });
        node.scaleX(1);
        node.scaleY(1);
      }
    }
  };

  // when fontSize is changed via inspector, measure and update box height so handles move
  useEffect(() => {
    elements.forEach((el) => {
      if (el.type === "text") {
        const prev = prevFontsRef.current[el.id];
        if (prev !== el.fontSize) {
          prevFontsRef.current[el.id] = el.fontSize ?? 24;
          scheduleMeasure(el.id, "updateBox");
        }
      }
    });
  }, [elements]);

  const getElDefaults = (el: any) => {
    const defaultW = el.width ?? (el.type === "text" ? Math.max(80, Math.min(600, (el.text?.length || 0) * 8)) : 120);
    const defaultH = el.height ?? (el.type === "text" ? 30 : 80);
    return { w: defaultW, h: defaultH };
  };

  const handleDrag = (id: string, e: any) => {
    updateElement(id, { x: e.target.x(), y: e.target.y() });
  };

  // NOTE: manual corner resize handler removed; resizing is handled by Transformer for text

  return (
    <div
      ref={containerRef}
      className="relative border rounded-lg shadow-sm bg-gray-100 flex justify-center items-center"
      onContextMenu={(e) => { e.preventDefault(); setMenuPos({ x: (e as any).clientX, y: (e as any).clientY }); }}
      style={{ width: canvasWidth + 40, height: canvasHeight + 40 }}
    >
      {/* canvas area */}
      <div style={{ width: canvasWidth, height: canvasHeight, background: "white", boxShadow: "0 0 0 1px rgba(0,0,0,0.08) inset" }}>
        <Stage width={canvasWidth} height={canvasHeight} ref={stageRef}>
          <Layer>
            {/* Transformer for selected text nodes. Keep corner anchors but also add middle-left/right anchors
                so the user can resize horizontally only without changing text font size. */}
            <Transformer
              ref={trRef}
              keepRatio={true}
              // keep corners and add top-center/bottom-center for height-only control
              enabledAnchors={["top-left", "top-center", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-center", "bottom-right"]}
            />
            {elements.map((el) => {
              if (el.type === "text") {
                const { w, h } = getElDefaults(el);
                return (
                  <React.Fragment key={el.id}>
                    <Text
                      key={el.id + "-text"}
                      text={el.text || "Text"}
                      // place text box at element x and use element width so align works
                      x={el.x}
                      ref={(n) => { if (n) nodeRefsRef.current[el.id] = n; else delete nodeRefsRef.current[el.id]; }}
                      width={el.width ?? w}
                      // allow height to be dynamic; fontSize remains default
                      fontSize={el.fontSize ?? 24}
                      align="center"
                      // vertically center text inside the element using the element's font size
                      y={(el.y ?? 0) + (((el.height ?? h) - (el.fontSize ?? 24)) / 2)}
                      draggable
                      fill={el.id === selectedId ? "blue" : "black"}
                      onClick={() => selectElement(el.id)}
                      visible={!(editing && editing.id === el.id)}
                      onTransform={() => handleTransform(el.id)}
                      onDblClick={(e) => {
                        // show inline editor
                        const absPos = e.target.getAbsolutePosition();
                        const stageRect = stageRef.current?.container().getBoundingClientRect();
                        const containerRect = containerRef.current?.getBoundingClientRect();
                        const left = (stageRect?.left || 0) + absPos.x - (containerRect?.left || 0);
                        const top = (stageRect?.top || 0) + absPos.y - (containerRect?.top || 0);
                        const width = e.target.width() || (el.width ?? w);
                        const height = e.target.height() || (el.height ?? h);
                        setEditing({ id: el.id, text: el.text || "", left, top, width, height });
                      }}
                      onDragEnd={(e) => handleDrag(el.id, e)}
                    />
                    {el.id === selectedId && (
                      <>
                        {/* For text we rely on Transformer for resizing; no L-corner handles needed */}
                      </>
                    )}
                  </React.Fragment>
                );
              }
              if (el.type === "image")
                return (
                  <>
                    <Rect
                      key={el.id}
                      x={el.x}
                      y={el.y}
                      width={el.width || 120}
                      height={el.height || 80}
                      ref={(n) => { if (n) nodeRefsRef.current[el.id] = n; else delete nodeRefsRef.current[el.id]; }}
                      fill={el.id === selectedId ? "#aaa" : "lightgray"}
                      draggable
                      onClick={() => selectElement(el.id)}
                      onDragEnd={(e) => handleDrag(el.id, e)}
                      onTransform={() => handleTransform(el.id)}
                    />
                    {el.id === selectedId && (
                      <>
                        {/* image handles unchanged */}
                      </>
                    )}
                  </>
                );
              return null;
            })}
          </Layer>
        </Stage>
      </div>

      {/* inline editor for text elements */}
      {editing && (() => {
        const el = elements.find((x) => x.id === editing.id);
        return (
          <div
            key={editing.id}
            style={{
              position: "absolute",
              left: editing.left,
              top: editing.top,
              width: editing.width,
              zIndex: 50,
            }}
          >
            <textarea
              autoFocus
              value={editing.text}
              onChange={(e) => {
                const txt = e.target.value;
                setEditing({ ...editing, text: txt });
                updateElement(editing.id, { text: txt });
              }}
              onBlur={() => setEditing(null)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(null);
              }}
              style={{
                width: "100%",
                minHeight: editing.height,
                resize: "vertical",
                fontSize: (el?.fontSize || 24) + "px",
                lineHeight: "1.1",
                fontFamily: "inherit",
                background: "transparent",
                border: "1px solid rgba(0,0,0,0.12)",
                padding: "2px",
              }}
            />
          </div>
        );
      })()}

      {menuPos && <ContextMenu position={menuPos} onClose={() => setMenuPos(null)} />}
    </div>
  );
}
