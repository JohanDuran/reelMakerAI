import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

type Props = {
  canvasWidth: number;
  canvasHeight: number;
  setAspectRatio: (r: '9:16' | '16:9') => void;
};

// CanvasControls: small control cluster rendered near the canvas (aspect ratio selector, etc.)
export function CanvasControls({ canvasWidth, canvasHeight, setAspectRatio }: Props) {
  return (
    <div style={{position: 'absolute', right: -30, top: 0, zIndex: 2000, pointerEvents: 'auto' }}>
      {/* Use a light control surface with dark text so it remains readable over the pale canvas */}
      <FormControl size="small" variant="outlined" sx={{ backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 1, color: '#111', minWidth: 60 }}>
        <Select
          labelId="aspect-select-label"
          value={canvasHeight > canvasWidth ? '9:16' : '16:9'}
          label="Ratio"
          onChange={(e: any) => setAspectRatio(e.target.value as '9:16' | '16:9')}
          sx={{ color: '#111', '& .MuiSelect-icon': { color: '#111' } }}
          MenuProps={{
            // Render to body so Popper can position relative to viewport (correct when parents are transformed)
            disablePortal: false,
            anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
            transformOrigin: { vertical: 'top', horizontal: 'right' },
          }}
        >
          <MenuItem value="9:16">9:16</MenuItem>
          <MenuItem value="16:9">16:9</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}

export default CanvasControls;
