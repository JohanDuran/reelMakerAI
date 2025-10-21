import { createTheme } from '@mui/material/styles';

// Dark theme: base palette with high-contrast surfaces and subtle primary accent
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0b0f14',
      paper: '#0f1720'
    },
    primary: {
      main: '#7c3aed'
    },
    secondary: {
      main: '#06b6d4'
    },
    text: {
      primary: '#e6eef8',
      secondary: '#a6b3c8'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '6px 12px'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    }
  }
});

export default theme;
