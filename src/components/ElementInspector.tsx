import React, { useRef } from 'react';
import { useEditorStore } from "../store/useEditorStore";
import { Paper } from '@mui/material';

export function ElementInspector() {
  const { elements, selectedId, updateElement } = useEditorStore();
  const { showCanvaProperties, canvasBackground, canvasMeta, setCanvasBackground, setCanvasMeta, selectedId: selId, setCanvasBackgroundFile, canvasBackgroundRepeat, setCanvasBackgroundRepeat } = useEditorStore();
  const canvasInputRef = useRef<HTMLInputElement | null>(null);
  const element = elements.find((e) => e.id === selectedId);

  // If canvas properties panel is open, render that instead of the element inspector
  if (showCanvaProperties) {
    return (
      <Paper elevation={1} style={{ width: '100%', height: '100%', padding: 16, display: 'flex', flexDirection: 'column' }}>
        <div className="w-64 border-l bg-white p-4">
          <h3 className="font-semibold mb-3">Canva Properties</h3>

          <div style={{ marginBottom: 12 }}>
            <div className="text-sm font-medium text-gray-700">Background image</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                ref={canvasInputRef}
                type="file"
                accept="image/*"
                onChange={(ev) => {
                  const f = (ev.target as HTMLInputElement).files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
                    setCanvasBackground(result);
                    // store the original File object so we keep a reference unless removed
                    try { setCanvasBackgroundFile(f); } catch (e) { /* ignore */ }
                  };
                  reader.readAsDataURL(f);
                }}
              />
            </div>
            {canvasBackground && (
              <div style={{ marginTop: 8 }}>
                <div style={{ marginTop: 6 }}>
                  <button className="px-2 py-1 border rounded" onClick={() => {
                    setCanvasBackground(null);
                    // clear stored file reference too
                    try { setCanvasBackgroundFile(null); } catch (e) { /* ignore */ }
                    // clear the canvas file input so users can upload again
                    try { if (canvasInputRef.current) canvasInputRef.current.value = ''; } catch (e) { /* ignore */ }
                  }}>Remove</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="text-sm font-medium text-gray-700">AI Background</div>
            <input type="text" className="w-full border rounded px-2 py-1" value={canvasMeta || ''} onChange={(e) => setCanvasMeta(e.target.value)} />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input id="bg-repeat" type="checkbox" checked={!!canvasBackgroundRepeat} onChange={(e) => setCanvasBackgroundRepeat(e.target.checked)} />
              <label htmlFor="bg-repeat" style={{ fontSize: 13 }}>Background repeat</label>
            </div>
          </div>

          {/* if an image element is selected, allow using it as canvas background */}
          {selId && (() => {
            const selEl = elements.find((x) => x.id === selId);
            if (selEl && selEl.type === 'image' && selEl.src) {
                    return (
                <div>
                  <div className="text-sm font-medium text-gray-700">Use selected image</div>
                  <div style={{ marginTop: 6 }}>
                    <button className="px-2 py-1 border rounded" onClick={() => {
                      setCanvasBackground(selEl.src as string);
                      // clear any stored File reference because the background is now from an existing element
                      try { setCanvasBackgroundFile(null); } catch (e) { /* ignore */ }
                    }}>Use as background</button>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </Paper>
    );
  }

  if (!element)
    return (
      <Paper elevation={1} style={{ width: '100%', height: '100%', padding: 16, display: 'flex', flexDirection: 'column' }}>
        <div className="flex justify-center items-center text-gray-500">
          No element selected
        </div>
      </Paper>
    );

  // Grid layout: two columns - label (fixed) and control (flexible)
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '96px 1fr', columnGap: '12px', rowGap: '10px', alignItems: 'center' };

  return (
    <Paper elevation={1} style={{ width: '100%', height: '100%', padding: 16, display: 'flex', flexDirection: 'column' }}>
      <div className="w-64 border-l bg-white p-4">
        <h3 className="font-semibold mb-3">Element Inspector</h3>

        <div style={gridStyle}>
          {element.type === 'text' && (
            <>
              <div className="text-sm font-medium text-gray-700">Text</div>
              <div>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={element.text || ''}
                  onChange={(e) => updateElement(element.id, { text: e.target.value })}
                />
              </div>

              <div className="text-sm font-medium text-gray-700">Font size</div>
              <div>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={element.fontSize || 24}
                  onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value || '0') })}
                />
              </div>

              <div className="text-sm font-medium text-gray-700">Width</div>
              <div>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={element.width}
                  onChange={(e) => updateElement(element.id, { width: parseInt(e.target.value || '0') })}
                />
              </div>
              <div className="text-sm font-medium text-gray-700">AI text</div>
              <div>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={element.aiText || ''}
                  onChange={(e) => updateElement(element.id, { aiText: e.target.value })}
                />
              </div>
            </>
          )}

          {element.type === 'rectangle' && (
            <>
              <div className="text-sm font-medium text-gray-700">Text</div>
              <div>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={element.text || ''}
                  onChange={(e) => updateElement(element.id, { text: e.target.value })}
                />
              </div>
              <div className="text-sm font-medium text-gray-700">Fill</div>
              <div>
                <input
                  type="color"
                  className="w-full border rounded px-2 py-1"
                  value={element.fillColor || '#c7d2fe'}
                  onChange={(e) => updateElement(element.id, { fillColor: e.target.value })}
                />
              </div>

              <div className="text-sm font-medium text-gray-700">Font size</div>
              <div>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={element.fontSize || 16}
                  onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value || '0') })}
                />
              </div>

              <div className="text-sm font-medium text-gray-700">Color</div>
              <div>
                <input
                  type="color"
                  className="w-full border rounded px-2 py-1"
                  value={element.fontColor || '#000000'}
                  onChange={(e) => updateElement(element.id, { fontColor: e.target.value })}
                />
              </div>

              <div className="text-sm font-medium text-gray-700">Align</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`px-2 py-1 border rounded ${element.align === 'left' ? 'bg-gray-200' : ''}`} onClick={() => updateElement(element.id, { align: 'left' })}>Left</button>
                <button className={`px-2 py-1 border rounded ${element.align === 'center' ? 'bg-gray-200' : ''}`} onClick={() => updateElement(element.id, { align: 'center' })}>Center</button>
                <button className={`px-2 py-1 border rounded ${element.align === 'right' ? 'bg-gray-200' : ''}`} onClick={() => updateElement(element.id, { align: 'right' })}>Right</button>
              </div>
            </>
          )}

          {/* X and Y are stored in state but intentionally hidden from the inspector UI */}

          {element.type === 'image' && (
            <>
              <div className="text-sm font-medium text-gray-700">Image</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (ev) => {
                      const f = (ev.target as HTMLInputElement).files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result as string;
                        // measure natural size
                        const img = new Image();
                        img.onload = () => {
                          updateElement(element.id, { src: result, width: img.naturalWidth, height: img.naturalHeight, fileName: f.name });
                        };
                        img.src = result;
                      };
                      reader.readAsDataURL(f);
                    }}
                  />
                
                </div>
              </div>

              <div className="text-sm font-medium text-gray-700">Width</div>
              <div>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={element.width}
                  onChange={(e) => updateElement(element.id, { width: parseInt(e.target.value || '0') })}
                />
              </div>

              <div className="text-sm font-medium text-gray-700">Height</div>
              <div>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={element.height}
                  onChange={(e) => updateElement(element.id, { height: parseInt(e.target.value || '0') })}
                />
              </div>
              <div className="text-sm font-medium text-gray-700">AI image</div>
              <div>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={element.aiImage || ''}
                  onChange={(e) => updateElement(element.id, { aiImage: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Paper>
  );
}
