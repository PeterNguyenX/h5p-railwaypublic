import React from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import authStore from '../../stores/authStore';
import { Select, MenuItem, SelectChangeEvent } from '@mui/material';

/* ── Inline SVG icons ── */
const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const HomeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const AdminIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const CloseMenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Navbar: React.FC = observer(() => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();
  const location    = useLocation();
  const isLoggedIn  = !!localStorage.getItem('token');
  const isAuthPage  = location.pathname === '/login' || location.pathname === '/register';
  const user        = authStore.user as any;

  const handleLogout = () => {
    authStore.logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const navLinks = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: <HomeIcon /> },
    { name: t('nav.upload'),    path: '/upload',    icon: <UploadIcon /> },
    ...(user?.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: <AdminIcon /> }] : []),
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const userInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        fontFamily: 'var(--tp-font, "Inter", sans-serif)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 64, gap: '2rem' }}>

          {/* Logo */}
          <RouterLink to="/dashboard" style={{ display:'flex', alignItems:'center', gap:'0.625rem', textDecoration:'none', flexShrink:0 }}>
            <div style={{
              background: '#1e3a5f', padding: '0.5rem', borderRadius: '0.625rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', display:'flex' }}><VideoIcon /></span>
            </div>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>TeachPlay</span>
          </RouterLink>

          {/* Desktop nav links */}
          {isLoggedIn && (
            <nav style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
              {navLinks.map(link => (
                <RouterLink
                  key={link.path}
                  to={link.path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0 0.25rem',
                    height: 64,
                    borderBottom: isActive(link.path) ? '2px solid #1e3a5f' : '2px solid transparent',
                    color: isActive(link.path) ? '#1e3a5f' : '#64748b',
                    fontWeight: isActive(link.path) ? 700 : 500,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    transition: 'color 0.15s, border-color 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {link.icon}
                  {link.name}
                </RouterLink>
              ))}
            </nav>
          )}

          {/* Spacer */}
          {!isLoggedIn && <div style={{ flex: 1 }} />}

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            {/* Language selector */}
            <Select
              size="small"
              value={i18n.language}
              onChange={(e: SelectChangeEvent) => i18n.changeLanguage(e.target.value)}
              sx={{ minWidth: 90, fontSize: '0.875rem' }}
            >
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="vi">VI</MenuItem>
            </Select>

            {isLoggedIn ? (
              <>
                {/* User badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', paddingRight: '1rem', borderRight: '1px solid #e2e8f0' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: '#e2e8f0', color: '#334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8125rem', fontWeight: 700,
                  }}>
                    {userInitials}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', lineHeight:1.2 }}>
                    <span style={{ fontSize:'0.875rem', fontWeight:600, color:'#334155' }}>{user?.username || 'Teacher'}</span>
                    <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{user?.role === 'admin' ? 'Administrator' : 'Teacher'}</span>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  title="Log out"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', padding: '0.5rem', borderRadius: '0.5rem',
                    display: 'flex', transition: 'color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color='#dc2626'; e.currentTarget.style.background='#fef2f2'; }}
                  onMouseLeave={e => { e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.background='none'; }}
                >
                  <LogOutIcon />
                </button>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', display:'flex', padding:'0.375rem' }}
                  className="tp-mobile-menu-btn"
                >
                  {mobileOpen ? <CloseMenuIcon /> : <MenuIcon />}
                </button>
              </>
            ) : !isAuthPage ? (
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <RouterLink
                  to="/login"
                  style={{ padding:'0.5rem 1rem', borderRadius:'0.5rem', color:'#334155', fontWeight:600, fontSize:'0.875rem', textDecoration:'none', border:'1px solid #e2e8f0', transition:'background 0.15s' }}
                >
                  {t('auth.login')}
                </RouterLink>
                <RouterLink
                  to="/register"
                  style={{ padding:'0.5rem 1rem', borderRadius:'0.5rem', background:'#1e3a5f', color:'white', fontWeight:600, fontSize:'0.875rem', textDecoration:'none', transition:'background 0.15s' }}
                >
                  {t('auth.register')}
                </RouterLink>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && isLoggedIn && (
          <div style={{ borderTop:'1px solid #f1f5f9', background:'white', padding:'0.75rem 1.5rem 1rem' }}>
            {navLinks.map(link => (
              <RouterLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                style={{
                  display:'flex', alignItems:'center', gap:'0.625rem',
                  padding:'0.75rem 0', borderBottom:'1px solid #f8fafc',
                  color: isActive(link.path) ? '#1e3a5f' : '#475569',
                  fontWeight: isActive(link.path) ? 700 : 500,
                  fontSize:'0.9375rem', textDecoration:'none',
                }}
              >
                {link.icon} {link.name}
              </RouterLink>
            ))}
          </div>
        )}
      </header>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @media (min-width: 768px) { .tp-mobile-menu-btn { display: none !important; } }
      `}</style>
    </>
  );
});

export default Navbar;