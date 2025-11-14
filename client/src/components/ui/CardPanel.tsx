import React from 'react';
import Paper from '@mui/material/Paper';
// SxProps is a type only; import as type to avoid runtime import errors in Vite
import type { SxProps } from '@mui/system';

type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  sx?: SxProps | any;
};

export default function CardPanel({ children, className, style, sx }: Props) {
  return (
    <Paper className={className} elevation={2} sx={{ width: '100%', height: '100%', p: 2, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRadius: 1, ...sx }} style={style}>
      {children}
    </Paper>
  );
}
