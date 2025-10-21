import React from 'react';
import CardPanel from './ui/CardPanel';
import { useEditorStore } from '../store/useEditorStore';
import { readFileAsDataURL } from '../utils/readFile';
import Button from '@mui/material/Button';

export function CanvaProperties({ onClose }: { onClose: () => void }) {
  const { canvasBackground, canvasMeta, setCanvasBackground, setCanvasMeta } = useEditorStore();

  return (
    <CardPanel style={{ position: 'absolute', right: 8, top: 48, width: 320, padding: 12, zIndex: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Canva properties</div>
        <Button size="small" onClick={onClose}>Close</Button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Background image</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (ev) => {
            const f = (ev.target as HTMLInputElement).files?.[0];
            if (!f) return;
            const result = await readFileAsDataURL(f);
            setCanvasBackground(result);
          }}
        />
        {canvasBackground && (
          <div style={{ marginTop: 8 }}>
            <img src={canvasBackground} alt="canvas bg" style={{ maxWidth: '100%', borderRadius: 4 }} />
            <div style={{ marginTop: 6 }}>
              <Button size="small" variant="outlined" onClick={() => setCanvasBackground(null)}>Remove</Button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Canvas meta (for backend)</label>
        <input
          type="text"
          value={canvasMeta || ''}
          onChange={(e) => setCanvasMeta(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button size="small" onClick={onClose}>Done</Button>
      </div>
    </CardPanel>
  );
}
