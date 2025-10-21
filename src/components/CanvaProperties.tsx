import React from 'react';
import { Paper, Button } from '@mui/material';
import { useEditorStore } from '../store/useEditorStore';

export function CanvaProperties({ onClose }: { onClose: () => void }) {
  const { canvasBackground, canvasMeta, setCanvasBackground, setCanvasMeta } = useEditorStore();

  return (
    <Paper elevation={3} style={{ position: 'absolute', right: 8, top: 48, width: 320, padding: 12, zIndex: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Canva properties</div>
        <Button size="small" onClick={onClose}>Close</Button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Background image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(ev) => {
            const f = (ev.target as HTMLInputElement).files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              setCanvasBackground(result);
            };
            reader.readAsDataURL(f);
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
    </Paper>
  );
}
