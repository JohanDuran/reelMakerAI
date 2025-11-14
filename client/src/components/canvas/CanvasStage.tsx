// NOTE: we rely on the automatic JSX runtime; no default React import required
import { Stage, Layer, Group, Text, Rect, Transformer, Image as KonvaImage, Line } from 'react-konva';
// small local replacement for the `use-image` package to avoid resolution issues in dev environment
import React from 'react';
function useImage(src?: string | null, crossOrigin?: string | null) {
  const [image, setImage] = React.useState<HTMLImageElement | undefined>(undefined);
  React.useEffect(() => {
    if (!src) {
      setImage(undefined);
      return;
    }
    let mounted = true;
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => { if (mounted) setImage(img); };
    img.onerror = () => { if (mounted) setImage(undefined); };
    img.src = src;
    return () => { mounted = false; };
  }, [src, crossOrigin]);
  return [image];
}
import { useEditorStore } from '../../store/useEditorStore';

type Props = {
  canvasWidth: number;
  canvasHeight: number;
  elements: any[];
  selectedId: string | null;
  selectElement: (id: string | null) => void;
  updateElement: (id: string, updates: Partial<any>) => void;
  handleTransform: (id: string) => void;
  getElDefaults: (el: any) => { w: number; h: number };
  nodeRefsRef: React.MutableRefObject<Record<string, any>>;
  trRef: React.RefObject<any>;
  stageRef: React.RefObject<any>;
  handleDrag: (id: string, e: any) => void;
  editing: null | { id: string };
  setEditing: (v: any) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

// CanvasStage: renders the Konva Stage/Layer and all elements.
export function CanvasStage(props: Props) {
  const { canvasWidth, canvasHeight, elements, selectedId, selectElement, updateElement, handleTransform, getElDefaults, nodeRefsRef, trRef, stageRef, handleDrag, editing, setEditing, containerRef } = props;
  const { canvasBackground, setShowCanvaProperties } = useEditorStore();

  const boundBox = (_oldBox: any, newBox: any): any => {
    const MIN_SIZE = 25; // Set your desired minimum size

    // If the new width is too small, revert to the minimum size
    if (newBox.width < MIN_SIZE) {
      newBox.width = MIN_SIZE;
    }

    // If the new height is too small, revert to the minimum size
    if (newBox.height < MIN_SIZE) {
      newBox.height = MIN_SIZE;
    }

    // Return the modified box
    return newBox;
  };

  // Forward refs so parent can attach Konva transformer to the image node
  const URLImage = React.forwardRef(({ src, ...rest }: any, ref: any) => {
    // useImage handles loading the image and returns the DOM Image object
    const [image] = useImage(src, 'anonymous');

    // Pass the loaded DOM Image object to the KonvaImage component and forward the ref
    return <KonvaImage image={image} ref={ref} {...rest} />;
  });
  URLImage.displayName = 'URLImage';
  // images will use the element's `src` field (data URL or remote URL)

  return (
    <div style={{ position: 'relative', width: canvasWidth, height: canvasHeight, background: '#f3f4f6', boxShadow: '0 0 0 1px rgba(0,0,0,0.08) inset' }}>
      <Stage width={canvasWidth} height={canvasHeight} ref={stageRef}>
        <Layer>
          {/* Transparent background rect - clicking clears selection */}
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="transparent"
            onMouseDown={() => { selectElement(null); setShowCanvaProperties(true); }}
          />

          <Transformer
            ref={trRef}
            keepRatio={true}
            rotationSnapAngle={0}
            rotateEnabled={false}
            enabledAnchors={["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"]}
            flipEnabled={false}
            boundBoxFunc={boundBox}
          />

          {/* render canvas background first (if set) */}
          {canvasBackground && (
            <URLImage src={canvasBackground} x={0} y={0} width={canvasWidth} height={canvasHeight} listening={false} />
          )}

          {elements.map((el) => {
            if (el.type === 'text') {
              const { w, h } = getElDefaults(el);
              return (
                <>
                  <Text
                    key={el.id + '-text'}
                    text={el.text || 'Text'}
                    x={el.x}
                    ref={(n: any) => { if (n) nodeRefsRef.current[el.id] = n; else delete nodeRefsRef.current[el.id]; }}
                    width={el.width ?? w}
                    fontSize={el.fontSize ?? 24}
                    align={el.align ?? 'center'}
                    y={(el.y ?? 0) + (((el.height ?? h) - (el.fontSize ?? 24)) / 2)}
                    draggable
                    fill={el.fontColor ?? (el.id === selectedId ? 'blue' : 'black')}
                    fontFamily={el.fontFamily || 'Arial'}
                    fontStyle={`${el.bold ? 'bold' : ''} ${el.italic ? 'italic' : ''}`.trim() || 'normal'}
                    // Konva doesn't have a direct underline prop; we'll keep underline flag on the element
                    onClick={() => { selectElement(el.id); }}
                    visible={!(editing && editing.id === el.id)}
                    onTransform={() => handleTransform(el.id)}
                    onDblClick={(e: any) => {
                      const absPos = e.target.getAbsolutePosition();
                      const stageRect = stageRef.current?.container().getBoundingClientRect();
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      const left = (stageRect?.left || 0) + absPos.x - (containerRect?.left || 0);
                      const top = (stageRect?.top || 0) + absPos.y - (containerRect?.top || 0);
                      const width = e.target.width() || (el.width ?? w);
                      const height = e.target.height() || (el.height ?? h);
                      setEditing({ id: el.id, text: el.text || '', left, top, width, height });
                    }}
                    onDragEnd={(e) => handleDrag(el.id, e)}
                  />
                  {el.underline && (
                    <Line
                      points={[
                        (el.x ?? 0),
                        (el.y ?? 0) + (((el.height ?? h) - (el.fontSize ?? 24)) / 2) + (el.fontSize ?? 24) + 2,
                        (el.x ?? 0) + (el.width ?? w),
                        (el.y ?? 0) + (((el.height ?? h) - (el.fontSize ?? 24)) / 2) + (el.fontSize ?? 24) + 2,
                      ]}
                      stroke={el.fontColor ?? 'black'}
                      strokeWidth={2}
                      listening={false}
                    />
                  )}
                </>
              );
            }

            // Rectangle type: render a colored rect and an overlaid Text for its label/content.
            if (el.type === 'rectangle') {
              const { w, h } = getElDefaults(el);
              return (
                <>
                  <Group
                    key={el.id + '-group'}
                    x={el.x}
                    y={el.y}
                    draggable
                    ref={(n: any) => { if (n) nodeRefsRef.current[el.id] = n; else delete nodeRefsRef.current[el.id]; }}
                    onClick={() => { selectElement(el.id); }}
                    onDragEnd={(e: any) => handleDrag(el.id, e)}
                    onTransform={() => handleTransform(el.id)}
                    onDblClick={(e: any) => {
                      const absPos = e.target.getAbsolutePosition();
                      const stageRect = stageRef.current?.container().getBoundingClientRect();
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      const left = (stageRect?.left || 0) + absPos.x - (containerRect?.left || 0);
                      const top = (stageRect?.top || 0) + absPos.y - (containerRect?.top || 0);
                      const width = e.target.width ? e.target.width() : (el.width || w);
                      const height = e.target.height ? e.target.height() : (el.height || h);
                      setEditing({ id: el.id, text: el.text || '', left, top, width, height });
                    }}
                  >
                    <Rect
                      key={el.id + '-rect'}
                      x={0}
                      y={0}
                      width={el.width || w}
                      height={el.height || h}
                      cornerRadius={el.cornerRadius || 0}
                      fill={el.fillColor ?? (el.id === selectedId ? '#e2e8f0' : '#c7d2fe')}
                      stroke={el.id === selectedId ? '#6366f1' : undefined}
                      strokeWidth={el.id === selectedId ? 2 : 0}
                    />

                    {/* Show text over the rectangle; hide while inline editing. Text doesn't handle dragging now. */}
                    <Text
                      key={el.id + '-label'}
                      text={el.text || ''}
                      x={0}
                      y={((el.height ?? h) - (el.fontSize ?? 16)) / 2}
                      width={el.width ?? w}
                      fontSize={el.fontSize ?? 16}
                      align={el.align ?? 'center'}
                      fill={el.fontColor ?? 'black'}
                      visible={!(editing && editing.id === el.id)}
                      fontFamily={el.fontFamily || 'Arial'}
                      fontStyle={`${el.bold ? 'bold' : ''} ${el.italic ? 'italic' : ''}`.trim() || 'normal'}
                    />
                    {el.underline && (
                      <Line
                        points={[0, ((el.height ?? h) - (el.fontSize ?? 16)) / 2 + (el.fontSize ?? 16) + 2, (el.width ?? w), ((el.height ?? h) - (el.fontSize ?? 16)) / 2 + (el.fontSize ?? 16) + 2]}
                        stroke={el.fontColor ?? 'black'}
                        strokeWidth={2}
                        listening={false}
                      />
                    )}
                  </Group>
                </>
              );
            }

            if (el.type === 'image') {
              const src = el.src || null;
              return (
                <>
                  {src ? (
                    <URLImage
                      src={src}
                      x={el.x}
                      y={el.y}
                      ref={(n: any) => { if (n) nodeRefsRef.current[el.id] = n; else delete nodeRefsRef.current[el.id]; }}
                        width={el.width || 120}
                      height={el.height || 80}
                      draggable
                        onClick={() => { selectElement(el.id); }}
                      onDragEnd={(e: any) => handleDrag(el.id, e)}
                      onTransform={() => handleTransform(el.id)}
                    />
                  ) : (
                    // placeholder rect with upload hint when no image is selected
                    <Rect
                      x={el.x}
                      y={el.y}
                      width={el.width || 120}
                      height={el.height || 80}
                      fill="#efefef"
                      stroke="#ccc"
                      dash={[4, 4]}
                      onClick={() => { selectElement(el.id); }}
                    />
                  )}
                </>
              );
            }

            // AI-generated image placeholder: behaves like a rectangle with a centered label
            if (el.type === 'aiImage') {
              const { w, h } = getElDefaults(el);
              return (
                <>
                  <Group
                    key={el.id + '-aiimg'}
                    x={el.x}
                    y={el.y}
                    draggable
                    ref={(n: any) => { if (n) nodeRefsRef.current[el.id] = n; else delete nodeRefsRef.current[el.id]; }}
                    onClick={() => { selectElement(el.id); }}
                    onDragEnd={(e: any) => handleDrag(el.id, e)}
                    onTransform={() => handleTransform(el.id)}
                    onDblClick={(e: any) => {
                      const absPos = e.target.getAbsolutePosition();
                      const stageRect = stageRef.current?.container().getBoundingClientRect();
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      const left = (stageRect?.left || 0) + absPos.x - (containerRect?.left || 0);
                      const top = (stageRect?.top || 0) + absPos.y - (containerRect?.top || 0);
                      const width = e.target.width ? e.target.width() : (el.width || w);
                      const height = e.target.height ? e.target.height() : (el.height || h);
                      setEditing({ id: el.id, text: el.text || '', left, top, width, height });
                    }}
                  >
                    <Rect
                      key={el.id + '-rect'}
                      x={0}
                      y={0}
                      width={el.width || w}
                      height={el.height || h}
                      cornerRadius={el.cornerRadius || 0}
                      fill={el.fillColor ?? '#f8fafc'}
                      stroke={el.id === selectedId ? '#6366f1' : undefined}
                      strokeWidth={el.id === selectedId ? 2 : 0}
                      dash={[6, 6]}
                    />
                    <Text
                      key={el.id + '-ai-label'}
                      text={'AI image'}
                      x={0}
                      y={((el.height ?? h) - (el.fontSize ?? 16)) / 2}
                      width={el.width ?? w}
                      fontSize={16}
                      align={'center'}
                      fill={'rgba(0,0,0,0.45)'}
                      visible={!(editing && editing.id === el.id)}
                      fontFamily={el.fontFamily || 'Arial'}
                    />
                  </Group>
                </>
              );
            }
            
            return null;
          })}
        </Layer>
      </Stage>
      {/* HTML overlays for image placeholders so users can click Upload directly on canvas */}
      {/* HTML overlays for image placeholders so users can click Upload directly on canvas */}
      {elements.filter((e) => e.type === 'image' && !e.src).map((el) => (
        <div
          key={el.id + '-upload'}
          onClick={() => { selectElement(el.id); }}
          onMouseDown={(ev) => {
            // allow clicking on nested controls (label/input/button) without starting a drag
            const tgt = ev.target as HTMLElement | null;
            if (tgt && (tgt.closest('label') || tgt.closest('input') || tgt.closest('button'))) return;
            // start drag
            ev.stopPropagation();
            selectElement(el.id);
            const rect = containerRef.current?.getBoundingClientRect();
            const scale = rect ? rect.width / canvasWidth : 1;
            const startX = ev.clientX;
            const startY = ev.clientY;
            const origX = el.x || 0;
            const origY = el.y || 0;

            const onMove = (m: MouseEvent) => {
              const dx = (m.clientX - startX) / scale;
              const dy = (m.clientY - startY) / scale;
              updateElement(el.id, { x: Math.max(0, Math.round(origX + dx)), y: Math.max(0, Math.round(origY + dy)) });
            };

            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
          style={{ position: 'absolute', left: el.x || 0, top: el.y || 0, width: (el.width || 120), height: (el.height || 80), display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.92)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (ev) => {
                  const f = (ev.target as HTMLInputElement).files?.[0];
                  if (!f) return;
                  const result = await (await import('../../utils/readFile')).readFileAsDataURL(f);
                  const img = new Image();
                  img.onload = () => {
                    updateElement(el.id, { src: result, width: img.naturalWidth, height: img.naturalHeight });
                  };
                  img.src = result;
                }}
              />
              Upload
            </label>

            {/* delete button removed: individual deletion of elements is managed via group deletion or other UI controls */}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CanvasStage;
