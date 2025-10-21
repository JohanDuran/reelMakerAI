import React, { useRef } from 'react';
import { useEditorStore } from "../store/useEditorStore";
import CardPanel from './ui/CardPanel';
import { readFileAsDataURL } from '../utils/readFile';

export function ElementInspector() {
  const { elements, selectedId, updateElement, showCanvaProperties, canvasBackground, canvasMeta, setCanvasBackground, setCanvasMeta, selectedId: selId, setCanvasBackgroundFile, canvasBackgroundRepeat, setCanvasBackgroundRepeat } = useEditorStore();
  const canvasInputRef = useRef<HTMLInputElement | null>(null);
  const element = elements.find((e) => e.id === selectedId);

  // Reusable styles for toggle-like buttons (align, bold/italic/underline)
  const toggleBase: React.CSSProperties = { padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: 'inherit', cursor: 'pointer' };
  const toggleActive: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.12)' };

  // If canvas properties panel is open, render that instead of the element inspector
  if (showCanvaProperties) {
    return (
      <CardPanel>
        <div style={{ width: '16rem' }}>
          <h3 style={{ marginBottom: 12, fontWeight: 600 }}>Canva Properties</h3>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Background image</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                ref={canvasInputRef}
                type="file"
                accept="image/*"
                onChange={async (ev) => {
                  const f = (ev.target as HTMLInputElement).files?.[0];
                  if (!f) return;
                  const result = await readFileAsDataURL(f);
                  setCanvasBackground(result);
                  // store the original File object so we keep a reference unless removed
                  try { setCanvasBackgroundFile(f); } catch (e) { /* ignore */ }
                }}
              />
            </div>
            {canvasBackground && (
              <div style={{ marginTop: 8 }}>
                <div style={{ marginTop: 6 }}>
                  <button style={{ padding: '6px 10px', borderRadius: 6 }} onClick={() => {
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
            <div style={{ fontSize: 12, fontWeight: 600 }}>AI Background</div>
            <input type="text" style={{ width: '100%', padding: '8px', borderRadius: 6 }} value={canvasMeta || ''} onChange={(e) => setCanvasMeta(e.target.value)} />
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
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Use selected image</div>
                    <div style={{ marginTop: 6 }}>
                      <button style={{ padding: '6px 10px', borderRadius: 6 }} onClick={() => {
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
        </CardPanel>
    );
  }

  if (!element)
    return (
      <CardPanel>
        <div style={{ width: '16rem', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'rgba(255,255,255,0.7)' }}>
          No element selected
        </div>
      </CardPanel>
    );

  // Grid layout: two columns - label (fixed) and control (flexible)
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '96px 1fr', columnGap: '12px', rowGap: '10px', alignItems: 'center' };

  return (
    <CardPanel>
      <div style={{ width: '16rem' }}>
        <h3 style={{ marginBottom: 12, fontWeight: 600 }}>Element Inspector</h3>

        <div style={gridStyle}>
          {element.type === 'text' && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Text</div>
              <div>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', borderRadius: 6 }}
                  value={element.text || ''}
                  onChange={(e) => updateElement(element.id, { text: e.target.value })}
                />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600 }}>Font size</div>
              <div>
                <input
                  type="number"
                  style={{ width: '100%', padding: '8px', borderRadius: 6 }}
                  value={element.fontSize || 24}
                  onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value || '0') })}
                />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600 }}>Color</div>
              <div>
                <input
                  type="color"
                  style={{ width: '100%', padding: '4px', borderRadius: 6 }}
                  value={element.fontColor || '#000000'}
                  onChange={(e) => updateElement(element.id, { fontColor: e.target.value })}
                />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600 }}>Font family</div>
              <div>
                <select style={{ width: '100%', padding: '8px', borderRadius: 6 }} value={element.fontFamily || 'Arial'} onChange={(e) => updateElement(element.id, { fontFamily: e.target.value })}>
                  <option>Arial</option>
                  <option>Roboto</option>
                  <option>Helvetica</option>
                  <option>Georgia</option>
                  <option>Times New Roman</option>
                  <option>Courier New</option>
                </select>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600 }}>Style</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...(toggleBase), ...(element.bold ? toggleActive : {}) }} onClick={() => updateElement(element.id, { bold: !element.bold })}>B</button>
                <button style={{ ...(toggleBase), ...(element.italic ? toggleActive : {}) }} onClick={() => updateElement(element.id, { italic: !element.italic })}><i>I</i></button>
                <button style={{ ...(toggleBase), ...(element.underline ? toggleActive : {}) }} onClick={() => updateElement(element.id, { underline: !element.underline })}>U</button>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600 }}>AI text</div>
              <div>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,0.06)' }}
                  value={element.aiText || ''}
                  onChange={(e) => updateElement(element.id, { aiText: e.target.value })}
                />
              </div>
            </>
          )}

          {element.type === 'rectangle' && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Text</div>
              <div>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,0.06)' }}
                  value={element.text || ''}
                  onChange={(e) => updateElement(element.id, { text: e.target.value })}
                />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Fill</div>
              <div>
                <input
                  type="color"
                  style={{ width: '100%', padding: '4px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}
                  value={element.fillColor || '#c7d2fe'}
                  onChange={(e) => updateElement(element.id, { fillColor: e.target.value })}
                />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600 }}>Font size</div>
              <div>
                <input
                  type="number"
                  style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,0.06)' }}
                  value={element.fontSize || 16}
                  onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value || '0') })}
                />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600 }}>Color</div>
              <div>
                <input
                  type="color"
                  style={{ width: '100%', padding: '4px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}
                  value={element.fontColor || '#000000'}
                  onChange={(e) => updateElement(element.id, { fontColor: e.target.value })}
                />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600 }}>Align</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...(toggleBase), ...(element.align === 'left' ? toggleActive : {}) }} onClick={() => updateElement(element.id, { align: 'left' })}>Left</button>
                <button style={{ ...(toggleBase), ...(element.align === 'center' ? toggleActive : {}) }} onClick={() => updateElement(element.id, { align: 'center' })}>Center</button>
                <button style={{ ...(toggleBase), ...(element.align === 'right' ? toggleActive : {}) }} onClick={() => updateElement(element.id, { align: 'right' })}>Right</button>
              </div>
            </>
          )}

          {/* X and Y are stored in state but intentionally hidden from the inspector UI */}

          {element.type === 'image' && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Image</div>
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

              <div style={{ fontSize: 12, fontWeight: 600 }}>Width</div>
              <div>
                <input
                  type="number"
                  style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,0.06)' }}
                  value={element.width}
                  onChange={(e) => updateElement(element.id, { width: parseInt(e.target.value || '0') })}
                />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600 }}>Height</div>
              <div>
                <input
                  type="number"
                  style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,0.06)' }}
                  value={element.height}
                  onChange={(e) => updateElement(element.id, { height: parseInt(e.target.value || '0') })}
                />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>AI image</div>
              <div>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,0.06)' }}
                  value={element.aiImage || ''}
                  onChange={(e) => updateElement(element.id, { aiImage: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </CardPanel>
  );
}
