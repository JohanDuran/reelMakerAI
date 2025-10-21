// automatic JSX runtime used; no default React import required
import CardPanel from './ui/CardPanel';
import { useEditorStore } from '../store/useEditorStore';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export function SelectionPanel() {
  const { addElement } = useEditorStore();

  return (
    <CardPanel>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Add</div>

      <Stack direction="row" spacing={1} sx={{ marginBottom: 2 }}>
        <Button variant="outlined" onClick={() => addElement({ type: 'text', x: 100, y: 100, text: 'Text', fontSize: 24 })}>Add Text</Button>
        <Button variant="outlined" onClick={() => addElement({ type: 'rectangle', x: 120, y: 120, width: 160, height: 120, text: 'Label', fontSize: 16, fontColor: '#000000', fillColor: '#c7d2fe', align: 'center' })}>Add Rectangle</Button>
        <Button variant="outlined" onClick={() => addElement({ type: 'image', x: 120, y: 120, width: 160, height: 120 })}>Add Image</Button>
      </Stack>

      {/* Canvas button removed — ESC or clicking outside canvas will open canvas properties */}

      {/* Recent section removed as requested */}
    </CardPanel>
  );
}
