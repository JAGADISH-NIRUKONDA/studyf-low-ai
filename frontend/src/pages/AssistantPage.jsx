import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Copy,
  Check,
  FilePlus,
  Trash2,
  Edit2,
  Sparkles,
  Info,
  BookOpen
} from 'lucide-react';
import { chatAPI, subjectsAPI } from '../services/api';

export const AssistantPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [sending, setSending] = useState(false);
  const [providerInfo, setProviderInfo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [savedNoteMsg, setSavedNoteMsg] = useState('');

  const messagesEndRef = useRef(null);

  const fetchInitial = async () => {
    try {
      const [convRes, subjRes, infoRes] = await Promise.all([
        chatAPI.getConversations(),
        subjectsAPI.getAll(),
        chatAPI.getProviderInfo()
      ]);
      const convList = convRes.data.conversations || [];
      setConversations(convList);
      setSubjects(subjRes.data.subjects || []);
      setProviderInfo(infoRes.data.ai_provider);

      if (convList.length > 0) {
        selectConversation(convList[0].id);
      } else {
        handleCreateNewConversation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = async (convId) => {
    setActiveConvId(convId);
    try {
      const res = await chatAPI.getConversation(convId);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNewConversation = async () => {
    try {
      const res = await chatAPI.createConversation({ title: 'New Academic Query' });
      const newConv = res.data.conversation;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch (err) {
      alert(err.message || 'Error creating conversation');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() || sending || !activeConvId) return;

    const userText = inputContent.trim();
    setInputContent('');
    setSending(true);
    setSavedNoteMsg('');

    // Optimistic UI for user message
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatAPI.sendMessage(activeConvId, {
        content: userText,
        subject_context: selectedSubject
      });
      const { user_message, assistant_message } = res.data;
      setMessages((prev) => [...prev.filter(m => m.id !== tempUserMsg.id), user_message, assistant_message]);
      // Refresh conversation list to get auto-renamed title
      const convRes = await chatAPI.getConversations();
      setConversations(convRes.data.conversations || []);
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNotes = async (content) => {
    try {
      await chatAPI.convertToNote({
        title: 'Study Clarification: ' + content.slice(0, 30) + '...',
        content: content
      });
      setSavedNoteMsg('Explanation saved directly to your Notes!');
      setTimeout(() => setSavedNoteMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Error saving to notes');
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await chatAPI.deleteConversation(convId);
      const remaining = conversations.filter(c => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          handleCreateNewConversation();
        }
      }
    } catch (err) {
      alert(err.message || 'Error deleting conversation');
    }
  };

  const handleRenameConversation = async (convId, currentTitle, e) => {
    e.stopPropagation();
    const newTitle = window.prompt('Rename conversation:', currentTitle);
    if (!newTitle || !newTitle.trim()) return;
    try {
      await chatAPI.renameConversation(convId, { title: newTitle.trim() });
      setConversations((prev) => prev.map(c => c.id === convId ? { ...c, title: newTitle.trim() } : c));
    } catch (err) {
      alert(err.message || 'Error renaming conversation');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
            AI Academic Doubt Assistant
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '4px' }}>
            Ask questions, explore step-by-step solutions, and convert explanations directly into revision notes.
          </p>
        </div>

        {/* AI Provider Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: providerInfo?.configured ? 'var(--success-light)' : 'var(--panel-subtle)',
          border: '1px solid var(--line)',
          fontSize: '12px'
        }}>
          <Sparkles size={14} color={providerInfo?.configured ? 'var(--success)' : 'var(--primary)'} />
          <span>Engine: <strong>{providerInfo?.provider || 'Educational Engine'}</strong></span>
        </div>
      </div>

      {savedNoteMsg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '10px',
          background: 'var(--success-light)',
          color: 'var(--success)',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {savedNoteMsg}
        </div>
      )}

      {/* Main Chat Layout: Conversations Sidebar + Messages Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(240px, 280px) 1fr',
        gap: '20px',
        minHeight: '620px'
      }}>
        {/* Left Sub-sidebar: Conversation Sessions */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <button
            onClick={handleCreateNewConversation}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', marginBottom: '14px' }}
          >
            <Plus size={16} /> New Question Thread
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1 }}>
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--ink)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {conv.title}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: isActive ? 1 : 0.6 }}>
                    <button
                      onClick={(e) => handleRenameConversation(conv.id, conv.title, e)}
                      title="Rename"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'inherit' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'inherit' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Messages + Input */}
        <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top Context Bar */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--panel-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={16} color="var(--primary)" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Subject Context:</span>
              <select
                className="form-select"
                style={{ padding: '4px 10px', fontSize: '12.5px', width: 'auto' }}
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">General Academic Query</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
                <Sparkles size={36} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' }}>
                  How can StudyFlow assist your learning today?
                </h4>
                <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto' }}>
                  Ask any question regarding your syllabus topics, request worked examples, or ask for a study breakdown.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '85%',
                      padding: '14px 18px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isUser ? 'var(--primary)' : 'var(--panel-subtle)',
                      color: isUser ? '#ffffff' : 'var(--ink)',
                      border: isUser ? 'none' : '1px solid var(--line)',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.content}
                    </div>

                    {/* Action buttons under assistant message */}
                    {!isUser && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '12px' }}>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedId === msg.id ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleSaveToNotes(msg.content)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          <FilePlus size={13} />
                          <span>Save to Notes</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <form onSubmit={handleSendMessage} style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--line)',
            background: 'var(--panel)',
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              required
              placeholder="Type your academic doubt or topic question..."
              className="form-input"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !inputContent.trim()}
              className="btn btn-primary"
              style={{ padding: '0 20px', flexShrink: 0 }}
            >
              {sending ? 'Answering...' : <><Send size={16} /> Send</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

