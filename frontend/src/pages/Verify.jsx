import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { MdVerifiedUser, MdErrorOutline } from 'react-icons/md';

export default function Verify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [columnName, setColumnName] = useState('');
  const [requiredScore, setRequiredScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { eligible: true/false }

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!columnName || requiredScore === '') {
      setError('Please provide both the column name and the required score.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await API.post('/verify/check-eligibility', {
        token: token,
        column_name: columnName,
        required_score: parseInt(requiredScore)
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed. The token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', padding: 20 }}>
      
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: '2.2rem' }}>
          <MdVerifiedUser /> EduSecure Verification Portal
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, maxWidth: 500, lineHeight: 1.6 }}>
          You have been provided a Zero-Knowledge Proof token. Enter the required criteria below to cryptographically verify if the student meets it, without viewing their raw scores.
        </p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 500, padding: 32 }}>
        
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        {!result ? (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>Field / Column to Verify</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. math_score, total_points"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label>Minimum Required Score</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 85"
                value={requiredScore}
                onChange={(e) => setRequiredScore(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: 24, padding: 14, fontSize: '1.1rem' }}
              disabled={loading}
            >
              {loading ? 'Performing Homomorphic Evaluation...' : 'Verify Eligibility'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {result.eligible ? (
              <div>
                <MdVerifiedUser style={{ fontSize: '6rem', color: '#10b981' }} />
                <h2 style={{ color: '#10b981', marginTop: 16 }}>ELIGIBLE</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>
                  The student cryptographically proved that their <strong>{result.column}</strong> is greater than or equal to <strong>{result.required}</strong>.
                </p>
              </div>
            ) : (
              <div>
                <MdErrorOutline style={{ fontSize: '6rem', color: '#ef4444' }} />
                <h2 style={{ color: '#ef4444', marginTop: 16 }}>NOT ELIGIBLE</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>
                  The student's <strong>{result.column}</strong> does not meet the minimum requirement of <strong>{result.required}</strong>.
                </p>
              </div>
            )}

            <button 
              className="btn btn-secondary" 
              style={{ marginTop: 32 }}
              onClick={() => setResult(null)}
            >
              Verify Another Requirement
            </button>
          </div>
        )}

      </div>

      <div style={{ marginTop: 32 }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
           Go to EduSecure Homepage
        </button>
      </div>

    </div>
  );
}
