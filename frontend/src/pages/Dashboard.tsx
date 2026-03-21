import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import {
  Dialog, DialogContent, IconButton, DialogTitle,
  Button, TextField, Snackbar, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getThumbnailUrl, handleThumbnailError } from '../utils/thumbnailUtils';
import api from '../config/api';
import VideoPlayer from '../components/VideoPlayer';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailPath: string;
  duration: string;
  youtubeUrl?: string;
  youtubeId?: string;
  hlsPath?: string;
  filePath?: string;
  status?: string;
}

/* ── Inline SVG icons ── */
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

type TabType = 'all' | 'published' | 'draft';

const Dashboard: React.FC = observer(() => {
  const [videos, setVideos]         = useState<Video[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab]   = useState<TabType>('all');
  const [ltiDialogOpen, setLtiDialogOpen] = useState(false);
  const [ltiLink, setLtiLink]       = useState<string | null>(null);
  const [ltiError, setLtiError]     = useState<string | null>(null);
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);
  const [menuOpen, setMenuOpen]     = useState<string | null>(null); // video id
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get<Video[]>('/videos');
        setVideos(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch videos');
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDelete = async (videoId: string) => {
    if (!window.confirm('Delete this video?')) return;
    try {
      await api.delete(`/videos/${videoId}`);
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
    }
    setMenuOpen(null);
  };

  const handleLtiExport = async (videoId: string) => {
    setLtiError(null); setLtiLink(null);
    try {
      const res = await api.get<{ ltiLink: string }>(`/lti/generate/${videoId}`);
      setLtiLink(res.data.ltiLink);
      setLtiDialogOpen(true);
    } catch (err: any) {
      setLtiError(err.response?.data?.error || 'Failed to generate LTI link');
      setLtiDialogOpen(true);
    }
    setMenuOpen(null);
  };

  const handleH5PExport = async (video: Video) => {
    try {
      const response = await api.post(`/h5p/video/${video.id}/export`, {}, { responseType: 'blob' });
      const blob = new Blob([response.data as any], { type: 'application/zip' });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      const base = video.filePath
        ? video.filePath.split('/').pop()!.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9\-_]/g, '-')
        : video.title.replace(/[^a-zA-Z0-9\-_]/g, '-').substring(0, 50);
      link.download = `${base}.h5p`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSnackbarMsg('H5P export started!');
    } catch {
      setSnackbarMsg('Failed to export H5P file');
    }
    setMenuOpen(null);
  };

  const filteredVideos = videos.filter(v => {
    if (activeTab === 'published') return (v.status || '').toLowerCase() === 'published';
    if (activeTab === 'draft')     return (v.status || '').toLowerCase() !== 'published';
    return true;
  });

  const counts = {
    all:       videos.length,
    published: videos.filter(v => (v.status || '').toLowerCase() === 'published').length,
    draft:     videos.filter(v => (v.status || '').toLowerCase() !== 'published').length,
  };

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'50vh', fontFamily:'var(--tp-font)' }}>
        <div style={{ width:40, height:40, border:'4px solid #e2e8f0', borderTopColor:'var(--tp-navy)', borderRadius:'50%', animation:'tp-spin 0.8s linear infinite' }} />
        <style>{`@keyframes tp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tabStyle = (tab: TabType): React.CSSProperties => ({
    padding: '0.75rem 0',
    marginRight: '1.5rem',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--tp-navy)' : '2px solid transparent',
    background: 'none',
    color: activeTab === tab ? 'var(--tp-navy)' : '#64748b',
    fontWeight: activeTab === tab ? 700 : 500,
    fontSize: '0.9375rem',
    cursor: 'pointer',
    transition: 'color 0.15s',
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'var(--tp-font)' }}>

      {/* Header row */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem', marginBottom:'2rem' }}>
        <div>
          <h1 style={{ fontSize:'1.875rem', fontWeight:800, color:'#0f172a', margin:'0 0 0.25rem', letterSpacing:'-0.02em' }}>My Videos</h1>
          <p style={{ color:'#64748b', fontSize:'0.9375rem', margin:0 }}>Manage and edit your interactive lessons.</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          style={{
            display:'inline-flex', alignItems:'center', gap:'0.5rem',
            padding:'0.75rem 1.25rem',
            background:'var(--tp-orange)', color:'white',
            fontWeight:700, fontSize:'0.9375rem',
            border:'none', borderRadius:'0.75rem',
            cursor:'pointer', boxShadow:'0 1px 3px rgba(234,88,12,0.3)',
            transition:'background 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--tp-orange-dark)'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--tp-orange)'; e.currentTarget.style.transform='translateY(0)'; }}
        >
          <PlusIcon /> Create New Video
        </button>
      </div>

      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'0.75rem', padding:'0.875rem 1rem', marginBottom:'1.5rem', color:'#dc2626' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom:'1px solid #e2e8f0', marginBottom:'2rem', display:'flex' }}>
        {(['all', 'published', 'draft'] as TabType[]).map(tab => (
          <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'all' ? `All Videos (${counts.all})` : tab === 'published' ? `Published (${counts.published})` : `Drafts (${counts.draft})`}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1.5rem' }}>
        {filteredVideos.map(video => (
          <div
            key={video.id}
            style={{
              background:'white', borderRadius:'1rem', overflow:'hidden',
              border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
              transition:'box-shadow 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)')}
          >
            {/* Thumbnail */}
            <div
              style={{ position:'relative', aspectRatio:'16/9', background:'#0f172a', cursor:'pointer', overflow:'hidden' }}
              onClick={() => setSelectedVideo(video)}
            >
              <img
                src={getThumbnailUrl(video.thumbnailPath)}
                alt={video.title}
                style={{ width:'100%', height:'100%', objectFit:'cover', transition:'opacity 0.2s' }}
                onError={handleThumbnailError}
              />
              {/* Hover overlay */}
              <div className="tp-thumb-overlay" style={{
                position:'absolute', inset:0,
                background:'rgba(15,23,42,0.45)',
                opacity:0, transition:'opacity 0.2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem',
              }}>
                <button
                  style={{ background:'white', color:'#0f172a', padding:'0.625rem', borderRadius:'50%', border:'none', cursor:'pointer', display:'flex', boxShadow:'0 2px 6px rgba(0,0,0,0.2)', transition:'transform 0.15s' }}
                  title="Preview"
                  onClick={e => { e.stopPropagation(); setSelectedVideo(video); }}
                  onMouseEnter={e => (e.currentTarget.style.transform='scale(1.1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
                >
                  <PlayIcon />
                </button>
                <button
                  style={{ background:'var(--tp-navy)', color:'white', padding:'0.625rem', borderRadius:'50%', border:'none', cursor:'pointer', display:'flex', boxShadow:'0 2px 6px rgba(0,0,0,0.2)', transition:'transform 0.15s' }}
                  title="Edit"
                  onClick={e => { e.stopPropagation(); navigate(`/videos/${video.id}/edit`); }}
                  onMouseEnter={e => (e.currentTarget.style.transform='scale(1.1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
                >
                  <EditIcon />
                </button>
              </div>
              {/* Duration badge */}
              {video.duration && (
                <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.75)', color:'white', fontSize:'0.75rem', fontWeight:600, padding:'0.125rem 0.5rem', borderRadius:'0.375rem', backdropFilter:'blur(4px)' }}>
                  {video.duration}
                </div>
              )}
            </div>

            {/* Card body */}
            <div style={{ padding:'1.25rem' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <span style={{
                  display:'inline-flex', padding:'0.125rem 0.5rem',
                  borderRadius:'0.25rem', fontSize:'0.6875rem',
                  fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em',
                  background: (video.status||'').toLowerCase() === 'published' ? '#f1f5f9' : '#fff7ed',
                  color:       (video.status||'').toLowerCase() === 'published' ? '#475569' : '#9a3412',
                }}>
                  {video.status || 'Draft'}
                </span>

                {/* three-dot menu */}
                <div style={{ position:'relative' }} ref={menuOpen === video.id ? menuRef : undefined}>
                  <button
                    onClick={() => setMenuOpen(menuOpen === video.id ? null : video.id)}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:'0.25rem', color:'#94a3b8', borderRadius:'0.375rem', display:'flex' }}
                  >
                    <MoreIcon />
                  </button>
                  {menuOpen === video.id && (
                    <div style={{
                      position:'absolute', right:0, top:'calc(100% + 4px)', zIndex:50,
                      background:'white', border:'1px solid #e2e8f0',
                      borderRadius:'0.625rem', boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
                      minWidth:160, padding:'0.375rem',
                    }}>
                      {[
                        { label:'Edit', icon:<EditIcon />, action: () => navigate(`/videos/${video.id}/edit`) },
                        { label:'Export LTI', icon:<ShareIcon />, action: () => handleLtiExport(video.id) },
                        { label:'Export .h5p', icon:<DownloadIcon />, action: () => handleH5PExport(video) },
                        { label:'Delete', icon:<TrashIcon />, action: () => handleDelete(video.id), danger: true },
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          style={{
                            display:'flex', alignItems:'center', gap:'0.5rem',
                            width:'100%', padding:'0.5rem 0.75rem',
                            background:'none', border:'none',
                            color: (item as any).danger ? '#dc2626' : '#334155',
                            fontSize:'0.875rem', fontWeight:500, cursor:'pointer',
                            borderRadius:'0.375rem', textAlign:'left',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = (item as any).danger ? '#fef2f2' : '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <h3
                style={{ fontSize:'1.0625rem', fontWeight:700, color:'#0f172a', margin:'0 0 0.25rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer', transition:'color 0.15s' }}
                onClick={() => navigate(`/videos/${video.id}/edit`)}
                onMouseEnter={e => (e.currentTarget.style.color='var(--tp-navy)')}
                onMouseLeave={e => (e.currentTarget.style.color='#0f172a')}
              >
                {video.title}
              </h3>
              <p style={{ fontSize:'0.875rem', color:'#64748b', margin:'0 0 1rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {video.description || 'No description'}
              </p>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:'0.5rem', paddingTop:'0.875rem', borderTop:'1px solid #f1f5f9' }}>
                <button
                  onClick={() => navigate(`/videos/${video.id}/edit`)}
                  style={{
                    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem',
                    padding:'0.5rem 0.75rem', background:'#f8fafc',
                    border:'1px solid #e2e8f0', borderRadius:'0.5rem',
                    color:'#334155', fontWeight:600, fontSize:'0.875rem', cursor:'pointer',
                    transition:'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background='#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.background='#f8fafc')}
                >
                  <EditIcon /> {(video.status||'').toLowerCase() === 'published' ? 'Edit' : 'Continue Editing'}
                </button>
                <button
                  onClick={() => handleLtiExport(video.id)}
                  style={{
                    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem',
                    padding:'0.5rem 0.75rem', background:'white',
                    border:'1px solid #e2e8f0', borderRadius:'0.5rem',
                    color:'#334155', fontWeight:600, fontSize:'0.875rem', cursor:'pointer',
                    transition:'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background='white')}
                >
                  <ShareIcon /> Share
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create new card */}
        <button
          onClick={() => navigate('/upload')}
          style={{
            background:'#f8fafc', border:'2px dashed #cbd5e1', borderRadius:'1rem',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            padding:'2rem', minHeight:300, cursor:'pointer',
            transition:'background 0.15s, border-color 0.15s',
            color:'#64748b',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.borderColor='#94a3b8'; }}
          onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#cbd5e1'; }}
        >
          <div style={{ width:56, height:56, background:'white', border:'1px solid #e2e8f0', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', marginBottom:'1rem' }}>
            <PlusIcon />
          </div>
          <span style={{ fontSize:'1.0625rem', fontWeight:700, color:'#475569', marginBottom:'0.375rem' }}>Create New Video</span>
          <span style={{ fontSize:'0.875rem', color:'#94a3b8', textAlign:'center', maxWidth:180 }}>Upload a file or import from YouTube to start.</span>
        </button>
      </div>

      {/* Video preview dialog (kept from original) */}
      <Dialog open={!!selectedVideo} onClose={() => setSelectedVideo(null)} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setSelectedVideo(null)}
            sx={{ position:'absolute', right:8, top:8, color:'white', backgroundColor:'rgba(0,0,0,0.5)', '&:hover':{ backgroundColor:'rgba(0,0,0,0.7)' }, zIndex:1 }}
          >
            <CloseIcon />
          </IconButton>
          {selectedVideo && (
            <VideoPlayer videoId={selectedVideo.id} onTimeUpdate={() => {}} />
          )}
        </DialogContent>
      </Dialog>

      {/* LTI Dialog */}
      <Dialog open={ltiDialogOpen} onClose={() => setLtiDialogOpen(false)}>
        <DialogTitle>Export LTI Link</DialogTitle>
        <DialogContent>
          {ltiError && <Alert severity="error">{ltiError}</Alert>}
          {ltiLink && (
            <>
              <TextField label="LTI Link" value={ltiLink} fullWidth InputProps={{ readOnly: true }} onFocus={e => e.target.select()} sx={{ mb: 2, mt: 1 }} />
              <Button onClick={() => navigator.clipboard.writeText(ltiLink)} variant="outlined">Copy</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={!!snackbarMsg} autoHideDuration={3000} onClose={() => setSnackbarMsg(null)} message={snackbarMsg} />

      {/* Hover effect style */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        div:hover > .tp-thumb-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
});

export default Dashboard;
