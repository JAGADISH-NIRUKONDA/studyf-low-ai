import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'var(--primary)', trend }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={19} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
        <strong style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
          {value}
        </strong>
        {trend && (
          <span style={{ fontSize: '12px', fontWeight: 700, color: trend > 0 ? 'var(--success)' : 'var(--danger)' }}>
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>

      {subtitle && (
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};

