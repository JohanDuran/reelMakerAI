// automatic JSX runtime used; no default React import required
import CardPanel from './ui/CardPanel';
import { useEditorStore } from '../store/useEditorStore';
import { useState, useRef } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import { serializeProject, deserializeProject } from '../utils/export';

export function SelectionPanel() {
  const { addElement, elements, removeElement, canvasWidth, groups, selectGroup, selectElement, selectedId, selectedGroupId, showCanvaProperties, setShowCanvaProperties } = useEditorStore();
  const [showModal, setShowModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<{ canvases?: any[]; elementsCount?: number; groupsCount?: number; raw?: any } | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // safe reference to the group being deleted (avoids indexing with null)
  const deletingGroup = groupToDelete ? groups[groupToDelete] : null;

  return (
    <CardPanel>
      {/* Header row: Elements title on the left, Export/Import on the right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Elements</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" variant="contained" color="primary" onClick={() => {
            try {
              const json = serializeProject();
              const str = JSON.stringify(json, null, 2);
              const blob = new Blob([str], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `reel-export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.reel.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch (err) {
              console.error('Export failed', err);
              alert('Export failed: ' + String(err));
            }
          }}>Export</Button>

          <input style={{ display: 'none' }} type="file" accept="application/json" ref={(ref) => { fileInputRef.current = ref; }} onChange={async (ev) => {
            const f = ev.target.files?.[0];
            if (!f) return;
            try {
              const text = await f.text();
              const obj = JSON.parse(text);
              // Basic preview: count canvases/elements/groups
              const canvases = (obj && obj.canvases) ? obj.canvases : (obj.canvas ? [{ ...obj, elements: obj.elements || [] }] : []);
              const elementsCount = canvases.reduce((acc: number, c: any) => acc + ((c.elements && c.elements.length) || 0), 0);
              const groupsCount = canvases.reduce((acc: number, c: any) => acc + (c.elements ? c.elements.filter((e: any) => e.type === 'group').length : 0), 0);
              setImportPreview({ canvases, elementsCount, groupsCount, raw: obj });
              setShowImportConfirm(true);
            } catch (err) {
              console.error('Import parse failed', err);
              alert('Import failed: ' + String(err));
            }
          }} />

          <Button size="small" variant="outlined" color="secondary" onClick={() => fileInputRef.current && fileInputRef.current.click()}>Import</Button>
        </div>
      </div>

  <div style={{ marginBottom: 8 }}>
    <div style={{ marginBottom: 6, fontWeight: 500 }}>Elements</div>
    <Grid container spacing={1} sx={{ marginBottom: 2 }}>
      <Grid item xs={6}>
        <Button fullWidth variant="outlined" onClick={() => addElement({ type: 'text', x: 100, y: 100, text: 'Text', fontSize: 24 })}>Text</Button>
      </Grid>
      <Grid item xs={6}>
        <Button fullWidth variant="outlined" onClick={() => addElement({ type: 'rectangle', x: 120, y: 120, width: 160, height: 120, text: 'Label', fontSize: 16, fontColor: '#000000', fillColor: '#c7d2fe', align: 'center' })}>Rectangle</Button>
      </Grid>
      <Grid item xs={6}>
        <Button fullWidth variant="outlined" onClick={() => addElement({ type: 'image', x: 120, y: 120, width: 160, height: 120 })}>Image</Button>
      </Grid>
      <Grid item xs={6}>
        <Button fullWidth variant="outlined" onClick={() => addElement({ type: 'aiImage', x: 120, y: 120, width: 240, height: 160, text: '', aiImagePrompt: '' })}>AI Image</Button>
      </Grid>
    </Grid>

    <div style={{ marginBottom: 6, fontWeight: 500 }}>Templates</div>
    <Grid container spacing={1} sx={{ marginBottom: 2 }}>
      <Grid item xs={6}>
        <Button fullWidth variant="outlined" onClick={() => {
              // if there's already a Multiple Option group, show error modal
              const hasMultiple = Object.values(groups).some((g) => g.name === 'Multiple Option');
              if (hasMultiple) {
                setShowModal(true);
                return;
              }

              // Clear existing elements
              const ids = elements.map((e) => e.id);
              ids.forEach((id) => removeElement(id));

              // Create a group for this multiple option question with TTS defaults
              const groupId = useEditorStore.getState().addGroup({
                name: 'Multiple Option',
                aiTopic: '',
                // default TTS mode and durations
                ttsMode: 'None',
                clipDuration: 10,
                ttsQuestionDuration: false,
                answerDuration: 3,
                ttsAnswerDuration: false,
              });

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
        }}>Multiple Option</Button>
      </Grid>
      <Grid item xs={6}>
        {/* empty slot to keep grid balanced when needed */}
        <div />
      </Grid>
    </Grid>
  </div>
        <Dialog open={showModal} onClose={() => setShowModal(false)}>
          <DialogTitle>Cannot add Multiple Option</DialogTitle>
          <DialogContent>
            <Typography>Only one "Multiple Option" template can be displayed at a time. Remove the existing one before adding another.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModal(false)}>OK</Button>
          </DialogActions>
        </Dialog>


      {/* Hierarchy */}
      <div style={{ marginTop: 12, fontWeight: 600 }}>Hierarchy</div>
      <div style={{ marginTop: 8 }}>
        <div
          role="button"
          style={{ fontSize: 12, color: showCanvaProperties ? 'inherit' : 'rgba(255,255,255,0.8)', marginBottom: 6, cursor: 'pointer', padding: '4px 6px', borderRadius: 6, background: showCanvaProperties ? 'rgba(255,255,255,0.04)' : 'transparent' }}
          onClick={() => { selectElement(null); selectGroup(null); setShowCanvaProperties(true); }}
        >
          Canva
        </div>

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
            {deletingGroup ? `Delete group "${deletingGroup.name || 'Group'}" and its ${elements.filter((e) => e.groupId === deletingGroup.id).length} child elements?` : ''}
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

      <Dialog open={showImportConfirm} onClose={() => { setShowImportConfirm(false); setImportPreview(null); }}>
        <DialogTitle>Import project</DialogTitle>
        <DialogContent>
          <Typography>You're about to import a project. This will replace the current canvas contents.</Typography>
          {importPreview ? (
            <div style={{ marginTop: 8 }}>
              <Typography>Canvases: {importPreview.canvases?.length ?? 0}</Typography>
              <Typography>Elements: {importPreview.elementsCount ?? 0}</Typography>
              <Typography>Groups: {importPreview.groupsCount ?? 0}</Typography>
            </div>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowImportConfirm(false); setImportPreview(null); }}>Cancel</Button>
          <Button onClick={async () => {
            try {
              if (!importPreview) throw new Error('No import data');
              await deserializeProject(importPreview.raw);
              setShowImportConfirm(false);
              setImportPreview(null);
            } catch (err) {
              console.error('Import failed', err);
              alert('Import failed: ' + String(err));
            }
          }}>Import</Button>
        </DialogActions>
      </Dialog>
    </CardPanel>
  );
}
