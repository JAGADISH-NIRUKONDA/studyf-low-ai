import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const PublicLayout = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Public Top Navbar */}
      <header style={{
        height: '76px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--panel)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '34px',
            height: '34px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '17px'
          }}>
            S
          </div>
          <span className="brand-font" style={{ fontSize: '19px', fontWeight: 800, color: 'var(--ink)' }}>
            StudyFlow<span style={{ color: 'var(--primary)' }}>.ai</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={toggleTheme}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              border: '1px solid var(--line)',
              background: 'var(--panel)',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <Link to="/login" className="btn btn-secondary btn-sm">
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>

      <footer style={{
        borderTop: '1px solid var(--line)',
        background: 'var(--panel)',
        padding: '24px 32px',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--muted)'
      }}>
        <p>© 2026 StudyFlow AI — AI Smart Study Planner & Career Architect. Built with React & MongoDB.</p>
      </footer>
    </div>
  );
};

