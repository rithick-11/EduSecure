import { useEffect, useState } from 'react';
import API from '../api/axios';
import { MdFunctions, MdPlayArrow } from 'react-icons/md';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Compute() {
  useDocumentTitle('Compute (FHE)');
  const [files, setFiles] = useState([]);
  const [operation, setOperation] = useState('average');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [scalar, setScalar] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/files/').then((r) => setFiles(r.data.filter((f) => f.data_type !== 'result'))).catch(() => {});
  }, []);

  const toggleFile = (id) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleRun = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const { data } = await API.post('/compute/', {
        operation,
        input_file_ids: selectedFiles,
        parameters: operation === 'scalar_multiply' ? { scalar } : {},
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Computation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Homomorphic Computation</h2>
        <p>Run operations on encrypted data — without ever decrypting it</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Configure Operation</h3>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleRun}>
            <div className="form-group">
              <label>Operation</label>
              <select className="form-select" value={operation} onChange={(e) => setOperation(e.target.value)}>
                <option value="addition">Addition (element-wise)</option>
                <option value="scalar_multiply">Scalar Multiply</option>
                <option value="summation">Summation (all values)</option>
                <option value="average">Average</option>
              </select>
            </div>

            {operation === 'scalar_multiply' && (
              <div className="form-group">
                <label>Scalar Value</label>
                <input className="form-input" type="number" value={scalar}
                  onChange={(e) => setScalar(parseInt(e.target.value) || 0)} />
              </div>
            )}

            <div className="form-group">
              <label>Select Files ({selectedFiles.length} selected)</label>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
                {files.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No files available. Upload files first.
                  </div>
                ) : files.map((f) => (
                  <label key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    cursor: 'pointer', borderRadius: 6,
                    background: selectedFiles.includes(f.id) ? 'rgba(20,184,166,0.1)' : 'transparent',
                  }}>
                    <input type="checkbox" checked={selectedFiles.includes(f.id)}
                      onChange={() => toggleFile(f.id)} />
                    <span style={{ fontSize: '0.85rem' }}>{f.filename}</span>
                    <span className="badge badge-teal" style={{ marginLeft: 'auto' }}>{f.data_type}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" type="submit"
              disabled={loading || selectedFiles.length === 0}>
              <MdPlayArrow /> {loading ? 'Computing…' : 'Run Computation'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Result</h3>
          {result ? (
            <div className="fade-in">
              <div className="alert alert-success">Computation completed in {result.duration_ms} ms</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div><strong>Operation:</strong> {result.operation}</div>
                <div><strong>Status:</strong> <span className="badge badge-success">{result.status}</span></div>
                <div><strong>Result File ID:</strong> {result.result_file_id}</div>
                <div><strong>Duration:</strong> {result.duration_ms} ms</div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 16 }}>
                Go to <strong>History</strong> to decrypt and view the results.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <p>Configure and run a computation to see results here</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
