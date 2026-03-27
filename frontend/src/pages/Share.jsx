import { useState, useEffect } from 'react';
import API from '../api/axios';
import { MdLink, MdContentCopy } from 'react-icons/md';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Share() {
  useDocumentTitle('Share Data');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    API.get('/files/').then((res) => setFiles(res.data)).catch(() => {});
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedFile || !password) {
      setError('Please select a file and enter your password.');
      return;
    }
    
    setLoading(true);
    setError('');
    setGeneratedLink('');
    setCopied(false);

    try {
      const res = await API.post('/verify/generate-link', {
        file_id: parseInt(selectedFile),
        password: password
      });
      const token = res.data.token;
      const url = `${window.location.origin}/verify/${token}`;
      setGeneratedLink(url);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate link. Check your password.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="page-header">
        <h2>Share Data</h2>
        <p>Generate a Zero-Knowledge Verification link for third parties (like scholarships) to instantly check your eligibility without seeing your raw scores.</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label>Select File to Share</label>
            <select 
              className="form-select" 
              value={selectedFile} 
              onChange={(e) => setSelectedFile(e.target.value)}
            >
              <option value="">-- Choose a File --</option>
              {files.map(f => (
                <option key={f.id} value={f.id}>{f.filename} ({f.data_type})</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Confirm Your Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Required to securely sign the verification token"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
               Your password is never saved or given to the third party. It is temporarily embedded inside an encrypted token to authorize the mathematical check.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: 20, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            disabled={loading}
          >
            <MdLink /> {loading ? 'Generating Secure Link...' : 'Generate Verification Link'}
          </button>
        </form>

        {generatedLink && (
          <div style={{ marginTop: 32, padding: 20, background: 'rgba(20, 184, 166, 0.1)', borderRadius: 8, border: '1px solid rgba(20, 184, 166, 0.2)' }}>
            <h4 style={{ color: 'var(--accent)', marginBottom: 12 }}>Link Generated Successfully!</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Share this link with the third party. It is valid for 7 days.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                readOnly 
                className="form-input" 
                value={generatedLink} 
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
              <button type="button" className="btn btn-secondary" onClick={copyToClipboard} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MdContentCopy /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
