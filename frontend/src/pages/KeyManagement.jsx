import { useEffect, useState } from 'react';
import API from '../api/axios';
import { HiOutlineKey, HiOutlineShieldCheck } from 'react-icons/hi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function KeyManagement() {
  useDocumentTitle('Key Management');
  const [status, setStatus] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const loadStatus = async () => {
    try {
      const { data } = await API.get('/keys/status');
      setStatus(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadStatus(); }, []);

  const generate = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setMsg('');
    try {
      await API.post('/keys/generate', { password });
      setMsg('Keys generated successfully!');
      setPassword('');
      loadStatus();
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Key generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Key Management</h2>
        <p>Generate and manage your BFV homomorphic encryption keys</p>
      </div>

      <div className="grid-2">
        {/* Status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className={`stat-icon ${status?.has_keys ? 'green' : 'amber'}`}>
              <HiOutlineShieldCheck />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Key Status</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {status?.has_keys ? `Active since ${new Date(status.created_at).toLocaleDateString()}` : 'No keys generated'}
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: 8, fontSize: '0.9rem' }}>BFV Parameters</h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div><strong>Scheme:</strong> BFV (Brakerski/Fan-Vercauteren)</div>
              <div><strong>Poly modulus degree:</strong> 16384</div>
              <div><strong>Plain modulus:</strong> 1032193</div>
              <div><strong>Security level:</strong> 128-bit</div>
              <div><strong>Private key:</strong> AES-256 encrypted</div>
            </div>
          </div>
        </div>

        {/* Generate */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="stat-icon teal"><HiOutlineKey /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Generate Keys</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Create a new BFV key pair
              </div>
            </div>
          </div>

          {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

          <form onSubmit={generate}>
            <div className="form-group">
              <label>Encryption Password</label>
              <input className="form-input" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password to protect your private key" required />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              This password is used to AES-256 encrypt your private key. You will need it every time you decrypt results.
              <strong> We never store this password.</strong>
            </p>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Generating…' : 'Generate Keys'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
