import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

type Props = {
  canvasWidth: number;
  canvasHeight: number;
  setAspectRatio: (r: '9:16' | '16:9') => void;
};

// CanvasControls: small control cluster rendered near the canvas (aspect ratio selector, etc.)
export function CanvasControls({ canvasWidth, canvasHeight, setAspectRatio }: Props) {
  return (
    <div style={{position: 'relative', right: 0, top: 8, zIndex: 2000 }}>
      <FormControl size="small" variant="outlined" style={{ minWidth: 96, background: 'white', borderRadius: 6 }}>
        <InputLabel id="aspect-select-label">Ratio</InputLabel>
        <Select
          labelId="aspect-select-label"
          value={canvasHeight > canvasWidth ? '9:16' : '16:9'}
          label="Ratio"
          onChange={(e: any) => setAspectRatio(e.target.value as '9:16' | '16:9')}
        >
          <MenuItem value="9:16">9:16</MenuItem>
          <MenuItem value="16:9">16:9</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}

export default CanvasControls;
