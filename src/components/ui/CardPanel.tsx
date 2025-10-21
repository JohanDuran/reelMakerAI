import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function CardPanel({ children, className, style }: Props) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', padding: 16, display: 'flex', flexDirection: 'column', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', borderRadius: 4, ...style }}>
      {children}
    </div>
  );
}
