import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from "../store/useEditorStore";
import { ContextMenu } from "./ContextMenu";
import CanvasStage from './canvas/CanvasStage';
import CanvasControls from './canvas/CanvasControls';
import InlineTextEditor from './canvas/InlineTextEditor';
import './canvas/CanvasEditor.css';
import CardPanel from './ui/CardPanel';

export function CanvasEditor() {
  const { elements, updateElement, selectElement, selectedId, canvasWidth, canvasHeight, setAspectRatio } = useEditorStore();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  // refs used by the stage and for measuring parent width
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const nodeRefsRef = useRef<Record<string, any>>({});
  const trRef = useRef<any>(null);
  const [editing, setEditing] = useState<null | { id: string; text?: string; left: number; top: number; width: number; height: number }>(null);
  // canvas properties visibility is now controlled when selecting elements via the store
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
      // Use parent width but constrain available height to the viewport height so canvas always fits the screen
      const availW = parent ? Math.max(200, parent.clientWidth - paddingW) : Math.max(200, window.innerWidth - paddingW);
      const viewportH = Math.max(200, window.innerHeight - paddingH);
      // don't rely on parent's height; use viewport height to avoid scrollbars and force scaling to fit
      const availH = viewportH;
      const targetW = canvasWidth + 40; // include outer padding used in layout
      const targetH = canvasHeight + 40;
      const f = Math.min(1, availW / targetW, availH / targetH);
      // collect some DOM sizes for debugging
      const containerH = containerRef.current?.clientHeight ?? null;
      const parentH = parent?.clientHeight ?? null;
      const info = { availW, availH, targetW, targetH, scale: f, containerH, parentH };
      // log to console to aid debugging in browser
      // eslint-disable-next-line no-console
      console.debug('[CanvasEditor] scale compute', info);
      setDebugInfo(info);
      setScale(f);
    };

    compute();
    let ro: ResizeObserver | null = null;
    // observe window resizes so we can recompute scale when viewport changes
    if (typeof ResizeObserver !== 'undefined' && wrapperRef.current?.parentElement) {
      ro = new ResizeObserver(() => compute());
      ro.observe(wrapperRef.current.parentElement);
    }
    window.addEventListener('resize', compute);

    return () => {
      if (ro && wrapperRef.current?.parentElement) ro.unobserve(wrapperRef.current.parentElement);
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
      if (e.key === 'Delete') {
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

  // ESC key: show canvas properties and clear selection
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const { setShowCanvaProperties, selectElement } = useEditorStore.getState();
        selectElement(null);
        setShowCanvaProperties(true);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  // Click outside the canvas: when user clicks outside the canvas container, show canvas properties
  // (Removed) clicking anywhere on the page no longer opens canvas properties.
  // Canvas properties are opened by pressing ESC or by clicking a blank area inside the canvas.

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

  // Compute sensible defaults for element width/height
  const getElDefaults = (el: any) => {
    const defaultW = el.width ?? (el.type === 'text' ? Math.max(80, Math.min(600, (el.text?.length || 0) * 8)) : 120);
    const defaultH = el.height ?? (el.type === 'text' ? 30 : 80);
    return { w: defaultW, h: defaultH };
  };

  // Update element position after drag end
  const handleDrag = (id: string, e: any) => {
    updateElement(id, { x: e.target.x(), y: e.target.y() });
  };

  // NOTE: manual corner resize handler removed; resizing is handled by Transformer for text

  return (
    <div className="canvas-wrapper" ref={wrapperRef}>
      {/* scaled wrapper - pointerEvents none so controls are interactive */}
      <div className="canvas-scaled" style={{ transform: `scale(${scale})`, pointerEvents: 'none' }}>
        <div
          ref={containerRef}
          className="canvas-container relative border rounded-lg shadow-sm flex justify-center items-center"
          onContextMenu={(e) => { e.preventDefault(); setMenuPos({ x: (e as any).clientX, y: (e as any).clientY }); }}
          style={{ width: canvasWidth + 40, height: canvasHeight + 40, pointerEvents: 'auto' }}
        >
          {/* Controls rendered at the edge of the canvas so they appear partially inside/outside */}
          <CanvasControls canvasWidth={canvasWidth} canvasHeight={canvasHeight} setAspectRatio={setAspectRatio} />
          {/* Canva button removed - canvas properties are shown automatically when an element is selected */}
          {/* Controls rendered outside the stage but inside the canvas container */}

          {/* Selection badge - shows a small badge for the selected element */}
          {selectedId && (() => {
            const el = elements.find((x) => x.id === selectedId);
            if (!el) return null;
            return (
              <div style={{ position: 'absolute', right: 120, top: -28 }}>
                <CardPanel style={{ display: 'inline-flex', padding: '6px 8px', borderRadius: 6 }}>
                  <div style={{ fontSize: 12 }}>{el.type === 'text' ? `Text — ${el.fontSize || 24}px` : `Image — ${el.width || 0}×${el.height || 0}`}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 8 }}>(Del)</div>
                </CardPanel>
              </div>
            );
          })()}

          {/* Delegated stage rendering */}
          <CanvasStage
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            elements={elements}
            selectedId={selectedId}
            selectElement={selectElement}
            updateElement={updateElement}
            handleTransform={handleTransform}
            getElDefaults={getElDefaults}
            nodeRefsRef={nodeRefsRef}
            trRef={trRef}
            stageRef={stageRef}
            handleDrag={handleDrag}
            editing={editing}
            setEditing={setEditing}
            containerRef={containerRef}
          />

          {/* Inline editor delegated to its own component */}
          <InlineTextEditor editing={editing} elements={elements} updateElement={updateElement} setEditing={setEditing} />

          {/* Debug overlay - removed in production; helps identify sizing constraints */}
          {debugInfo && (
            <div style={{ position: 'absolute', left: 8, bottom: 8, background: 'rgba(0,0,0,0.7)', color: 'white', padding: 8, borderRadius: 6, fontSize: 11, pointerEvents: 'none' }}>
              <div>scale: {debugInfo.scale.toFixed(3)}</div>
              <div>availW: {debugInfo.availW}, availH: {debugInfo.availH}</div>
              <div>targetW: {debugInfo.targetW}, targetH: {debugInfo.targetH}</div>
              <div>containerH: {debugInfo.containerH}, parentH: {debugInfo.parentH}</div>
            </div>
          )}

          {/* Context menu (rendered when menuPos is set) */}
          {menuPos && <ContextMenu position={menuPos} onClose={() => setMenuPos(null)} />}
          {/* canvas properties are rendered in the ElementInspector now */}
        </div>
      </div>
    </div>
  );
}
