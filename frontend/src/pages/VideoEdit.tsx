import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import InteractiveIcon from '@mui/icons-material/TouchApp';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QuizIcon from '@mui/icons-material/Quiz';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import VideoPlayer from '../components/VideoPlayer';
import AdvancedH5PEditor from '../components/AdvancedH5PEditor';
import api from '../config/api';

const VideoEdit: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [h5pEditorOpen, setH5pEditorOpen] = useState(false);
  const [currentContentId, setCurrentContentId] = useState<string | undefined>();
  const [preselectedLibrary, setPreselectedLibrary] = useState<string | undefined>();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [h5pContents, setH5pContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const [videoData, setVideoData] = useState<any>(null);
  const [answeredContentIds, setAnsweredContentIds] = useState<Set<string>>(new Set());
  const [ltiDialogOpen, setLtiDialogOpen] = useState(false);
  const [ltiLink, setLtiLink] = useState<string | null>(null);
  const [ltiError, setLtiError] = useState<string | null>(null);

  const h5pContentTypes = [
    { id: 'H5P.MultiChoice', title: 'Multiple Choice', description: 'Create flexible multiple choice questions with feedback', icon: <QuizIcon />, category: 'Quiz' },
    { id: 'H5P.TrueFalse', title: 'True/False Question', description: 'Create simple true or false questions', icon: <QuizIcon />, category: 'Quiz' },
    { id: 'H5P.Blanks', title: 'Fill in the Blanks', description: 'Create tasks where users fill in missing words', icon: <TextFieldsIcon />, category: 'Interactive' },
  ];

  const fetchVideoData = useCallback(async () => {
    try {
      const response = await api.get(`/videos/${id}`);
      setVideoData(response.data);
    } catch (error: any) {
      console.error('Error fetching video data:', error);
    }
  }, [id]);

  const fetchH5PContent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/h5p/video/${id}/content`);
      setH5pContents(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error fetching H5P content:', error);
      setSaveError('Failed to load H5P content');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const exportToH5P = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/h5p/video/${id}/export`, {}, { responseType: 'blob' });
      const blob = new Blob([response.data as any], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let filename = 'video.h5p';
      if (videoData?.filePath) {
        const parts = videoData.filePath.split('/');
        const base = parts[parts.length - 1].replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9\-_]/g, '-');
        filename = `${base}.h5p`;
      } else if (videoData?.title) {
        filename = `${videoData.title.replace(/[^a-zA-Z0-9\-_]/g, '-').substring(0, 50)}.h5p`;
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSaveSuccess(true);
      setExportDialog(false);
    } catch (error: any) {
      console.error('Error exporting H5P:', error);
      setSaveError('Failed to export H5P file');
    } finally {
      setLoading(false);
    }
  };

  const createH5PContent = (libraryId: string) => {
    setCurrentContentId(undefined);
    setPreselectedLibrary(libraryId);
    setH5pEditorOpen(true);
  };

  const deleteH5PContent = async (contentId: string) => {
    try {
      await api.delete(`/h5p/content/${contentId}`);
      await fetchH5PContent();
      setSaveSuccess(true);
    } catch (error: any) {
      console.error('Error deleting H5P content:', error);
      setSaveError('Failed to delete H5P content');
    }
  };

  useEffect(() => {
    if (id) { fetchVideoData(); fetchH5PContent(); }
  }, [id, fetchVideoData, fetchH5PContent]);

  const handleOpenH5PEditor = (contentId?: string) => {
    setCurrentContentId(contentId);
    setPreselectedLibrary(undefined);
    setH5pEditorOpen(true);
  };

  const handleSaveH5PContent = async (contentData: any) => {
    try {
      const timestamp = contentData.timestamp || 0;
      let response;
      if (contentData.id) {
        response = await api.put(`/h5p/content/${contentData.id}`, { contentData, timestamp });
        console.log('H5P content updated:', response.data);
      } else {
        response = await api.post(`/h5p/video/${id}`, { contentData, timestamp });
        console.log('H5P content created:', response.data);
      }
      setSaveSuccess(true);
      await fetchH5PContent();
    } catch (error: any) {
      console.error('Error saving H5P content:', error);
      setSaveError(error.response?.data?.error || 'Failed to save H5P content');
    }
  };

  const handleVideoTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.target as HTMLVideoElement;
    setCurrentVideoTime(video.currentTime);
  };

  const handleContentAnswered = (contentId: string) => {
    setAnsweredContentIds(prev => { const s = new Set(prev); s.add(contentId); return s; });
  };

  const handleLtiExport = async () => {
    setLtiError(null); setLtiLink(null);
    try {
      const res = await api.get<{ ltiLink: string }>(`/lti/generate/${id}`);
      setLtiLink(res.data.ltiLink);
      setLtiDialogOpen(true);
    } catch (err: any) {
      setLtiError(err.response?.data?.error || 'Failed to generate LTI link');
      setLtiDialogOpen(true);
    }
  };

  /* ── Styles ── */
  const titleLabel = videoData?.title ? `"${videoData.title}"` : 'Video Editor';

  const panelStyle: React.CSSProperties = {
    background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '1.5rem',
  };
  const panelHead: React.CSSProperties = {
    padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };
  const panelBody: React.CSSProperties = { padding: '1.5rem' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* Page header */}
      <div style={{ background:'white', borderBottom:'1px solid #e2e8f0', padding:'1rem 1.5rem', display:'flex', flexWrap:'wrap', gap:'1rem', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'0.5rem', borderRadius:'0.5rem', color:'#64748b', display:'flex' }}
            onMouseEnter={e => { e.currentTarget.style.background='#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div style={{ width:1, height:24, background:'#e2e8f0' }} />
          <h1 style={{ margin:0, fontSize:'1.125rem', fontWeight:700, color:'#0f172a' }}>{titleLabel}</h1>
          <span style={{ padding:'0.25rem 0.625rem', background:'#f1f5f9', color:'#64748b', fontSize:'0.75rem', fontWeight:600, borderRadius:'0.375rem' }}>Editor</span>
        </div>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialog(true)}
            disabled={h5pContents.length === 0}
            sx={{ borderRadius:'0.625rem', fontWeight:600, borderColor:'#e2e8f0', color:'#334155', '&:hover':{ borderColor:'#cbd5e1', background:'#f8fafc' } }}
          >Export .h5p</Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleLtiExport}
            sx={{ borderRadius:'0.625rem', fontWeight:600, borderColor:'#e2e8f0', color:'#334155', '&:hover':{ borderColor:'#cbd5e1', background:'#f8fafc' } }}
          >Export LTI</Button>
          <Button
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            onClick={() => navigate(`/videos/${id}/ai-enrich`)}
            sx={{ borderRadius:'0.625rem', fontWeight:700, background:'#ea580c', '&:hover':{ background:'#c2410c' }, boxShadow:'0 1px 3px rgba(234,88,12,0.3)' }}
          >AI Enrich</Button>
        </Stack>
      </div>

      {/* Main content */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Video preview */}
        <div style={panelStyle}>
          <div style={panelHead}><h2 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>Preview Player</h2></div>
          <div style={panelBody}>
            <VideoPlayer
              videoId={id || ''}
              h5pContents={h5pContents}
              onTimeUpdate={handleVideoTimeUpdate}
              onContentAnswered={handleContentAnswered}
            />
            {h5pContents.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Interactive Content in this Video</Typography>
                <Grid container spacing={2}>
                  {h5pContents.map((content, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ opacity: answeredContentIds.has(content.id) ? 0.5 : 1, position:'relative' }}>
                        {answeredContentIds.has(content.id) && (
                          <Box sx={{ position:'absolute', top:8, right:8, zIndex:1, bgcolor:'success.main', color:'white', borderRadius:'50%', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center' }}>✓</Box>
                        )}
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                            <Typography variant="h6" sx={{ fontSize:'1rem' }}>{content.title || content.metadata?.title || `Interactive Content ${index + 1}`}</Typography>
                            <Stack direction="row" spacing={1}>
                              <IconButton size="small" onClick={() => handleOpenH5PEditor(content.id)}><EditIcon fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => deleteH5PContent(content.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                            </Stack>
                          </Stack>
                          <Typography variant="body2" color="text.secondary" gutterBottom>{content.library || 'H5P Interactive Content'}</Typography>
                          {content.params?.question && <Typography variant="body2" sx={{ mb:1, fontStyle:'italic' }}>"{content.params.question.substring(0, 80)}..."</Typography>}
                          <Stack direction="row" spacing={1} mt={2}>
                            <Chip size="small" label={`${content.timestamp || 0}s`} />
                            <Chip size="small" label={content.status || 'Active'} color="success" />
                            {content.params?.answers && <Chip size="small" label={`${content.params.answers.length} options`} variant="outlined" />}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </div>
        </div>

        {/* Add Interactions */}
        <div style={panelStyle}>
          <div style={panelHead}>
            <div>
              <h2 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>Add Interactions</h2>
              <p style={{ margin:'0.25rem 0 0', fontSize:'0.875rem', color:'#64748b' }}>Choose an H5P content type to create interactive elements.</p>
            </div>
          </div>
          <div style={panelBody}>
            <Grid container spacing={3}>
              {h5pContentTypes.map((library) => (
                <Grid item xs={12} sm={6} md={4} key={library.id}>
                  <Card
                    sx={{ height:'100%', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s', border:'1px solid #e2e8f0', '&:hover':{ transform:'translateY(-3px)', boxShadow:3 } }}
                    onClick={() => createH5PContent(library.id)}
                  >
                    <CardContent sx={{ textAlign:'center', p:3 }}>
                      <Box sx={{ color:'primary.main', mb:2 }}>{React.cloneElement(library.icon, { sx:{ fontSize:40 } })}</Box>
                      <Typography variant="h6" gutterBottom>{library.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}>{library.description}</Typography>
                      <Chip label={library.category} size="small" color="primary" variant="outlined" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </div>
        </div>

        {/* Import H5P file */}
        <div style={panelStyle}>
          <div style={panelHead}>
            <div>
              <h2 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>Import H5P File</h2>
              <p style={{ margin:'0.25rem 0 0', fontSize:'0.875rem', color:'#64748b' }}>Upload an existing .h5p file to add it to your video.</p>
            </div>
          </div>
          <div style={panelBody}>
            <Stack direction="column" spacing={2}>
              <input
                type="file"
                accept=".h5p"
                style={{ display:'none' }}
                id="h5p-file-input"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      setLoading(true);
                      const formData = new FormData();
                      formData.append('h5pFile', file);
                      formData.append('videoId', id || '');
                      formData.append('timestamp', currentVideoTime.toString());
                      await api.post('/h5p/upload', formData, { headers:{ 'Content-Type':'multipart/form-data' } });
                      setSaveSuccess(true);
                      await fetchH5PContent();
                      (e.target as HTMLInputElement).value = '';
                    } catch (error: any) {
                      console.error('Error uploading H5P file:', error);
                      setSaveError(error.response?.data?.error || 'Failed to upload .h5p file');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
              />
              <Button variant="outlined" component="label" htmlFor="h5p-file-input" disabled={loading} sx={{ py:1.5, borderRadius:'0.625rem' }}>
                Choose .h5p File
              </Button>
              <Typography variant="caption" color="text.secondary">
                Select a .h5p file to import. It will be added at {Math.floor(currentVideoTime)} seconds.
              </Typography>
            </Stack>
          </div>
        </div>

      </div>

      {/* H5P Editor Dialog */}
      <AdvancedH5PEditor
        open={h5pEditorOpen}
        onClose={() => setH5pEditorOpen(false)}
        onSave={handleSaveH5PContent}
        contentId={currentContentId}
        videoId={id || ''}
        preselectedLibrary={preselectedLibrary}
        currentVideoTime={currentVideoTime}
      />

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Interactive Video</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>Export your video with all H5P interactive content as a single .h5p file.</Typography>
          <Box sx={{ mb:2 }}>
            <Typography variant="subtitle2" gutterBottom>Content to Export:</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><VideoLibraryIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Video file" secondary="Main video content" />
              </ListItem>
              {h5pContents.map((content, index) => (
                <ListItem key={index}>
                  <ListItemIcon><InteractiveIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary={content.title || `Interactive Content ${index + 1}`} secondary={`${content.library} at ${content.timestamp}s`} />
                </ListItem>
              ))}
            </List>
          </Box>
          <Alert severity="info">The exported .h5p file can be imported into any H5P-compatible platform or LMS.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={exportToH5P} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}>
            {loading ? 'Exporting...' : 'Export H5P'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar open={saveSuccess} autoHideDuration={6000} onClose={() => setSaveSuccess(false)}>
        <Alert onClose={() => setSaveSuccess(false)} severity="success">H5P content saved successfully!</Alert>
      </Snackbar>
      <Snackbar open={!!saveError} autoHideDuration={6000} onClose={() => setSaveError(null)}>
        <Alert onClose={() => setSaveError(null)} severity="error">{saveError}</Alert>
      </Snackbar>

      {/* LTI Dialog */}
      <Dialog open={ltiDialogOpen} onClose={() => setLtiDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Export LTI Link</DialogTitle>
        <DialogContent>
          {ltiError && <Alert severity="error" sx={{ mb:2 }}>{ltiError}</Alert>}
          {ltiLink && (
            <>
              <Typography variant="body1" paragraph>Your video is now available as an LTI link. Copy this link to integrate it into your LMS:</Typography>
              <TextField label="LTI Link" value={ltiLink} fullWidth InputProps={{ readOnly:true }} onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()} sx={{ mb:2 }} />
              <Alert severity="info">This LTI link provides access to your interactive video with all H5P content.</Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLtiDialogOpen(false)}>Close</Button>
          {ltiLink && (
            <Button variant="contained" onClick={() => navigator.clipboard.writeText(ltiLink)} startIcon={<ShareIcon />}>Copy Link</Button>
          )}
        </DialogActions>
      </Dialog>

    </div>
  );
});

export default VideoEdit;