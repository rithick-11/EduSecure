import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Login() {
  useDocumentTitle('Sign In');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
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
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to EduSecure</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
