import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  BrainCircuit,
  Compass,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Clock,
  Award
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section style={{
        padding: '80px 32px 60px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        width: '100%'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '24px'
        }}>
          <Sparkles size={16} />
          <span>Next-Generation AI Student Platform</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          marginBottom: '20px',
          color: 'var(--ink)'
        }}>
          Master Your Syllabus.<br />
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Powered by Smart Algorithms & AI.
          </span>
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--muted)',
          maxWidth: '680px',
          margin: '0 auto 32px',
          lineHeight: 1.6
        }}>
          StudyFlow AI dynamically schedules your study sessions based on exam deadlines, topic difficulties, and your daily availability. Includes AI doubt clarification, MCQ quizzes, and personalized career roadmaps.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '16px' }}>
            <span>Start Planning For Free</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: '16px' }}>
            <span>Sign In to Dashboard</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginTop: '72px',
          textAlign: 'left'
        }}>
          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <CalendarDays size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Constraint-Based Planner</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Generates realistic daily and weekly timetables considering topic difficulty, exam proximity, and daily study hour caps.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <BrainCircuit size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Interactive MCQ Tests</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Timed test and practice modes with secure backend grading, answer explanations, and weak-topic revision alerts.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--warning-light)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <MessageSquare size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>AI Doubt Assistant</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Step-by-step problem solver and academic tutor with conversation history and one-click conversion of answers into revision notes.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Compass size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>AI Career Guidance</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Personalized skill-gap analysis, learning roadmaps, suggested portfolio projects, and resume enhancement guidance.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

