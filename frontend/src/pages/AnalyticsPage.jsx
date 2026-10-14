import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import {
  BarChart3,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles
} from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { StatCard } from '../components/StatCard';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsAPI.getAnalytics();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    const token = localStorage.getItem('studyflow_token');
    fetch('/api/analytics/export', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `studyflow_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => alert('Failed to export CSV: ' + err.message));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
        Loading progress analytics...
      </div>
    );
  }

  const {
    subject_progress = [],
    weekly_study = [],
    quiz_trends = [],
    total_study_hours = 0,
    total_tasks = 0,
    completed_tasks = 0,
    task_completion_rate = 0,
    weak_topics = []
  } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner & Export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
            Academic Progress & Study Analytics
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '4px' }}>
            Quantitative syllabus tracking, study velocity, test score trends, and CSV data export.
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn btn-secondary">
          <Download size={16} />
          <span>Export Academic Report (CSV)</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <StatCard
          title="Total Study Time"
          value={`${total_study_hours} Hours`}
          subtitle="Logged across sessions"
          icon={Clock}
          color="var(--primary)"
        />
        <StatCard
          title="Task Completion Rate"
          value={`${task_completion_rate}%`}
          subtitle={`${completed_tasks} / ${total_tasks} completed`}
          icon={CheckCircle2}
          color="var(--success)"
        />
        <StatCard
          title="Active Subjects"
          value={subject_progress.length}
          subtitle="Tracked syllabi"
          icon={BarChart3}
          color="#8b5cf6"
        />
        <StatCard
          title="Revision Topics"
          value={weak_topics.length}
          subtitle="Scores below 70%"
          icon={AlertTriangle}
          color="var(--warning)"
        />
      </div>

      {/* Main Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '24px'
      }}>
        {/* Chart 1: Syllabus Completion by Subject */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>
            Subject Syllabus Completion (%)
          </h3>

          <div style={{ width: '100%', height: '280px' }}>
            {subject_progress.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: '100px' }}>No subjects to display</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subject_progress} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--muted)" fontSize={12} domain={[0, 100]} unit="%" tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--panel)', borderColor: 'var(--line)', borderRadius: '8px', color: 'var(--ink)' }}
                    formatter={(val) => [`${val}%`, 'Progress']}
                  />
                  <Bar dataKey="percentage" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: 7-Day Study Minutes Velocity */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>
            Study Velocity (Last 7 Days)
          </h3>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly_study} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="studyColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} unit="m" tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--line)', borderRadius: '8px', color: 'var(--ink)' }}
                  formatter={(val) => [`${val} minutes (${Math.round(val/60*10)/10}h)`, 'Study Time']}
                />
                <Area type="monotone" dataKey="minutes" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#studyColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quiz Performance Trends & Weak Topics Table */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '24px'
      }}>
        {/* Quiz Progression Line Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>
            MCQ Quiz Score Progression (%)
          </h3>

          <div style={{ width: '100%', height: '240px' }}>
            {quiz_trends.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: '80px' }}>No quiz attempts yet to generate score trends</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quiz_trends} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--muted)" fontSize={12} domain={[0, 100]} unit="%" tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--panel)', borderColor: 'var(--line)', borderRadius: '8px', color: 'var(--ink)' }}
                    formatter={(val, name, item) => [`${val}% (${item.payload.topic})`, 'Score']}
                  />
                  <Line type="monotone" dataKey="percentage" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weak Topics Revision Priority List */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--warning)" />
            Weak Topics & Revision Priority
          </h3>

          {weak_topics.length === 0 ? (
            <p style={{ fontSize: '13.5px', color: 'var(--muted)', padding: '24px 0' }}>
              No weak topics detected! Keep scoring above 70% in your tests to maintain mastery.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {weak_topics.map((wt, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                    background: 'var(--panel-subtle)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13.5px', color: 'var(--ink)' }}>{wt.topic}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                      {wt.attempts} attempt{wt.attempts === 1 ? '' : 's'} recorded
                    </span>
                  </div>
                  <span className="badge badge-warning">
                    Avg: {wt.average_percentage}%
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

