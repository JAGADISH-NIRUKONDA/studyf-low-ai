import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Award,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { quizzesAPI, subjectsAPI } from '../services/api';
import { EmptyState } from '../components/EmptyState';

export const QuizzesPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Setup Quiz state
  const [selectedTopic, setSelectedTopic] = useState('Python');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [isTimedMode, setIsTimedMode] = useState(true);

  // Active Test state
  const [activeQuiz, setActiveQuiz] = useState(null); // { questions, topic, mode }
  const [currentAnswers, setCurrentAnswers] = useState({}); // { [qId]: optionIndex }
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 mins
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evaluated Result state
  const [quizResult, setQuizResult] = useState(null);

  const fetchData = async () => {
    try {
      const [subjRes, attRes, weakRes] = await Promise.all([
        subjectsAPI.getAll(),
        quizzesAPI.getAttempts({ limit: 10 }),
        quizzesAPI.getWeakTopics()
      ]);
      setSubjects(subjRes.data.subjects || []);
      setAttempts(attRes.data.attempts || []);
      setWeakTopics(weakRes.data.weak_topics || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timer countdown
  useEffect(() => {
    let timer = null;
    if (activeQuiz && isTimedMode && timeRemaining > 0 && !quizResult) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && activeQuiz && !quizResult) {
      handleSubmitQuiz();
    }
    return () => clearInterval(timer);
  }, [activeQuiz, isTimedMode, timeRemaining, quizResult]);

  const handleStartQuiz = async () => {
    setLoading(true);
    setQuizResult(null);
    setCurrentAnswers({});
    setTimeRemaining(questionCount * 60); // 1 minute per question

    try {
      const res = await quizzesAPI.getQuestions({
        topic: selectedTopic,
        count: questionCount,
        difficulty: difficulty
      });
      const qList = res.data.questions || [];
      if (qList.length === 0) {
        alert('No questions found for this topic yet.');
        return;
      }
      setActiveQuiz({ questions: qList, topic: selectedTopic });
    } catch (err) {
      alert(err.message || 'Error loading quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setCurrentAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);

    const submissions = activeQuiz.questions.map((q) => ({
      question_id: q.id,
      selected_option: currentAnswers[q.id] !== undefined ? currentAnswers[q.id] : null
    }));

    const totalSeconds = questionCount * 60;
    const timeTaken = isTimedMode ? Math.max(1, totalSeconds - timeRemaining) : 60;

    try {
      const res = await quizzesAPI.submit({
        topic: activeQuiz.topic,
        submissions: submissions,
        time_taken_seconds: timeTaken
      });
      setQuizResult(res.data);
      if (res.data.percentage >= 70) {
        confetti({ particleCount: 100, spread: 70 });
      }
      fetchData();
    } catch (err) {
      alert(err.message || 'Error submitting quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitQuiz = () => {
    setActiveQuiz(null);
    setQuizResult(null);
    setCurrentAnswers({});
  };

  // Helper formatting for timer
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
            MCQ Tests & Knowledge Evaluation
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '4px' }}>
            Timed exam practice, backend-secured scoring, detailed answer explanations, and revision insights.
          </p>
        </div>
      </div>

      {/* Weak Topics Warning Banner */}
      {weakTopics.length > 0 && !activeQuiz && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderRadius: '14px',
          background: 'var(--warning-light)',
          border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
          color: 'var(--ink)'
        }}>
          <AlertTriangle size={24} color="var(--warning)" flexShrink={0} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '14px', color: 'var(--warning)', display: 'block' }}>
              Weak Topic Revision Recommended
            </strong>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '2px 0 0' }}>
              Your recent scores are below 70% on: {weakTopics.map(w => `${w.topic} (${w.average_percentage}%)`).join(', ')}. Practice more questions to improve retention.
            </p>
          </div>
        </div>
      )}

      {/* Active Quiz View */}
      {activeQuiz && !quizResult && (
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '6px' }}>
                {activeQuiz.topic} Quiz
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Answer all {activeQuiz.questions.length} questions
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {isTimedMode && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: timeRemaining <= 60 ? 'var(--danger-light)' : 'var(--panel-subtle)',
                  color: timeRemaining <= 60 ? 'var(--danger)' : 'var(--primary)',
                  fontWeight: 800,
                  fontSize: '16px',
                  fontFamily: 'monospace'
                }}>
                  <Clock size={18} />
                  <span>{formatTimer(timeRemaining)}</span>
                </div>
              )}
              <button onClick={handleExitQuiz} className="btn btn-secondary btn-sm">
                Exit
              </button>
            </div>
          </div>

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {activeQuiz.questions.map((q, qIndex) => (
              <div key={q.id} style={{ paddingBottom: '20px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                    Q{qIndex + 1}.
                  </span>
                  <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                    {q.question}
                  </strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((opt, optIndex) => {
                    const isSelected = currentAnswers[q.id] === optIndex;
                    return (
                      <label
                        key={optIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: isSelected ? 'var(--primary-light)' : 'var(--panel-subtle)',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--line)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name={`question_${q.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(q.id, optIndex)}
                          style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: isSelected ? 600 : 400 }}>
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button onClick={handleExitQuiz} className="btn btn-secondary">
              Cancel Test
            </button>
            <button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ minWidth: '150px' }}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Evaluating...' : 'Submit Answers'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Evaluated Result View */}
      {quizResult && (
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: quizResult.percentage >= 70 ? 'var(--success-light)' : 'var(--warning-light)',
              color: quizResult.percentage >= 70 ? 'var(--success)' : 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '28px',
              fontWeight: 800
            }}>
              {quizResult.percentage >= 70 ? <Award size={36} /> : <AlertTriangle size={36} />}
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px' }}>
              {quizResult.percentage >= 70 ? 'Great Performance!' : 'Needs More Revision'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
              You scored <strong>{quizResult.score}</strong> out of <strong>{quizResult.total}</strong> ({quizResult.percentage}%) on {quizResult.topic}.
            </p>

            <button onClick={handleExitQuiz} className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
              <RotateCcw size={15} /> Retake / Choose Another
            </button>
          </div>

          {/* Breakdown & Explanations */}
          <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>
            Question Breakdown & Detailed Explanations
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {quizResult.breakdown?.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  border: `1px solid ${item.is_correct ? 'var(--success)' : 'var(--danger)'}`,
                  background: item.is_correct ? 'color-mix(in srgb, var(--success) 6%, transparent)' : 'color-mix(in srgb, var(--danger) 6%, transparent)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  {item.is_correct ? <CheckCircle2 size={18} color="var(--success)" /> : <XCircle size={18} color="var(--danger)" />}
                  <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>
                    Q{idx + 1}. {item.question}
                  </strong>
                </div>

                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0 12px' }}>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Your Answer: </span>
                    <strong style={{ color: item.is_correct ? 'var(--success)' : 'var(--danger)' }}>
                      {item.selected_option !== null ? item.options[item.selected_option] : 'Not answered'}
                    </strong>
                  </div>
                  {!item.is_correct && (
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Correct Answer: </span>
                      <strong style={{ color: 'var(--success)' }}>
                        {item.options[item.correct_option]}
                      </strong>
                    </div>
                  )}
                </div>

                {item.explanation && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--panel)',
                    fontSize: '12.5px',
                    color: 'var(--muted)',
                    border: '1px solid var(--line)'
                  }}>
                    💡 <strong>Explanation:</strong> {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Configuration Launcher & History */}
      {!activeQuiz && !quizResult && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {/* Start New Quiz Form */}
          <div className="card">
            <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={18} color="var(--primary)" />
              Configure & Launch Test
            </h3>

            <div className="form-group">
              <label className="form-label">Subject & Topic</label>
              <select
                className="form-select"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                <option value="Python">Python Programming</option>
                <option value="Artificial Intelligence">Artificial Intelligence & ML</option>
                <option value="Computer Science">Computer Science & Algorithms</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select
                  className="form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="All">Mixed Difficulty</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Question Count</label>
                <select
                  className="form-select"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                >
                  <option value={3}>3 Questions (Quick check)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Full exam)</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <input
                type="checkbox"
                id="timedModeCheck"
                checked={isTimedMode}
                onChange={(e) => setIsTimedMode(e.target.checked)}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="timedModeCheck" style={{ fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                Enable Timed Exam Mode (1 min / question)
              </label>
            </div>

            <button
              onClick={handleStartQuiz}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px', padding: '12px' }}
            >
              <Play size={18} />
              <span>{loading ? 'Preparing...' : 'Start MCQ Test'}</span>
            </button>
          </div>

          {/* Past Attempts Table */}
          <div className="card">
            <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '20px' }}>
              Past Quiz History
            </h3>

            {attempts.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
                No quiz attempts on record yet. Complete your first test on the left!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {attempts.map((att) => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'var(--panel-subtle)',
                      border: '1px solid var(--line)'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--ink)' }}>{att.topic}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                        {new Date(att.created_at).toLocaleDateString()} • {att.time_taken_seconds || 60}s
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${att.score / att.total >= 0.7 ? 'badge-success' : 'badge-warning'}`}>
                        {att.score} / {att.total} ({Math.round(att.score / att.total * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

