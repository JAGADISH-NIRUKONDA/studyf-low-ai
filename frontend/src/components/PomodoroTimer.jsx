import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Coffee, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

const MODES = {
  focus: { name: 'Focus Session', minutes: 25, color: 'var(--primary)' },
  shortBreak: { name: 'Short Break', minutes: 5, color: 'var(--success)' },
  longBreak: { name: 'Long Break', minutes: 15, color: 'var(--warning)' },
};

export const PomodoroTimer = ({ onSessionComplete }) => {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleTimerCompletion();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerCompletion = () => {
    confetti({ particleCount: 75, spread: 60 });
    if (mode === 'focus') {
      const nextCycle = completedCycles + 1;
      setCompletedCycles(nextCycle);
      if (onSessionComplete) {
        onSessionComplete(25);
      }
      if (nextCycle % 4 === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      switchMode('focus');
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].minutes * 60);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].minutes * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPct = ((MODES[mode].minutes * 60 - timeLeft) / (MODES[mode].minutes * 60)) * 100;

  return (
    <div className="card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={18} color="var(--primary)" />
          Pomodoro Focus Timer
        </h3>
        <span className="badge badge-primary">
          Cycle {completedCycles % 4}/4
        </span>
      </div>

      {/* Mode selectors */}
      <div style={{
        display: 'inline-flex',
        background: 'var(--panel-subtle)',
        border: '1px solid var(--line)',
        borderRadius: '10px',
        padding: '4px',
        gap: '4px',
        marginBottom: '24px'
      }}>
        {Object.entries(MODES).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '7px',
              background: mode === key ? 'var(--panel)' : 'transparent',
              color: mode === key ? 'var(--primary)' : 'var(--muted)',
              fontWeight: mode === key ? 700 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: mode === key ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {cfg.name}
          </button>
        ))}
      </div>

      {/* Big countdown display */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '56px',
          fontFamily: 'Manrope, monospace',
          fontWeight: 800,
          color: 'var(--ink)',
          letterSpacing: '-1.5px',
          lineHeight: 1
        }}>
          {formatTime(timeLeft)}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
          {isRunning ? (mode === 'focus' ? 'Deep focus in progress...' : 'Rest and recharge!') : 'Ready to start'}
        </p>
      </div>

      {/* Progress line */}
      <div style={{
        height: '6px',
        background: 'var(--line)',
        borderRadius: '999px',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: MODES[mode].color,
          transition: 'width 0.4s ease'
        }} />
      </div>

      {/* Control buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <button
          onClick={toggleTimer}
          className="btn btn-primary"
          style={{ minWidth: '130px', padding: '10px 20px', fontSize: '15px' }}
        >
          {isRunning ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start Focus</>}
        </button>
        <button
          onClick={resetTimer}
          className="btn btn-secondary"
          title="Reset Timer"
          style={{ padding: '10px 14px' }}
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
};

