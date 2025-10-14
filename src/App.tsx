import { CanvasEditor } from "./components/CanvasEditor";
import { ElementInspector } from "./components/ElementInspector";
import { SelectionPanel } from "./components/SelectionPanel";
import Grid from '@mui/material/Grid';

export default function App() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={3}>
        <SelectionPanel />
      </Grid>
      <Grid item xs={6}>
        <CanvasEditor />
      </Grid>
      <Grid item xs={3}>
        <ElementInspector />
      </Grid>
    </Grid>
  );
}
