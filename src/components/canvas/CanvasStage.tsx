// NOTE: we rely on the automatic JSX runtime; no default React import required
import { Stage, Layer, Text, Rect, Transformer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
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

  const URLImage = ({ src, ...rest }: any) => {
    // useImage handles loading the image and returns the DOM Image object
    const [image] = useImage(src, 'anonymous');

    // Pass the loaded DOM Image object to the KonvaImage component
    return <KonvaImage image={image} {...rest} />;
  };
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
            onMouseDown={() => { selectElement(null); }}
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
                    align="center"
                    y={(el.y ?? 0) + (((el.height ?? h) - (el.fontSize ?? 24)) / 2)}
                    draggable
                    fill={el.id === selectedId ? 'blue' : 'black'}
                    onClick={() => selectElement(el.id)}
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
                </>
              );
            }

            // Rectangle type: render a colored rect and an overlaid Text for its label/content.
            if (el.type === 'rectangle') {
              const { w, h } = getElDefaults(el);
              return (
                <>
                  <Rect
                    key={el.id + '-rect'}
                    x={el.x}
                    y={el.y}
                    width={el.width || w}
                    height={el.height || h}
                    ref={(n) => { if (n) nodeRefsRef.current[el.id] = n; else delete nodeRefsRef.current[el.id]; }}
                    fill={el.fillColor ?? (el.id === selectedId ? '#e2e8f0' : '#c7d2fe')}
                    stroke={el.id === selectedId ? '#6366f1' : undefined}
                    strokeWidth={el.id === selectedId ? 2 : 0}
                    draggable
                    onClick={() => selectElement(el.id)}
                    onDragEnd={(e) => handleDrag(el.id, e)}
                    onTransform={() => handleTransform(el.id)}
                    onDblClick={(e) => {
                      // open inline editor positioned over the rectangle
                      const absPos = e.target.getAbsolutePosition();
                      const stageRect = stageRef.current?.container().getBoundingClientRect();
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      const left = (stageRect?.left || 0) + absPos.x - (containerRect?.left || 0);
                      const top = (stageRect?.top || 0) + absPos.y - (containerRect?.top || 0);
                      const width = e.target.width() || (el.width || w);
                      const height = e.target.height() || (el.height || h);
                      setEditing({ id: el.id, text: el.text || '', left, top, width, height });
                    }}
                  />

                  {/* Show text over the rectangle; hide while inline editing */}
                  <Text
                    key={el.id + '-label'}
                    text={el.text || ''}
                    x={el.x}
                    y={(el.y ?? 0) + (((el.height ?? h) - (el.fontSize ?? 16)) / 2)}
                    width={el.width ?? w}
                    fontSize={el.fontSize ?? 16}
                    align={el.align ?? 'center'}
                    fill={el.fontColor ?? 'black'}
                    visible={!(editing && editing.id === el.id)}
                    onClick={() => selectElement(el.id)}
                    onDblClick={(e: any) => {
                      const absPos = e.target.getAbsolutePosition();
                      const stageRect = stageRef.current?.container().getBoundingClientRect();
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      const left = (stageRect?.left || 0) + absPos.x - (containerRect?.left || 0);
                      const top = (stageRect?.top || 0) + absPos.y - (containerRect?.top || 0);
                      const width = e.target.width() || (el.width || w);
                      const height = e.target.height() || (el.height || h);
                      setEditing({ id: el.id, text: el.text || '', left, top, width, height });
                    }}
                  />
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
                      onClick={() => selectElement(el.id)}
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
                      onClick={() => selectElement(el.id)}
                    />
                  )}
                </>
              );
            }
            
            return null;
          })}
        </Layer>
      </Stage>
      {/* HTML overlays for image placeholders so users can click Upload directly on canvas */}
      {elements.filter((e) => e.type === 'image' && !e.src).map((el) => (
        <div key={el.id + '-upload'} style={{ position: 'absolute', left: el.x || 0, top: el.y || 0, width: (el.width || 120), height: (el.height || 80), display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.92)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(ev) => {
                  const f = (ev.target as HTMLInputElement).files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
                    const img = new Image();
                    img.onload = () => {
                      updateElement(el.id, { src: result, width: img.naturalWidth, height: img.naturalHeight });
                    };
                    img.src = result;
                  };
                  reader.readAsDataURL(f);
                }}
              />
              Upload
            </label>

            {/* delete button top-right inside the overlay */}
            <button
              onClick={(ev) => {
                ev.stopPropagation();
                const state = useEditorStore.getState();
                state.removeElement(el.id);
              }}
              title="Delete element"
              style={{ position: 'absolute', right: 6, top: 6, zIndex: 10, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 4, padding: '4px 6px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CanvasStage;
