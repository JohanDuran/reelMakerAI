import { CanvasEditor } from "./components/CanvasEditor";
import { ElementInspector } from "./components/ElementInspector";
import { SelectionPanel } from "./components/SelectionPanel";
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function App() {
  // consider desktops only: require at least 1024px width
  const isDesktop = useMediaQuery('(min-width:1024px)');
  return (
    <>
      {isDesktop ? (
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <SelectionPanel />
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CanvasEditor />
            </Box>
          </Grid>
          <Grid item xs={3}>
            <ElementInspector />
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <div style={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Desktop required</Typography>
            <Typography color="textSecondary">This application is optimized for desktop screens. Please open it on a laptop or desktop computer for the best experience.</Typography>
          </div>
        </Box>
      )}
    </>
  );
}
