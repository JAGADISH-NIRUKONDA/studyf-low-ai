import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Calendar,
  Clock,
  Flame,
  ArrowRight,
  Plus,
  AlertCircle,
  BrainCircuit,
  FileCheck
} from 'lucide-react';
import { dashboardAPI, plannerAPI, tasksAPI } from '../services/api';
import { StatCard } from '../components/StatCard';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { EmptyState } from '../components/EmptyState';

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.getDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleSession = async (sessionId, currentCompleted) => {
    try {
      await plannerAPI.updateSession(sessionId, { completed: !currentCompleted });
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Error updating session');
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await tasksAPI.toggle(taskId);
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Error updating task');
    }
  };

  const handleQuickAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await tasksAPI.create({ title: newTaskTitle.trim(), priority: 'Medium' });
      setNewTaskTitle('');
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Error adding task');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
        <p>Loading your study dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--danger-light)', color: 'var(--danger)' }}>
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  const {
    total_subjects = 0,
    overall_progress = 0,
    streak_days = 0,
    total_study_minutes = 0,
    todays_sessions = [],
    pending_tasks = [],
    upcoming_exams = [],
    recent_quizzes = []
  } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <StatCard
          title="Subjects Enrolled"
          value={total_subjects}
          subtitle="Active syllabi"
          icon={BookOpen}
          color="var(--primary)"
        />
        <StatCard
          title="Syllabus Progress"
          value={`${overall_progress}%`}
          subtitle="Across all topics"
          icon={CheckCircle2}
          color="var(--success)"
        />
        <StatCard
          title="Study Streak"
          value={`${streak_days} Days`}
          subtitle="Consistency reward"
          icon={Flame}
          color="var(--warning)"
        />
        <StatCard
          title="Focused Study"
          value={`${Math.round(total_study_minutes / 60)}h ${total_study_minutes % 60}m`}
          subtitle="Completed sessions"
          icon={Clock}
          color="#8b5cf6"
        />
      </div>

      {/* Main 2-column Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px'
      }}>
        {/* Left Column: Today's Study Sessions */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                Today's Study Schedule
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '2px 0 0' }}>
                {todays_sessions.length} planned session{todays_sessions.length === 1 ? '' : 's'} for today
              </p>
            </div>
            <Link to="/planner" className="btn btn-secondary btn-sm">
              <span>View Full Plan</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {todays_sessions.length === 0 ? (
              <EmptyState
                title="No study sessions scheduled today"
                message="Generate your personalized timetable with the AI Study Planner to organize your day."
                actionText="Generate Plan"
                onAction={() => window.location.href = '/planner'}
              />
            ) : (
              todays_sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: session.completed ? 'var(--panel-subtle)' : 'var(--panel)',
                    border: '1px solid var(--line)',
                    opacity: session.completed ? 0.65 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
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
                    title={session.completed ? 'Mark pending' : 'Mark completed'}
                  >
                    {session.completed && <CheckCircle2 size={16} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: session.subject_color || 'var(--primary)'
                      }} />
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

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary)' }}>
                      {session.start_time}
                    </span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                      {session.duration_minutes} min
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Pomodoro Focus Timer & Upcoming Exams */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <PomodoroTimer onSessionComplete={() => fetchDashboard()} />

          {/* Upcoming Exams Card */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary)" />
              Upcoming Examinations
            </h3>

            {upcoming_exams.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                No exam dates recorded yet. Add exam dates under <Link to="/subjects" style={{ color: 'var(--primary)', fontWeight: 600 }}>My Subjects</Link> to enable priority study scheduling.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcoming_exams.map((exam, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background: 'var(--panel-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: exam.color }} />
                      <span style={{ fontSize: '13.5px', fontWeight: 700 }}>{exam.subject_name}</span>
                    </div>
                    <span className={`badge ${exam.days_remaining <= 7 ? 'badge-danger' : 'badge-primary'}`}>
                      {exam.days_remaining === 0 ? 'Today!' : `${exam.days_remaining} days left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Pending Tasks & Recent Quizzes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px'
      }}>
        {/* Pending Tasks */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Pending Tasks & Deadlines
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {pending_tasks.length} pending
            </span>
          </div>

          {/* Quick add task input */}
          <form onSubmit={handleQuickAddTask} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Add a new task (e.g. solve 10 practice problems)..."
              className="form-input"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              style={{ fontSize: '13px', padding: '8px 12px' }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
              <Plus size={16} /> Add
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending_tasks.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
                All tasks completed! Great work staying organized.
              </p>
            ) : (
              pending_tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--panel-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                      {task.title}
                    </span>
                  </div>
                  <span className={`badge ${task.priority === 'High' ? 'badge-danger' : 'badge-primary'}`}>
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrainCircuit size={18} color="var(--primary)" />
              Recent Quiz Attempts
            </h3>
            <Link to="/quizzes" className="btn btn-secondary btn-sm">
              Take Quiz
            </Link>
          </div>

          {recent_quizzes.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
              No quiz attempts recorded yet. Test your knowledge under <Link to="/quizzes" style={{ color: 'var(--primary)', fontWeight: 600 }}>MCQ Tests</Link>.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recent_quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                    background: 'var(--panel-subtle)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13.5px', color: 'var(--ink)' }}>{quiz.topic}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                      Score: {quiz.score} / {quiz.total}
                    </span>
                  </div>
                  <span className={`badge ${quiz.percentage >= 70 ? 'badge-success' : 'badge-warning'}`}>
                    {quiz.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

