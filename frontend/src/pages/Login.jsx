import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState(role === 'admin' ? 'admin' : 'STU001');
  const [password, setPassword] = useState(role === 'admin' ? 'admin123' : 'student123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    if (newRole === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('STU001');
      setPassword('student123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password, role);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div style={{ display: 'flex', maxWidth: '960px', width: '100%', gap: '40px', alignItems: 'center' }}>
        
        {/* Left Info Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(124, 92, 252, 0.15)', border: '1px solid rgba(124, 92, 252, 0.3)', padding: '6px 14px', borderRadius: '20px', width: 'fit-content' }}>
            <Sparkles size={16} color="#7C5CFC" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#7C5CFC' }}>Constraint Satisfaction Engine</span>
          </div>

          <h1 style={{ fontSize: '38px', lineHeight: 1.2, fontWeight: 700, background: 'linear-gradient(135deg, #F8FAFC, #A8B3C7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Timetable Generator
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
            Generate conflict-free optimized schedules using AI Constraint Satisfaction, Backtracking, and Heuristic Search. Smart group-wise scheduling with automatic break generation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', fontSize: '14px' }}>
              <CheckCircle2 size={18} color="#34D399" /> Group-wise parallel scheduling with automatic breaks
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', fontSize: '14px' }}>
              <CheckCircle2 size={18} color="#34D399" /> Role-based privacy protection for student timetables
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', fontSize: '14px' }}>
              <CheckCircle2 size={18} color="#34D399" /> Automated multi-sheet Excel data validation & export
            </div>
          </div>
        </div>

        {/* Right Login Box */}
        <div className="login-box">
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>Login to Your Account</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center' }}>
            Select role and enter your credentials
          </p>

          <div className="role-toggle">
            <button
              type="button"
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => handleRoleChange('admin')}
            >
              Administrator
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'student' ? 'active' : ''}`}
              onClick={() => handleRoleChange('student')}
            >
              Student
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#F87171', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {role === 'admin' ? 'Admin User ID' : 'Student ID'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'admin' ? 'e.g. admin' : 'e.g. STU001'}
                  required
                  style={{ width: '100%', paddingLeft: '40px' }}
                />
                <User size={18} color="#A8B3C7" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{ width: '100%', paddingLeft: '40px', paddingRight: '40px' }}
                />
                <Lock size={18} color="#A8B3C7" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none' }}
                >
                  {showPassword ? <EyeOff size={18} color="#A8B3C7" /> : <Eye size={18} color="#A8B3C7" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
              {loading ? 'Authenticating...' : `Login as ${role === 'admin' ? 'Admin' : 'Student'}`}
            </button>
          </form>

          {/* Demo Credentials Box */}
          <div style={{ marginTop: '24px', background: 'var(--bg-card-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '4px' }}>
              Demo Credentials:
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div><strong>Admin:</strong> admin / admin123</div>
              <div><strong>Student:</strong> STU001 / student123</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
