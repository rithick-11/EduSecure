import { useEffect, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import StatCard from '../components/StatCard';
import {
  HiOutlineUser,
  HiOutlineFolder,
  HiOutlineCalculator,
  HiOutlineKey,
} from 'react-icons/hi';

export default function Profile() {
  useDocumentTitle('My Profile');
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ files: 0, computations: 0, hasKeys: false });

  useEffect(() => {
    Promise.all([API.get('/files/'), API.get('/compute/history'), API.get('/keys/status')])
      .then(([f, c, k]) => {
        setStats({ files: f.data.length, computations: c.data.length, hasKeys: k.data.has_keys });
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="page-header">
        <h2>Profile</h2>
        <p>Your account information and usage statistics</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--primary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', color: 'white', fontWeight: 700,
            }}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user?.email}</div>
              <span className="badge badge-teal">{user?.role}</span>
            </div>
          </div>

          <div style={{ fontSize: '0.9rem', lineHeight: 2, color: 'var(--text-secondary)' }}>
            <div><strong>User ID:</strong> {user?.id}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Role:</strong> {user?.role}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StatCard icon={HiOutlineFolder} value={stats.files} label="Encrypted Files" color="blue" />
          <StatCard icon={HiOutlineCalculator} value={stats.computations} label="Computations" color="teal" />
          <StatCard icon={HiOutlineKey} value={stats.hasKeys ? 'Active' : 'None'} label="Encryption Keys" color="green" />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Account Actions</h3>
        <button className="btn btn-danger" onClick={logout}>Logout</button>
      </div>
    </>
  );
}
