import React from 'react';
import { Menu, Bell, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const Topbar = ({ onOpenSidebar, title = 'StudyFlow Dashboard' }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onOpenSidebar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink)',
            display: 'none',
            padding: '4px'
          }}
          className="mobile-burger-btn"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
            {title}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
            Welcome back, {user?.name || 'Student'}! Stay focused on your goals.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* AI status badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '999px',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          fontSize: '12px',
          fontWeight: 700
        }}>
          <Sparkles size={14} />
          <span>AI Active</span>
        </div>

        {/* Theme quick toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--panel)',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
};

