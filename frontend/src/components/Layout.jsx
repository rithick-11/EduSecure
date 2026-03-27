import { useState } from 'react';
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
  HiOutlineShare,
  HiMenu,
  HiX,
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
  { to: '/share',        icon: HiOutlineShare,        label: 'Share Data' },
  { to: '/profile',      icon: HiOutlineUser,         label: 'Profile' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-header-btn" onClick={() => setIsSidebarOpen(true)}>
          <HiMenu />
        </button>
        <div className="mobile-header-title">
          <HiOutlineShieldCheck style={{ color: 'var(--accent)' }} /> EduSecure
        </div>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      />

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
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
              onClick={closeSidebar}
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
