import { useEffect, useState } from 'react';
import API from '../api/axios';
import { MdHistory, MdLockOpen, MdClose } from 'react-icons/md';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function History() {
  useDocumentTitle('Computation History');
  const [history, setHistory] = useState([]);
  const [decryptModal, setDecryptModal] = useState(null);
  const [password, setPassword] = useState('');
  const [decrypted, setDecrypted] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/compute/history').then((r) => setHistory(r.data)).catch(() => {});
  }, []);

  const handleDecrypt = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post(`/compute/${decryptModal}/decrypt`, { password });
      setDecrypted(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Decryption failed');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setDecryptModal(null);
    setPassword('');
    setDecrypted(null);
    setError('');
  };

  return (
    <>
      <div className="page-header">
        <h2>Computation History</h2>
        <p>View past computations and decrypt their results</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            No computations yet
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Operation</th><th>Files</th><th>Status</th><th>Duration</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {history.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td style={{ fontWeight: 500 }}>{c.operation}</td>
                  <td>{(c.input_file_ids || []).join(', ')}</td>
                  <td><span className={`badge ${c.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span></td>
                  <td>{c.duration_ms} ms</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    {c.result_file_id && (
                      <button className="btn btn-secondary btn-sm" onClick={() => setDecryptModal(c.id)}>
                        <MdLockOpen /> Decrypt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Decrypt Modal */}
      {decryptModal !== null && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Decrypt Result #{decryptModal}</h3>

            {decrypted ? (
              <div className="fade-in">
                <div className="alert alert-success">Decrypted successfully</div>
                <div style={{ fontSize: '0.85rem', marginBottom: 8 }}><strong>Operation:</strong> {decrypted.operation}</div>
                <div style={{ background: 'var(--bg-body)', padding: 16, borderRadius: 'var(--radius-sm)', maxHeight: 200, overflow: 'auto' }}>
                  <code style={{ fontSize: '0.8rem', color: 'var(--accent-light)', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(decrypted.result_values, null, 2)}
                  </code>
                </div>
                <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={closeModal}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleDecrypt}>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label>Encryption Password</label>
                  <input className="form-input" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter the password used during key generation" required />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Decrypting…' : 'Decrypt'}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={closeModal}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
