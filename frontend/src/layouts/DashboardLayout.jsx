import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard Overview',
  '/subjects': 'Subjects & Syllabus Topics',
  '/planner': 'AI Study Planner & Timetable',
  '/quizzes': 'MCQ Tests & Performance',
  '/assistant': 'AI Academic Doubt Assistant',
  '/career': 'AI Career Guidance & Roadmaps',
  '/notes': 'Notes & Revision Workspace',
  '/analytics': 'Academic Progress Analytics',
  '/settings': 'Account Settings & Preferences',
};

export const DashboardLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--line)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading StudyFlow AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const currentTitle = PAGE_TITLES[location.pathname] || 'StudyFlow AI';

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} title={currentTitle} />
        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

