import { HiOutlineArrowDown } from 'react-icons/hi';

const layers = [
  {
    cls: 'presentation',
    title: 'Presentation Layer',
    items: ['React + Vite SPA', 'Responsive Dashboard', 'Auth Context + Protected Routes'],
    color: '#3b82f6',
  },
  {
    cls: 'api',
    title: 'API Layer — FastAPI',
    items: ['JWT Authentication', 'RESTful Endpoints', 'Rate Limiting (SlowAPI)', 'CORS Middleware'],
    color: '#14b8a6',
  },
  {
    cls: 'encryption',
    title: 'Encryption Engine — Pyfhel BFV',
    items: ['Key Generation (16384-bit)', 'Homomorphic Add / Multiply / Sum', 'AES-256 Private Key Protection', 'Relinearization'],
    color: '#a855f7',
  },
  {
    cls: 'data',
    title: 'Data Layer — PostgreSQL',
    items: ['Users & Roles', 'Encrypted File Storage', 'Computation History', 'Audit Logs'],
    color: '#f59e0b',
  },
];

export default function Architecture() {
  return (
    <>
      <div className="page-header">
        <h2>System Architecture</h2>
        <p>EduSecure's 4-tier architecture for secure educational data processing</p>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {layers.map((layer, i) => (
          <div key={i}>
            <div className={`arch-layer ${layer.cls}`}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 10, color: layer.color }}>{layer.title}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {layer.items.map((item) => (
                  <span key={item} style={{
                    background: 'rgba(255,255,255,0.06)', padding: '4px 12px',
                    borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-secondary)',
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {i < layers.length - 1 && (
              <div className="arch-connector"><MdArrowDownward /></div>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 12 }}>Security Highlights</h3>
        <div className="grid-3">
          {[
            { label: 'Encryption', text: 'BFV scheme with 128-bit security, poly modulus 16384' },
            { label: 'Key Protection', text: 'Private keys AES-256 encrypted with PBKDF2-derived key' },
            { label: 'Transport', text: 'HTTPS + JWT (24h expiry) + bcrypt password hashing' },
          ].map(({ label, text }) => (
            <div key={label} style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
