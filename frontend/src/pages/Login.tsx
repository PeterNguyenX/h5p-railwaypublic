import React, { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import authStore from '../stores/authStore';
import '../../src/styles/teachplay-theme.css';

/* ── Icons (inline SVG to avoid new deps) ── */
const VideoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const LogInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);

const FEATURES = [
  { icon: <SparklesIcon />, text: 'AI-powered interaction suggestions' },
  { icon: <BookIcon />,     text: 'Seamless classroom integration' },
  { icon: <VideoIcon />,    text: 'Upload or use YouTube videos' },
];

const Login: React.FC = observer(() => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authStore.login(username, password);
      const redirectTo = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'var(--tp-font)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 960,
        display: 'flex',
        overflow: 'hidden',
        background: 'white',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        borderRadius: '1.25rem',
        border: '1px solid #e2e8f0',
      }}>

        {/* ── Left column: navy branding ── */}
        <div style={{
          display: 'none',
          width: '42%',
          background: 'var(--tp-navy)',
          padding: '3rem',
          color: 'white',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }} className="tp-login-left">
          {/* decorative circles */}
          <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
          <div style={{ position:'absolute', bottom:-80, left:-40, width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'2.5rem' }}>
              <div style={{ background:'white', padding:'0.625rem', borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }}>
                <span style={{ color: 'var(--tp-navy)' }}><VideoIcon /></span>
              </div>
              <span style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.02em' }}>TeachPlay</span>
            </div>

            <h1 style={{ fontSize:'2.25rem', fontWeight:800, lineHeight:1.2, marginBottom:'1rem' }}>
              Interactive learning,<br/>simplified.
            </h1>
            <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'1.0625rem', lineHeight:1.6, marginBottom:'2.5rem' }}>
              Create and share engaging video lessons with your students. Built specially for educators.
            </p>

            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              {FEATURES.map((f, i) => (
                <li key={i} style={{ display:'flex', alignItems:'center', gap:'1rem', color:'rgba(255,255,255,0.9)' }}>
                  <div style={{ background:'rgba(255,255,255,0.12)', padding:'0.5rem', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.15)', flexShrink:0, display:'flex' }}>
                    {f.icon}
                  </div>
                  <span style={{ fontWeight:500, fontSize:'0.9375rem' }}>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', fontSize:'0.8125rem', color:'rgba(255,255,255,0.5)', fontWeight:500, letterSpacing:'0.05em', textTransform:'uppercase' }}>
            <span>For Teachers</span>
            <span>Est. 2026</span>
          </div>
        </div>

        {/* ── Right column: login form ── */}
        <div style={{
          flex: 1,
          padding: 'clamp(2rem, 6vw, 4rem)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'white',
        }}>
          <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>

            {/* Mobile logo */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem', marginBottom:'2rem' }} className="tp-login-mobile-logo">
              <div style={{ background:'var(--tp-navy)', padding:'0.625rem', borderRadius:'0.75rem', display:'flex' }}>
                <span style={{ color:'white' }}><VideoIcon /></span>
              </div>
              <span style={{ fontSize:'1.5rem', fontWeight:800, color:'#0f172a' }}>TeachPlay</span>
            </div>

            <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
              <h2 style={{ fontSize:'1.875rem', fontWeight:800, color:'#0f172a', margin:'0 0 0.5rem', letterSpacing:'-0.02em' }}>Welcome back</h2>
              <p style={{ color:'#64748b', fontSize:'0.9375rem', margin:0 }}>Sign in to your teacher account to continue.</p>
            </div>

            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'0.75rem', padding:'0.875rem 1rem', marginBottom:'1.25rem', color:'#dc2626', fontSize:'0.9rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              {/* Email / username */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <label style={{ fontSize:'0.875rem', fontWeight:600, color:'#334155' }}>Email / Username</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', top:'50%', left:'0.875rem', transform:'translateY(-50%)', color:'#94a3b8', display:'flex', pointerEvents:'none' }}>
                    <MailIcon />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. j.doe@school.edu"
                    style={{
                      width:'100%', boxSizing:'border-box',
                      padding:'0.875rem 1rem 0.875rem 2.75rem',
                      background:'#f8fafc', border:'1px solid #e2e8f0',
                      borderRadius:'0.75rem', color:'#0f172a',
                      fontSize:'0.9375rem', outline:'none',
                      transition:'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor='#1e3a5f'; e.target.style.boxShadow='0 0 0 3px rgba(30,58,95,0.08)'; e.target.style.background='white'; }}
                    onBlur={e  => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; e.target.style.background='#f8fafc'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <label style={{ fontSize:'0.875rem', fontWeight:600, color:'#334155' }}>Password</label>
                  <a href="#" style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--tp-navy)', textDecoration:'none' }}>Forgot password?</a>
                </div>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', top:'50%', left:'0.875rem', transform:'translateY(-50%)', color:'#94a3b8', display:'flex', pointerEvents:'none' }}>
                    <LockIcon />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width:'100%', boxSizing:'border-box',
                      padding:'0.875rem 1rem 0.875rem 2.75rem',
                      background:'#f8fafc', border:'1px solid #e2e8f0',
                      borderRadius:'0.75rem', color:'#0f172a',
                      fontSize:'0.9375rem', outline:'none',
                      transition:'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor='#1e3a5f'; e.target.style.boxShadow='0 0 0 3px rgba(30,58,95,0.08)'; e.target.style.background='white'; }}
                    onBlur={e  => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; e.target.style.background='#f8fafc'; }}
                  />
                </div>
              </div>

              {/* Remember me */}
              <label style={{ display:'flex', alignItems:'center', gap:'0.625rem', cursor:'pointer', userSelect:'none', fontSize:'0.875rem', color:'#475569' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width:16, height:16, accentColor:'var(--tp-navy)', cursor:'pointer' }}
                />
                Keep me logged in for 30 days
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                  width:'100%', padding:'0.9375rem',
                  background: loading ? '#94a3b8' : 'var(--tp-orange)',
                  color:'white', fontWeight:700, fontSize:'0.9375rem',
                  border:'none', borderRadius:'0.75rem', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow:'0 1px 3px rgba(234,88,12,0.3)',
                  transition:'background 0.15s, transform 0.1s',
                  marginTop:'0.25rem',
                }}
                onMouseEnter={e => { if(!loading)(e.currentTarget.style.background='var(--tp-orange-dark)'); }}
                onMouseLeave={e => { if(!loading)(e.currentTarget.style.background='var(--tp-orange)'); }}
              >
                <LogInIcon />
                {loading ? 'Signing in…' : 'Sign In to Dashboard'}
              </button>
            </form>

            <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid #f1f5f9', textAlign:'center' }}>
              <p style={{ fontSize:'0.875rem', color:'#64748b', margin:0 }}>
                Don't have an account yet?{' '}
                <RouterLink to="/register" style={{ fontWeight:600, color:'var(--tp-navy)', textDecoration:'none' }}>
                  Create a teacher account
                </RouterLink>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @media (min-width: 1024px) {
          .tp-login-left       { display: flex !important; }
          .tp-login-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
});

export default Login;
