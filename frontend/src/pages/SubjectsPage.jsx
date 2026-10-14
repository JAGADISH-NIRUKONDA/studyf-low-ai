import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { subjectsAPI, topicsAPI } from '../services/api';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

const DIFFICULTY_COLORS = {
  Easy: 'var(--success)',
  Medium: 'var(--warning)',
  Hard: 'var(--danger)',
};

export const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [subjectTopics, setSubjectTopics] = useState({});

  // Modals
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', color: '#6366f1', target_hours: 5, exam_date: '' });

  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [newTopic, setNewTopic] = useState({ title: '', difficulty: 'Medium', estimated_minutes: 45, importance: 3 });

  const fetchSubjects = async () => {
    try {
      const res = await subjectsAPI.getAll();
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicsForSubject = async (subjectId) => {
    try {
      const res = await topicsAPI.getAll(subjectId);
      setSubjectTopics((prev) => ({ ...prev, [subjectId]: res.data.topics || [] }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleToggleExpand = (subjectId) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subjectId);
      fetchTopicsForSubject(subjectId);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    try {
      await subjectsAPI.create(newSubject);
      setIsAddSubjectOpen(false);
      setNewSubject({ name: '', color: '#6366f1', target_hours: 5, exam_date: '' });
      fetchSubjects();
    } catch (err) {
      alert(err.message || 'Error creating subject');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Delete this subject and all its syllabus topics?')) return;
    try {
      await subjectsAPI.delete(subjectId);
      fetchSubjects();
    } catch (err) {
      alert(err.message || 'Error deleting subject');
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.title.trim() || !activeSubjectId) return;
    try {
      await topicsAPI.create({ ...newTopic, subject_id: activeSubjectId });
      setIsAddTopicOpen(false);
      setNewTopic({ title: '', difficulty: 'Medium', estimated_minutes: 45, importance: 3 });
      fetchTopicsForSubject(activeSubjectId);
      fetchSubjects();
    } catch (err) {
      alert(err.message || 'Error adding topic');
    }
  };

  const handleToggleTopic = async (topicId, subjectId) => {
    try {
      await topicsAPI.toggle(topicId);
      fetchTopicsForSubject(subjectId);
      fetchSubjects();
    } catch (err) {
      alert(err.message || 'Error toggling topic');
    }
  };

  const handleDeleteTopic = async (topicId, subjectId) => {
    try {
      await topicsAPI.delete(topicId);
      fetchTopicsForSubject(subjectId);
      fetchSubjects();
    } catch (err) {
      alert(err.message || 'Error deleting topic');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Heading & Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
            My Academic Subjects & Syllabi
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '4px' }}>
            Manage course topics, difficulty weights, and examination target dates.
          </p>
        </div>
        <button onClick={() => setIsAddSubjectOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Subject</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          Loading subjects...
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No subjects created yet"
          message="Add your first subject (e.g. Computer Networks, Machine Learning) and outline syllabus topics."
          actionText="Add First Subject"
          onAction={() => setIsAddSubjectOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {subjects.map((s) => {
            const isExpanded = expandedSubject === s.id;
            const topics = subjectTopics[s.id] || [];

            return (
              <div key={s.id} className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: `color-mix(in srgb, ${s.color} 18%, transparent)`,
                      color: s.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '18px'
                    }}>
                      <BookOpen size={20} />
                    </div>

                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                        {s.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '12.5px', color: 'var(--muted)' }}>
                        <span>{s.completed_topics || 0} / {s.total_topics || 0} topics completed</span>
                        {s.exam_date && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} />
                            Exam: {new Date(s.exam_date).toLocaleDateString()}
                          </span>
                        )}
                        <span>Target: {s.target_hours}h/wk</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Progress indicator */}
                    <div style={{ minWidth: '120px', textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                        {s.progress_percentage || 0}%
                      </span>
                      <div style={{
                        height: '6px',
                        width: '120px',
                        background: 'var(--line)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        marginTop: '4px'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${s.progress_percentage || 0}%`,
                          background: s.color || 'var(--primary)',
                          borderRadius: '999px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveSubjectId(s.id);
                        setIsAddTopicOpen(true);
                      }}
                      className="btn btn-secondary btn-sm"
                      title="Add syllabus topic"
                    >
                      <Plus size={15} /> Topic
                    </button>

                    <button
                      onClick={() => handleToggleExpand(s.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 10px' }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <button
                      onClick={() => handleDeleteSubject(s.id)}
                      className="btn btn-danger btn-sm"
                      title="Delete subject"
                      style={{ padding: '6px 10px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded topics list */}
                {isExpanded && (
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--muted)' }}>
                        Syllabus Units & Topics
                      </h4>
                      <button
                        onClick={() => {
                          setActiveSubjectId(s.id);
                          setIsAddTopicOpen(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        + Add New Topic
                      </button>
                    </div>

                    {topics.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
                        No topics added under this subject yet. Click "+ Topic" to add your syllabus units.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {topics.map((t) => (
                          <div
                            key={t.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              background: 'var(--panel-subtle)',
                              border: '1px solid var(--line)',
                              opacity: t.completed ? 0.7 : 1
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <button
                                onClick={() => handleToggleTopic(t.id, s.id)}
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  border: t.completed ? 'none' : '2px solid var(--muted)',
                                  background: t.completed ? 'var(--success)' : 'transparent',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              >
                                {t.completed && <CheckCircle2 size={15} />}
                              </button>
                              <span style={{
                                fontSize: '13.5px',
                                fontWeight: 600,
                                color: 'var(--ink)',
                                textDecoration: t.completed ? 'line-through' : 'none'
                              }}>
                                {t.title}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: `color-mix(in srgb, ${DIFFICULTY_COLORS[t.difficulty] || 'var(--primary)'} 15%, transparent)`,
                                color: DIFFICULTY_COLORS[t.difficulty] || 'var(--primary)'
                              }}>
                                {t.difficulty}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                {t.estimated_minutes || 45}m
                              </span>
                              <button
                                onClick={() => handleDeleteTopic(t.id, s.id)}
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Subject */}
      <Modal isOpen={isAddSubjectOpen} onClose={() => setIsAddSubjectOpen(false)} title="Add New Subject">
        <form onSubmit={handleCreateSubject}>
          <div className="form-group">
            <label className="form-label">Subject Name</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Operating Systems"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Color Tag</label>
              <input
                type="color"
                className="form-input"
                style={{ height: '42px', padding: '4px' }}
                value={newSubject.color}
                onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Hours / Week</label>
              <input
                type="number"
                min={1}
                max={40}
                className="form-input"
                value={newSubject.target_hours}
                onChange={(e) => setNewSubject({ ...newSubject, target_hours: parseFloat(e.target.value) || 5 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Examination Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={newSubject.exam_date}
              onChange={(e) => setNewSubject({ ...newSubject, exam_date: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" onClick={() => setIsAddSubjectOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Topic */}
      <Modal isOpen={isAddTopicOpen} onClose={() => setIsAddTopicOpen(false)} title="Add Syllabus Topic">
        <form onSubmit={handleCreateTopic}>
          <div className="form-group">
            <label className="form-label">Topic / Unit Title</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Virtual Memory & Page Replacement"
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select
                className="form-select"
                value={newTopic.difficulty}
                onChange={(e) => setNewTopic({ ...newTopic, difficulty: e.target.value })}
              >
                <option value="Easy">Easy (Quick revision)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Hard">Hard (Deep focus)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Minutes</label>
              <input
                type="number"
                min={15}
                max={180}
                step={15}
                className="form-input"
                value={newTopic.estimated_minutes}
                onChange={(e) => setNewTopic({ ...newTopic, estimated_minutes: parseInt(e.target.value) || 45 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Exam Importance (1 to 5 Stars)</label>
            <input
              type="range"
              min={1}
              max={5}
              className="form-input"
              value={newTopic.importance}
              onChange={(e) => setNewTopic({ ...newTopic, importance: parseInt(e.target.value) || 3 })}
            />
            <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--muted)' }}>
              Weight: {newTopic.importance} / 5
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" onClick={() => setIsAddTopicOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Topic
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

