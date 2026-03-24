import { useEffect, useState } from 'react';
import API from '../api/axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { MdQueryStats } from 'react-icons/md';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const COLORS = ['#14b8a6', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'];

export default function Analytics() {
  useDocumentTitle('Analytics');
  const [fileStats, setFileStats] = useState([]);
  const [computeStats, setComputeStats] = useState([]);

  useEffect(() => {
    Promise.all([API.get('/files/'), API.get('/compute/history')])
      .then(([f, h]) => { setFileStats(f.data); setComputeStats(h.data); })
      .catch(() => {});
  }, []);

  // Charts data
  const typeCount = files.reduce((acc, f) => {
    acc[f.data_type] = (acc[f.data_type] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

  const opCount = history.reduce((acc, c) => {
    acc[c.operation] = (acc[c.operation] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(opCount).map(([name, count]) => ({ name, count }));

  return (
    <>
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Visualize your encrypted data and computation trends</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdQueryStats style={{ color: 'var(--accent)' }} /> Files by Data Type
          </h3>
          {pieData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdQueryStats style={{ color: 'var(--accent)' }} /> Operations Performed
          </h3>
          {barData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Inter-Institutional Insights</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          Homomorphic encryption allows institutions to collaboratively compute statistics —
          like cross-university grade comparisons or research aggregations —
          <strong> without ever sharing raw student data</strong>. Each institution encrypts their data locally,
          and all computations happen on ciphertexts.
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
          {['Compare Averages', 'Aggregate Research Data', 'Joint GPA Analysis'].map((label) => (
            <div key={label} className="badge badge-teal" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
