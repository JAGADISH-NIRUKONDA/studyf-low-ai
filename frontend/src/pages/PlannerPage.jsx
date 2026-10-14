import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Clock,
  Trash2,
  AlertCircle,
  Plus,
  Play
} from 'lucide-react';
import { plannerAPI } from '../services/api';
import { Modal } from '../components/Modal';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { EmptyState } from '../components/EmptyState';

export const PlannerPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genConfig, setGenConfig] = useState({
    start_date: new Date().toISOString().split('T')[0],
    days: 7,
    hours_per_day: 3,
    session_duration: 45
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSessions = async () => {
    try {
      const res = await plannerAPI.getSessions();
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setMessage('');
    try {
      const res = await plannerAPI.generate(genConfig);
      setIsGenerateOpen(false);
      setMessage(res.message || 'Timetable generated successfully!');
      fetchSessions();
    } catch (err) {
      alert(err.message || 'Error generating timetable');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRecalculate = async () => {
    if (!window.confirm('Recalculate your study plan? Any overdue uncompleted sessions will be marked missed and rescheduled starting today.')) return;
    try {
      const res = await plannerAPI.recalculate({ hours_per_day: genConfig.hours_per_day });
      setMessage(res.message || 'Plan recalculated.');
      fetchSessions();
    } catch (err) {
      alert(err.message || 'Error recalculating plan');
    }
  };

  const handleToggleSession = async (sessionId, currentCompleted) => {
    try {
      await plannerAPI.updateSession(sessionId, { completed: !currentCompleted });
      fetchSessions();
    } catch (err) {
      alert(err.message || 'Error updating session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await plannerAPI.deleteSession(sessionId);
      fetchSessions();
    } catch (err) {
      alert(err.message || 'Error deleting session');
    }
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, s) => {
    const d = s.session_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});

  const dates = Object.keys(groupedSessions).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner & Control Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
            AI Study Planner & Timetable
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '4px' }}>
            Constraint-based intelligent scheduler aligning exam proximity, topic difficulty, and available hours.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={handleRecalculate} className="btn btn-secondary">
            <RotateCcw size={16} />
            <span>Recalculate Missed</span>
          </button>
          <button onClick={() => setIsGenerateOpen(true)} className="btn btn-primary">
            <Sparkles size={16} />
            <span>Generate Plan</span>
          </button>
        </div>
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

      {/* Main Grid: Timetable View & Integrated Pomodoro */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px'
      }}>
        {/* Left Area: Timetable */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              Loading study timetable...
            </div>
          ) : dates.length === 0 ? (
            <EmptyState
              title="No study plan generated yet"
              message="Click 'Generate Plan' to create an optimized daily timetable tailored to your syllabus topics."
              actionText="Generate Study Plan"
              onAction={() => setIsGenerateOpen(true)}
            />
          ) : (
            dates.map((dateStr) => {
              const daySessions = groupedSessions[dateStr];
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <div key={dateStr} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CalendarDays size={18} color="var(--primary)" />
                      <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                        {new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </strong>
                      {isToday && <span className="badge badge-primary">Today</span>}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {daySessions.length} session{daySessions.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--line)',
                          background: session.completed ? 'var(--panel-subtle)' : 'var(--panel)',
                          opacity: session.completed ? 0.65 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <button
                            onClick={() => handleToggleSession(session.id, session.completed)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: session.completed ? 'none' : '2px solid var(--muted)',
                              background: session.completed ? 'var(--success)' : 'transparent',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            {session.completed && <CheckCircle2 size={16} />}
                          </button>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: session.subject_color || 'var(--primary)' }} />
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                                {session.subject_name}
                              </span>
                            </div>
                            <p style={{
                              fontSize: '13.5px',
                              fontWeight: 600,
                              color: 'var(--ink)',
                              margin: 0,
                              textDecoration: session.completed ? 'line-through' : 'none'
                            }}>
                              {session.title}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', display: 'block' }}>
                              {session.start_time}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              {session.duration_minutes} min
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--muted)',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Area: Focus Pomodoro Timer */}
        <div>
          <div style={{ position: 'sticky', top: '100px' }}>
            <PomodoroTimer onSessionComplete={() => fetchSessions()} />
          </div>
        </div>
      </div>

      {/* Modal: Generate Study Plan */}
      <Modal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} title="Generate AI Study Timetable">
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label className="form-label">Plan Start Date</label>
            <input
              type="date"
              required
              className="form-input"
              value={genConfig.start_date}
              onChange={(e) => setGenConfig({ ...genConfig, start_date: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Planning Horizon</label>
              <select
                className="form-select"
                value={genConfig.days}
                onChange={(e) => setGenConfig({ ...genConfig, days: parseInt(e.target.value) || 7 })}
              >
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={21}>21 Days (3 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Available Study Hours / Day</label>
              <input
                type="number"
                min={1}
                max={12}
                className="form-input"
                value={genConfig.hours_per_day}
                onChange={(e) => setGenConfig({ ...genConfig, hours_per_day: parseInt(e.target.value) || 3 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Session Duration</label>
            <select
              className="form-select"
              value={genConfig.session_duration}
              onChange={(e) => setGenConfig({ ...genConfig, session_duration: parseInt(e.target.value) || 45 })}
            >
              <option value={25}>25 minutes (Pomodoro Sprint)</option>
              <option value={45}>45 minutes (Standard Block)</option>
              <option value={60}>60 minutes (Deep Focus)</option>
              <option value={90}>90 minutes (Extended Workshop)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" onClick={() => setIsGenerateOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isGenerating} className="btn btn-primary">
              <Sparkles size={16} />
              <span>{isGenerating ? 'Calculating...' : 'Generate Optimized Timetable'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

