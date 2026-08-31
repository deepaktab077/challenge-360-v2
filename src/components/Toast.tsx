import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ message, onDismiss, durationMs = 2200 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [onDismiss, durationMs]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: 'var(--ink)',
        color: 'var(--bg)',
        padding: '11px 18px',
        borderRadius: 999,
        boxShadow: 'var(--shadow)',
        fontSize: 13,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
      className="animate-fadeIn"
    >
      <CheckCircle2 className="w-4 h-4" />
      {message}
    </div>
  );
}
