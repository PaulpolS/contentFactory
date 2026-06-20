import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// การ์ด wrapper สไตล์ธีมมืดของแอป (Coinpulse glass)
export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => (
  <div
    className={`rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 ${className}`}
    style={{ background: 'var(--bg-glass, rgba(24,24,27,0.85))', borderColor: 'var(--border-color, #27272a)' }}
  >
    {title && <h3 className="mb-3 text-sm font-bold text-zinc-200">{title}</h3>}
    {children}
  </div>
);

export default Card;
