import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit2,
  Tag,
  BookOpen
} from 'lucide-react';
import { notesAPI, subjectsAPI } from '../services/api';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

export const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', subject_id: '', tags: '' });

  const fetchNotesAndSubjects = async () => {
    try {
      const [nRes, sRes] = await Promise.all([
        notesAPI.getAll({ search: searchTerm, subject_id: filterSubjectId || undefined }),
        subjectsAPI.getAll()
      ]);
      setNotes(nRes.data.notes || []);
      setSubjects(sRes.data.subjects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotesAndSubjects();
  }, [searchTerm, filterSubjectId]);

  const handleOpenCreate = () => {
    setEditingNote(null);
    setFormData({ title: '', content: '', subject_id: '', tags: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      subject_id: note.subject_id || '',
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingNote) {
        await notesAPI.update(editingNote.id, formData);
      } else {
        await notesAPI.create(formData);
      }
      setIsModalOpen(false);
      fetchNotesAndSubjects();
    } catch (err) {
      alert(err.message || 'Error saving note');
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await notesAPI.delete(noteId);
      fetchNotesAndSubjects();
    } catch (err) {
      alert(err.message || 'Error deleting note');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
            Notes & Revision Repository
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '4px' }}>
            Capture key concepts, revision cheat sheets, and explanations converted from the AI assistant.
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} />
          <span>New Note</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search notes by keyword or tag..."
            className="form-input"
            style={{ paddingLeft: '38px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={filterSubjectId}
          onChange={(e) => setFilterSubjectId(e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          title="No notes found"
          message="Capture study notes or ask the AI Assistant to convert answers into notes directly."
          actionText="Create First Note"
          onAction={handleOpenCreate}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {notes.map((note) => (
            <div key={note.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: note.subject_color || 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: note.subject_color || 'var(--primary)' }} />
                  {note.subject_name || 'General'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => handleOpenEdit(note)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px' }}
                    title="Edit Note"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px' }}
                    title="Delete Note"
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)' }}>
                {note.title}
              </h3>

              <p style={{
                fontSize: '13.5px',
                color: 'var(--muted)',
                lineHeight: 1.6,
                flex: 1,
                whiteSpace: 'pre-wrap',
                maxHeight: '180px',
                overflowY: 'auto'
              }}>
                {note.content}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                  {note.tags.map((tg, i) => (
                    <span key={i} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--panel-subtle)', color: 'var(--muted)' }}>
                      #{tg}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Note */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingNote ? 'Edit Note' : 'Create New Note'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Note Title</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Quick Reference: Big-O Notations"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Associated Subject</label>
            <select
              className="form-select"
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
            >
              <option value="">General (No specific subject)</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Note Content</label>
            <textarea
              rows={6}
              className="form-textarea"
              placeholder="Type your study notes, formulas, or code snippets..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. revision, exam-prep, formulas"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingNote ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

