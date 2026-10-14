import React, { useState } from 'react';
import {
  Settings,
  User,
  Moon,
  Sun,
  Bell,
  Database,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';

export const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [notifications, setNotifications] = useState(user?.preferences?.notifications_enabled !== false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      const res = await authAPI.updateProfile({
        name: name.trim(),
        preferences: {
          theme,
          notifications_enabled: notifications
        }
      });
      updateUser(res.data.user);
      setMessage('Profile and preferences updated successfully.');
    } catch (err) {
      alert(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '800px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
          Account Settings & Preferences
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '4px' }}>
          Manage your personal details, study reminders, and UI theme preferences.
        </p>
      </div>

      {message && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'var(--success-light)',
          color: 'var(--success)',
          fontSize: '13.5px',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* Profile Info Form */}
      <div className="card">
        <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} color="var(--primary)" />
          Personal Details
        </h3>

        <form onSubmit={handleSaveProfile}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Read-only)</label>
            <input
              type="email"
              disabled
              className="form-input"
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
              value={user?.email || ''}
            />
          </div>

          {/* Preferences */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
              App Preferences
            </h4>

            {/* Theme Toggle Option */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid var(--line)'
            }}>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', color: 'var(--ink)' }}>
                  Visual Interface Theme
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Currently active: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="btn btn-secondary btn-sm"
              >
                {theme === 'dark' ? <><Sun size={15} /> Switch to Light</> : <><Moon size={15} /> Switch to Dark</>}
              </button>
            </div>

            {/* Notifications Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0'
            }}>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', color: 'var(--ink)' }}>
                  Study Reminders & Notifications
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Receive visual prompts for upcoming study sessions
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{ marginTop: '24px' }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* System & Database Information */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} color="var(--primary)" />
          System & Database Configuration
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Database Architecture:</span>
            <strong>MongoDB Atlas / Local Server</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Backend Architecture:</span>
            <strong>Python Flask REST API + PyMongo</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Frontend Architecture:</span>
            <strong>React 18 + Vite + Tailwind/CSS System</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Security Token:</span>
            <strong>Flask-JWT-Extended (HMAC-SHA256)</strong>
          </div>
        </div>
      </div>

      {/* Danger Zone / Logout */}
      <div className="card" style={{ border: '1px solid var(--danger-light)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger)', marginBottom: '8px' }}>
          Session Management
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
          Signing out will invalidate your local session token and redirect you to the login screen.
        </p>
        <button onClick={logout} className="btn btn-danger btn-sm">
          <LogOut size={15} /> Sign Out of StudyFlow
        </button>
      </div>
    </div>
  );
};

