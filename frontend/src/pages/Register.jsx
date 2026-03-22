import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Register() {
  useDocumentTitle('Create Account');
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'student', institution: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="logo-icon" style={{
            width: 56, height: 56, borderRadius: 14, fontSize: 28,
            background: 'linear-gradient(135deg, #14b8a6, #1e3a5f)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white'
          }}>
            <HiOutlineShieldCheck />
          </div>
        </div>
        <h2>Create Account</h2>
        <p className="subtitle">Join EduSecure platform</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-input" value={form.full_name} onChange={set('full_name')} placeholder="Dr. Jane Smith" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="you@university.edu" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="form-select" value={form.role} onChange={set('role')}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>
          <div className="form-group">
            <label>Institution</label>
            <input className="form-input" value={form.institution} onChange={set('institution')} placeholder="MIT" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
