import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { MdCloudUpload, MdInsertDriveFile } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Upload() {
  useDocumentTitle('Upload & Encrypt');
  const navigate = useNavigate();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [dataType, setDataType] = useState('grades');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragover, setDragover] = useState(false);

  const handleFile = (f) => {
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.json'))) {
      setFile(f);
      setError('');
    } else {
      setError('Please select a CSV or JSON file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('data_type', dataType);

    try {
      setProgress(30);
      await API.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => {
          const pct = Math.round((p.loaded / p.total) * 60) + 30;
          setProgress(Math.min(pct, 90));
        },
      });
      setProgress(100);
      setTimeout(() => navigate('/files'), 600);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Upload & Encrypt</h2>
        <p>Upload a CSV or JSON file — all numeric columns will be homomorphically encrypted</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div
            className={`upload-zone ${dragover ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,.json" style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])} />

            {file ? (
              <div>
                <MdInsertDriveFile className="icon" style={{ fontSize: '2.5rem', color: 'var(--accent)' }} />
                <div style={{ fontWeight: 600, marginTop: 8 }}>{file.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ) : (
              <div>
                <MdCloudUpload className="icon" />
                <div style={{ fontWeight: 500, marginTop: 4 }}>Drop file here or click to browse</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Supports CSV and JSON files
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label>Data Type</label>
            <select className="form-select" value={dataType} onChange={(e) => setDataType(e.target.value)}>
              <option value="grades">Grades</option>
              <option value="gpa">GPA</option>
              <option value="research">Research Data</option>
              <option value="records">Student Records</option>
            </select>
          </div>

          {uploading && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>{progress < 30 ? 'Preparing…' : progress < 90 ? 'Encrypting…' : 'Complete!'}</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={!file || uploading}>
            {uploading ? 'Encrypting & Uploading…' : 'Encrypt & Upload'}
          </button>
        </form>
      </div>
    </>
  );
}
