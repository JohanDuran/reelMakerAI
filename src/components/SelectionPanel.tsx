// automatic JSX runtime used; no default React import required
import CardPanel from './ui/CardPanel';
import { useEditorStore } from '../store/useEditorStore';
import { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';

export function SelectionPanel() {
  const { addElement, elements, removeElement, canvasWidth, groups, selectGroup, selectElement, selectedId, selectedGroupId } = useEditorStore();
  const [showModal, setShowModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  return (
    <CardPanel>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Add</div>

      <Stack direction="row" spacing={1} sx={{ marginBottom: 2 }}>
        <Button variant="outlined" onClick={() => addElement({ type: 'text', x: 100, y: 100, text: 'Text', fontSize: 24 })}>Add Text</Button>
        <Button variant="outlined" onClick={() => addElement({ type: 'rectangle', x: 120, y: 120, width: 160, height: 120, text: 'Label', fontSize: 16, fontColor: '#000000', fillColor: '#c7d2fe', align: 'center' })}>Add Rectangle</Button>
        <Button variant="outlined" onClick={() => addElement({ type: 'image', x: 120, y: 120, width: 160, height: 120 })}>Add Image</Button>
  <Button variant="outlined" onClick={() => addElement({ type: 'aiImage', x: 120, y: 120, width: 240, height: 160, text: '', aiImagePrompt: '' })}>Add AI Image</Button>
        <Button
          variant="outlined"
          onClick={() => {
            // if there's already a Multiple Option group, show error modal
            const hasMultiple = Object.values(groups).some((g) => g.name === 'Multiple Option');
            if (hasMultiple) {
              setShowModal(true);
              return;
            }

            // Clear existing elements
            const ids = elements.map((e) => e.id);
            ids.forEach((id) => removeElement(id));

            // Create a group for this multiple option question
            const groupId = useEditorStore.getState().addGroup({ name: 'Multiple Option', aiTopic: '' });

            // Layout: center rectangles based on canvasWidth
            const cw = canvasWidth || 450;
            const padding = 24;
            const rectW = Math.max(200, Math.round(cw - padding * 2));

            const questionH = 120;
            const optionH = 72;
            const gap = 12;

            const startX = Math.round((cw - rectW) / 2);
            const topY = 80;

            // Add question rectangle at top (belongs to group)
            addElement({ type: 'rectangle', groupId, x: startX, y: topY, width: rectW, height: questionH, text: 'Question', fontSize: 20, fontColor: 'white', fillColor: 'black', align: 'center' });

            // Add 4 option rectangles below (belong to group)
            const optionsStartY = topY + questionH + 20;
            for (let i = 0; i < 4; i++) {
              const y = optionsStartY + i * (optionH + gap);
              addElement({ type: 'rectangle', groupId, x: startX, y, width: rectW, height: optionH, text: `Option ${i + 1}`, fontSize: 16, fontColor: 'black', fillColor: 'lightblue', align: 'center', cornerRadius: 8 });
            }
            // Select the group so its properties (AI Topic) are shown in the inspector
            selectGroup(groupId);
          }}
        >
          Multiple Option
        </Button>
        <Dialog open={showModal} onClose={() => setShowModal(false)}>
          <DialogTitle>Cannot add Multiple Option</DialogTitle>
          <DialogContent>
            <Typography>Only one "Multiple Option" template can be displayed at a time. Remove the existing one before adding another.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModal(false)}>OK</Button>
          </DialogActions>
        </Dialog>
      </Stack>

      {/* Hierarchy */}
      <div style={{ marginTop: 12, fontWeight: 600 }}>Hierarchy</div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Canva</div>

        {/* Render groups */}
          {Object.values(groups).map((g) => (
            <div key={g.id} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{ padding: '6px 8px', borderRadius: 6, background: selectedGroupId === g.id ? 'rgba(255,255,255,0.06)' : 'transparent', cursor: 'pointer', flex: 1 }}
                  onClick={() => selectGroup(g.id)}
                >
                  <u>{g.name || 'Group'}</u>
                </div>
                <div>
                <button
                  title="Delete group"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setGroupToDelete(g.id);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  🗑️
                </button>
              </div>
              </div>
              <div style={{ marginLeft: 8, marginTop: 6 }}>
                {elements.filter((e) => e.groupId === g.id).map((el) => (
                  <div key={el.id} style={{ padding: '4px 6px', borderRadius: 4, background: selectedId === el.id ? 'rgba(255,255,255,0.04)' : 'transparent', cursor: 'pointer' }} onClick={() => selectElement(el.id)}>
                    {el.type === 'rectangle' ? (el.text || 'Rectangle') : (el.type === 'text' ? (el.text || 'Text') : (el.fileName || 'Image'))}
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* Render ungrouped elements */}
        {elements.filter((e) => !e.groupId).map((el) => (
          <div key={el.id} style={{ padding: '6px 8px', borderRadius: 6, background: selectedId === el.id ? 'rgba(255,255,255,0.04)' : 'transparent', cursor: 'pointer', marginBottom: 6 }} onClick={() => selectElement(el.id)}>
            {el.type === 'rectangle' ? (el.text || 'Rectangle') : (el.type === 'text' ? (el.text || 'Text') : (el.fileName || 'Image'))}
          </div>
        ))}
      </div>
      <Dialog open={!!groupToDelete} onClose={() => setGroupToDelete(null)}>
        <DialogTitle>Delete group</DialogTitle>
        <DialogContent>
          <Typography>
            {groupToDelete ? `Delete group "${groups[groupToDelete]?.name || 'Group'}" and its ${elements.filter((e) => e.groupId === groupToDelete).length} child elements?` : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupToDelete(null)}>Cancel</Button>
          <Button onClick={() => {
            if (groupToDelete) useEditorStore.getState().removeGroup(groupToDelete);
            setGroupToDelete(null);
          }} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </CardPanel>
  );
}
