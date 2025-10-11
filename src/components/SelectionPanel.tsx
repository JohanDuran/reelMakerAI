import React from 'react';
import { Button, Stack, Paper, Typography } from '@mui/material';
import { useEditorStore } from '../store/useEditorStore';

export function SelectionPanel() {
  const { addElement } = useEditorStore();

  return (
    <Paper elevation={1} style={{ width: '100%', height: '100%', padding: 16, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Add
      </Typography>

      <Stack direction="row" spacing={1} style={{ marginBottom: 12 }}>
        <Button
          variant="contained"
          onClick={() => addElement({ type: 'text', x: 100, y: 100, text: 'Text', fontSize: 24 })}
        >
          Add Text
        </Button>
        <Button
          variant="outlined"
          onClick={() => addElement({ type: 'image', x: 120, y: 120, width: 160, height: 120 })}
        >
          Add Image
        </Button>
      </Stack>

      {/* Recent section removed as requested */}
    </Paper>
  );
}
