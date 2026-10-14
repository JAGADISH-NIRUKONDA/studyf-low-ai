import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
  Award,
  FileText,
  Briefcase
} from 'lucide-react';
import { careerAPI } from '../services/api';
import { EmptyState } from '../components/EmptyState';

export const CareerPage = () => {
  const [profile, setProfile] = useState({
    academic_interests: [],
    technical_skills: [],
    career_goal: 'Full Stack Web Developer'
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // New skill input
  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('Intermediate');
  const [interestInput, setInterestInput] = useState('');

  const fetchProfileAndRecs = async () => {
    try {
      const [profRes, recsRes] = await Promise.all([
        careerAPI.getProfile(),
        careerAPI.getRecommendations()
      ]);
      if (profRes.data?.profile) {
        setProfile({
          academic_interests: profRes.data.profile.academic_interests || [],
          technical_skills: profRes.data.profile.technical_skills || [],
          career_goal: profRes.data.profile.career_goal || 'Full Stack Web Developer'
        });
      }
      setRecommendations(recsRes.data?.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndRecs();
  }, []);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    setProfile((prev) => ({
      ...prev,
      technical_skills: [...prev.technical_skills, { skill: skillInput.trim(), level: skillLevel }]
    }));
    setSkillInput('');
  };

  const handleRemoveSkill = (index) => {
    setProfile((prev) => ({
      ...prev,
      technical_skills: prev.technical_skills.filter((_, i) => i !== index)
    }));
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (!interestInput.trim()) return;
    setProfile((prev) => ({
      ...prev,
      academic_interests: [...prev.academic_interests, interestInput.trim()]
    }));
    setInterestInput('');
  };

  const handleRemoveInterest = (index) => {
    setProfile((prev) => ({
      ...prev,
      academic_interests: prev.academic_interests.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateRecommendations = async () => {
    setAnalyzing(true);
    try {
      const res = await careerAPI.recommend(profile);
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      alert(err.message || 'Error generating recommendations');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
          AI Career Guidance & Learning Roadmaps
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '4px' }}>
          Personalized skill-gap analysis, structured learning phases, portfolio recommendations, and resume tips.
        </p>
      </div>

      {/* Profile & Skill Configuration Form */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={18} color="var(--primary)" />
          Your Student Academic & Technical Profile
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Target Career Goal */}
          <div className="form-group">
            <label className="form-label">Target Career Direction</label>
            <select
              className="form-select"
              value={profile.career_goal}
              onChange={(e) => setProfile({ ...profile, career_goal: e.target.value })}
            >
              <option value="Full Stack Web Developer">Full Stack Web Developer</option>
              <option value="AI & Machine Learning Engineer">AI & Machine Learning Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer</option>
            </select>
          </div>

          {/* Academic Interests */}
          <div className="form-group">
            <label className="form-label">Academic Interests (e.g. Distributed Systems, Neural Networks)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Add academic interest..."
                className="form-input"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
              />
              <button onClick={handleAddInterest} type="button" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                <Plus size={15} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.academic_interests.map((int, i) => (
                <span key={i} className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {int}
                  <button onClick={() => handleRemoveInterest(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Current Technical Skills */}
        <div style={{ marginTop: '16px' }}>
          <label className="form-label">Current Technical Skills & Proficiency</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Skill (e.g. React.js, Python, MongoDB, Docker)..."
              className="form-input"
              style={{ maxWidth: '240px' }}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
            />
            <select
              className="form-select"
              style={{ maxWidth: '140px' }}
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <button onClick={handleAddSkill} type="button" className="btn btn-secondary">
              <Plus size={15} /> Add Skill
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {profile.technical_skills.map((s, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  background: 'var(--panel-subtle)',
                  border: '1px solid var(--line)',
                  fontSize: '12.5px',
                  fontWeight: 600
                }}
              >
                <span>{s.skill}</span>
                <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                  ({s.level})
                </span>
                <button
                  onClick={() => handleRemoveSkill(idx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerateRecommendations}
          disabled={analyzing}
          className="btn btn-primary"
          style={{ marginTop: '24px', padding: '11px 24px' }}
        >
          <Sparkles size={16} />
          <span>{analyzing ? 'Analyzing Profile...' : 'Analyze Skills & Generate Recommendations'}</span>
        </button>
      </div>

      {/* Recommendations Display */}
      {recommendations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
            Personalized Career Guidance & Gap Analysis
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {recommendations.map((rec, rIdx) => (
              <div key={rIdx} className="card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '6px' }}>
                      Recommended Path #{rIdx + 1}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                      {rec.role_title}
                    </h3>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: rec.match_percentage >= 60 ? 'var(--success-light)' : 'var(--warning-light)',
                    color: rec.match_percentage >= 60 ? 'var(--success)' : 'var(--warning)',
                    fontWeight: 800,
                    fontSize: '16px'
                  }}>
                    <span>{rec.match_percentage}% Skill Match</span>
                  </div>
                </div>

                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                  {rec.summary}
                </p>

                {/* Skill Gap Analysis Pills */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                    Skill Gap Analysis
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {rec.matched_skills?.map((ms, i) => (
                      <span key={i} className="badge badge-success" title="You already have this skill">
                        ✓ {ms.skill}
                      </span>
                    ))}
                    {rec.skill_gaps?.map((gs, i) => (
                      <span key={i} className="badge badge-danger" title="Skill to acquire">
                        + {gs}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4-Phase Learning Roadmap */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} color="var(--primary)" />
                    Structured Learning Roadmap
                  </h4>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '14px'
                  }}>
                    {rec.learning_roadmap?.map((phase, pIdx) => (
                      <div
                        key={pIdx}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          background: 'var(--panel-subtle)',
                          border: '1px solid var(--line)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>
                            Phase {pIdx + 1}: {phase.phase}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            {phase.duration}
                          </span>
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                          {phase.goal}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Portfolio Projects & Certifications */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Projects */}
                  <div>
                    <h5 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} color="var(--primary)" />
                      Suggested Portfolio Projects
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {rec.suggested_projects?.map((proj, prIdx) => (
                        <div key={prIdx} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--panel-subtle)', border: '1px solid var(--line)' }}>
                          <strong style={{ fontSize: '13px', display: 'block', color: 'var(--ink)' }}>{proj.title}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{proj.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications & Resume */}
                  <div>
                    <h5 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={15} color="var(--warning)" />
                      Verified Certifications & Resume Tips
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {rec.certifications?.map((cert, cIdx) => (
                        <div key={cIdx} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--panel-subtle)', border: '1px solid var(--line)' }}>
                          <strong style={{ fontSize: '13px', display: 'block', color: 'var(--ink)' }}>{cert.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Platform: {cert.platform}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

