// automatic JSX runtime used; no default React import required
import CardPanel from './ui/CardPanel';
import { useEditorStore } from '../store/useEditorStore';

export function SelectionPanel() {
  const { addElement } = useEditorStore();

  return (
    <CardPanel>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Add</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button style={{ padding: '8px 12px', background: '#6366f1', color: 'white', borderRadius: 6, border: 'none' }} onClick={() => addElement({ type: 'text', x: 100, y: 100, text: 'Text', fontSize: 24 })}>Add Text</button>
        <button style={{ padding: '8px 12px', background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6 }} onClick={() => addElement({ type: 'rectangle', x: 120, y: 120, width: 160, height: 120, text: 'Label', fontSize: 16, fontColor: '#000000', fillColor: '#c7d2fe', align: 'center' })}>Add Rectangle</button>
        <button style={{ padding: '8px 12px', background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6 }} onClick={() => addElement({ type: 'image', x: 120, y: 120, width: 160, height: 120 })}>Add Image</button>
      </div>

      {/* Recent section removed as requested */}
    </CardPanel>
  );
}
