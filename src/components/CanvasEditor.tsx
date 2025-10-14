import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Text, Rect, Transformer } from "react-konva";
import { useEditorStore } from "../store/useEditorStore";
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { ContextMenu } from "./ContextMenu";

export function CanvasEditor() {
  const { elements, updateElement, selectElement, selectedId, canvasWidth, canvasHeight, setAspectRatio } = useEditorStore();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // ref attached to the component root so we can measure the parent (the Grid item)
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
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

  // compute scale so the canvas fits within the parent Grid column (preserve aspect ratio)
  useEffect(() => {
    const compute = () => {
      const parent = wrapperRef.current?.parentElement as HTMLElement | null;
      const paddingW = 32; // small padding inside grid column
      const paddingH = 40;
      const availW = parent ? Math.max(200, parent.clientWidth - paddingW) : Math.max(200, window.innerWidth - paddingW);
      const availH = parent ? Math.max(200, parent.clientHeight - paddingH) : Math.max(200, window.innerHeight - paddingH);
      const targetW = canvasWidth + 40; // include outer padding used in layout
      const targetH = canvasHeight + 40;
      const f = Math.min(1, availW / targetW, availH / targetH);
      setScale(f);
    };

    compute();
    let ro: ResizeObserver | null = null;
    const parent = wrapperRef.current?.parentElement as HTMLElement | null;
    if (parent && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => compute());
      ro.observe(parent);
    } else {
      window.addEventListener('resize', compute);
    }

    return () => {
      if (ro && parent) ro.unobserve(parent);
      window.removeEventListener('resize', compute);
    };
  }, [canvasWidth, canvasHeight]);

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
        const calculatedW = Math.max(1, Math.round((elNow.width ?? defaultW) * scaleX));
        // compute sensible minimum width for text: at least a few characters wide
        const font = elNow.fontSize ?? 24;
        const approxCharWidth = Math.max(4, Math.round(font * 0.55));
        const minFromText = Math.max(10, (elNow.text ? Math.round((elNow.text.length || 1) * approxCharWidth * 0.25) : 10));
        const minW = Math.max(10, minFromText);
        const newW = Math.max(minW, calculatedW);
        // if we clamped up and the active anchor is middle-left, move x accordingly so left handle doesn't cross right
        if (activeAnchor === 'middle-left') {
          const rightEdge = (elNow.x ?? 0) + (elNow.width ?? defaultW);
          const newX = Math.round(rightEdge - newW);
          node.width(newW);
          node.scaleX(1);
          updateElement(id, { x: newX, width: newW });
        } else {
          node.width(newW);
          node.scaleX(1);
          updateElement(id, { width: newW });
        }
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
        const calculatedW = Math.max(1, Math.round((elNow.width ?? defaultW) * scaleX));
        const minW = 20; // images minimum width
        const newW = Math.max(minW, calculatedW);
        if (activeAnchor === 'middle-left') {
          const rightEdge = (elNow.x ?? 0) + (elNow.width ?? defaultW);
          const x = Math.round(rightEdge - newW);
          updateElement(id, { width: newW, x });
        } else {
          const x = Math.round(node.x());
          updateElement(id, { width: newW, x });
        }
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

  // handle Delete key to remove selected element
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          // remove element from store
          // import the removeElement action lazily to avoid circular issues
          const { removeElement } = useEditorStore.getState();
          removeElement(selectedId);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

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
    <div ref={wrapperRef} style={{ height: '100%' }}>
      {/* prevent the scaled wrapper from intercepting pointer events so dropdowns/buttons remain clickable */}
      <div style={{ transformOrigin: 'top left', transform: `scale(${scale})`, pointerEvents: 'none' }}>
      <div
        ref={containerRef}
        className="relative border rounded-lg shadow-sm bg-gray-100 flex justify-center items-center"
        onContextMenu={(e) => { e.preventDefault(); setMenuPos({ x: (e as any).clientX, y: (e as any).clientY }); }}
        style={{ width: canvasWidth + 40, height: canvasHeight + 40, pointerEvents: 'auto' }}
      >
        {/* Aspect ratio dropdown (upper-right, outside canvas) */}
  <div style={{ position: 'absolute', right: -60, top: 8, zIndex: 2000, pointerEvents: 'auto' }}>
          <FormControl size="small" variant="outlined" style={{ minWidth: 96, background: 'white', borderRadius: 6 }}>
            <InputLabel id="aspect-select-label">Ratio</InputLabel>
            <Select
              labelId="aspect-select-label"
              value={canvasHeight > canvasWidth ? '9:16' : '16:9'}
              label="Ratio"
              onChange={(e: any) => setAspectRatio(e.target.value as '9:16' | '16:9')}
              MenuProps={{ disablePortal: true }}
            >
              <MenuItem value="9:16">9:16</MenuItem>
              <MenuItem value="16:9">16:9</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Selection badge (outside top-right of canvas) */}
        {selectedId && (() => {
          const el = elements.find((x) => x.id === selectedId);
          if (!el) return null;
          return (
            <div style={{ position: 'absolute', right: 120, top: -28 }}>
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', padding: '6px 8px', borderRadius: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', fontSize: 12 }}>
                {el.type === 'text' ? `Text — ${el.fontSize || 24}px` : `Image — ${el.width || 0}×${el.height || 0}`} &nbsp;
                <span style={{ color: '#888' }}>(Del)</span>
              </div>
            </div>
          );
        })()}
  {/* canvas area */}
  <div style={{ width: canvasWidth, height: canvasHeight, background: "#f3f4f6", boxShadow: "0 0 0 1px rgba(0,0,0,0.08) inset" }}>
        <Stage width={canvasWidth} height={canvasHeight} ref={stageRef}>
          <Layer>
            {/* transparent background rect to detect clicks on empty canvas and clear selection */}
            <Rect
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill="transparent"
              onMouseDown={() => { selectElement(null); setMenuPos(null); }}
            />

            {/* Transformer for selected text nodes. Keep corner anchors and middle handles for user control. */}
            <Transformer
              ref={trRef}
              keepRatio={true}
              // disable rotation affordance
              rotationSnapAngle={0}
              rotateEnabled={false}
              // keep corner anchors and middle side anchors; top-center/bottom-center removed
              enabledAnchors={["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"]}
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
    </div>
    </div>
  );
}
