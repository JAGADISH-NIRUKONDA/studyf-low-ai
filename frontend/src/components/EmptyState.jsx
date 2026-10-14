import React from 'react';
import { Sparkles } from 'lucide-react';

export const EmptyState = ({ title, message, icon: Icon = Sparkles, actionText, onAction }) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      background: 'var(--panel-subtle)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--line)'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: 'var(--primary-light)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px'
      }}>
        <Icon size={24} />
      </div>
      <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '380px', margin: '0 auto 16px' }}>
        {message}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};

