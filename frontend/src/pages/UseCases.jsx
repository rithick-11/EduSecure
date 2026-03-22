import {
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineDocumentSearch,
  HiOutlineGlobe,
  HiOutlineLightBulb,
} from 'react-icons/hi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const cases = [
  {
    icon: HiOutlineAcademicCap,
    title: 'Secure Grade Analytics',
    desc: 'Compute average grades, percentile rankings, and grade distributions across departments without exposing individual student scores.',
    color: 'blue',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'FERPA-Compliant Data Sharing',
    desc: 'Share encrypted student data with partner institutions for joint research while maintaining full FERPA compliance.',
    color: 'green',
  },
  {
    icon: HiOutlineUserGroup,
    title: 'Cross-University Research',
    desc: 'Multiple universities can collaboratively analyze research datasets without any institution revealing their raw data.',
    color: 'teal',
  },
  {
    icon: HiOutlineDocumentSearch,
    title: 'Encrypted Record Queries',
    desc: 'Administrators can query encrypted student records for aggregated statistics without accessing individual records.',
    color: 'purple',
  },
  {
    icon: HiOutlineGlobe,
    title: 'International Exchange Programs',
    desc: 'Securely compare academic performance standards across institutions in different countries using encrypted metrics.',
    color: 'amber',
  },
  {
    icon: HiOutlineLightBulb,
    title: 'AI Model Training on Encrypted Data',
    desc: 'Train machine learning models on encrypted educational datasets, preserving student privacy throughout the process.',
    color: 'blue',
  },
];

export default function UseCases() {
  useDocumentTitle('Use Cases');
  return (
    <>
      <div className="page-header">
        <h2>Use Cases</h2>
        <p>How homomorphic encryption transforms educational data privacy</p>
      </div>

      <div className="grid-3">
        {cases.map(({ icon: Icon, title, desc, color }, i) => (
          <div key={i} className="card" style={{ cursor: 'default' }}>
            <div className={`stat-icon ${color}`} style={{ marginBottom: 16 }}>
              <Icon />
            </div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
