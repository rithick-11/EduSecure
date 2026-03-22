import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineKey,
  HiOutlineCloudUpload,
  HiOutlineFolder,
  HiOutlineCalculator,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineCube,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineShieldCheck,
} from 'react-icons/hi';

const navItems = [
  { to: '/',             icon: HiOutlineHome,         label: 'Dashboard' },
  { to: '/keys',         icon: HiOutlineKey,          label: 'Key Management' },
  { to: '/upload',       icon: HiOutlineCloudUpload,  label: 'Upload & Encrypt' },
  { to: '/files',        icon: HiOutlineFolder,       label: 'My Files' },
  { to: '/compute',      icon: HiOutlineCalculator,   label: 'Compute' },
  { to: '/history',      icon: HiOutlineClock,        label: 'History' },
  { to: '/analytics',    icon: HiOutlineChartBar,     label: 'Analytics' },
  { to: '/use-cases',    icon: HiOutlineLightBulb,    label: 'Use Cases' },
  { to: '/architecture', icon: HiOutlineCube,         label: 'Architecture' },
  { to: '/profile',      icon: HiOutlineUser,         label: 'Profile' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon"><HiOutlineShieldCheck /></div>
            <h1>EduSecure</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon className="icon" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            {user?.email}
          </div>
          <button className="nav-link" onClick={handleLogout}>
            <HiOutlineLogout className="icon" /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content fade-in">
        {children}
      </main>
    </div>
  );
}
