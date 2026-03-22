import { useEffect, useState } from 'react';
import API from '../api/axios';
import { MdInsertDriveFile, MdFunctions, MdHistory, MdVpnKey } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  HiOutlineFolder,
  HiOutlineCalculator,
  HiOutlineKey,
  HiOutlineClock,
} from 'react-icons/hi';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_files: 0, total_computations: 0, keys_active: false, recent_activity: [] });

  useEffect(() => {
    const load = async () => {
      try {
        const [filesRes, histRes, keysRes] = await Promise.all([
          API.get('/files/'),
          API.get('/compute/history'),
          API.get('/keys/status'),
        ]);
        setStats({
          total_files: filesRes.data.length,
          total_computations: histRes.data.length,
          keys_active: keysRes.data.has_keys,
          recent_activity: histRes.data.slice(0, 5),
        });
      } catch { /* ignore */ }
    };
    load();
  }, []);

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back, {user?.email}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 32 }}>
        <StatCard icon={HiOutlineFolder} value={stats.total_files} label="Encrypted Files" color="blue" />
        <StatCard icon={HiOutlineCalculator} value={stats.total_computations} label="Computations" color="teal" />
        <StatCard icon={HiOutlineKey} value={stats.keys_active ? 'Active' : 'None'} label="Encryption Keys" color="green" />
        <StatCard icon={HiOutlineClock} value={stats.recent_activity.length} label="Recent Activity" color="amber" />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Recent Computations</h3>
        {stats.recent_activity.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No computations yet. Upload files and run your first homomorphic operation.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Operation</th><th>Status</th><th>Duration</th><th>Date</th></tr>
            </thead>
            <tbody>
              {stats.recent_activity.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.operation}</td>
                  <td><span className={`badge ${c.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span></td>
                  <td>{c.duration_ms} ms</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
