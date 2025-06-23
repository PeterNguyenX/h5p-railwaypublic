import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Snackbar,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import CloseIcon from '@mui/icons-material/Close';
import { formatDuration } from '../utils/format';
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
}

const Dashboard: React.FC = observer(() => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [ltiDialogOpen, setLtiDialogOpen] = useState(false);
  const [ltiLink, setLtiLink] = useState<string | null>(null);
  const [ltiError, setLtiError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);
  const { t } = useTranslation();

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

  const handleDelete = async (videoId: string) => {
    if (!window.confirm(t('dashboard.confirmDelete'))) return;

    try {
      await api.delete(`/videos/${videoId}`);
      setVideos(videos.filter(video => video.id !== videoId));
      setSuccess(t('dashboard.success'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
    }
  };

  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            {t('dashboard.title')}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
              <Card
                sx={{
                  boxShadow: 3,
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
                onContextMenu={async (e) => {
                  e.preventDefault();
                  const menu = document.createElement('div');
                  menu.style.position = 'absolute';
                  menu.style.top = `${e.clientY}px`;
                  menu.style.left = `${e.clientX}px`;
                  menu.style.backgroundColor = 'white';
                  menu.style.border = '1px solid #ccc';
                  menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                  menu.style.zIndex = '1000';
                  menu.style.padding = '8px';
                  menu.style.borderRadius = '4px';

                  const editOption = document.createElement('div');
                  editOption.textContent = 'Edit';
                  editOption.style.padding = '8px';
                  editOption.style.cursor = 'pointer';
                  editOption.onclick = () => {
                    window.location.href = `/edit/${video.id}`;
                    document.body.removeChild(menu);
                  };

                  const deleteOption = document.createElement('div');
                  deleteOption.textContent = 'Delete';
                  deleteOption.style.padding = '8px';
                  deleteOption.style.cursor = 'pointer';
                  deleteOption.onclick = () => {
                    handleDelete(video.id);
                    document.body.removeChild(menu);
                  };

                  const exportOption = document.createElement('div');
                  exportOption.textContent = 'Export LTI';
                  exportOption.style.padding = '8px';
                  exportOption.style.cursor = 'pointer';
                  exportOption.onclick = async () => {
                    setLtiError(null);
                    setLtiLink(null);
                    setDownloadUrl(null);
                    try {
                      const res = await api.get<{ ltiLink: string }>(`/lti/generate/${video.id}`);
                      setLtiLink(res.data.ltiLink);
                      setLtiDialogOpen(true);
                    } catch (err: any) {
                      setLtiError(err.response?.data?.error || 'Failed to generate LTI link');
                      setLtiDialogOpen(true);
                    }
                    document.body.removeChild(menu);
                  };

                  const downloadOption = document.createElement('div');
                  downloadOption.textContent = 'Download';
                  downloadOption.style.padding = '8px';
                  downloadOption.style.cursor = 'pointer';
                  downloadOption.onclick = () => {
                    // Fix: handle filePath for download and use backend port
                    let downloadPath = video.filePath || '';
                    if (downloadPath.startsWith('uploads/')) {
                      downloadPath = '/' + downloadPath;
                    } else if (downloadPath.startsWith('backend/uploads/')) {
                      downloadPath = '/' + downloadPath.replace('backend/', '');
                    } else if (!downloadPath.startsWith('/uploads/')) {
                      downloadPath = '/uploads/videos/' + downloadPath;
                    }
                    setDownloadUrl(downloadPath);
                    setSnackbarMsg('Download started');
                    const backendUrl = `http://localhost:3001${downloadPath}`;
                    const win = window.open(backendUrl, '_blank');
                    setTimeout(() => {
                      window.history.back();
                    }, 1000);
                    document.body.removeChild(menu);
                  };

                  menu.appendChild(editOption);
                  menu.appendChild(deleteOption);
                  menu.appendChild(exportOption);
                  menu.appendChild(downloadOption);

                  document.body.appendChild(menu);

                  const handleClickOutside = (event: MouseEvent) => {
                    if (menu && !menu.contains(event.target as Node)) {
                      if (menu.parentNode) {
                        document.body.removeChild(menu);
                      }
                      document.removeEventListener('click', handleClickOutside);
                    }
                  };

                  document.addEventListener('click', handleClickOutside);
                }}
              >
                <CardMedia
                  component="img"
                  height="180"
                  image={video.thumbnailPath || '/placeholder-video.jpg'}
                  alt={video.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" component="div" noWrap>
                    {video.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {video.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog
        open={!!selectedVideo}
        onClose={handleCloseVideo}
        maxWidth="lg"
        fullWidth
        aria-hidden="false"
      >
        <DialogContent sx={{ p: 0, position: 'relative' }} aria-hidden="false">
          <IconButton
            onClick={handleCloseVideo}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedVideo && (
            <VideoPlayer
              videoId={selectedVideo.id}
              onTimeUpdate={(e) => {
                // Handle time update if needed
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={ltiDialogOpen} onClose={() => setLtiDialogOpen(false)}>
        <DialogTitle>Export LTI Link</DialogTitle>
        <DialogContent>
          {ltiError && <Alert severity="error">{ltiError}</Alert>}
          {ltiLink && (
            <>
              <TextField
                label="LTI Link"
                value={ltiLink}
                fullWidth
                InputProps={{ readOnly: true }}
                onFocus={e => e.target.select()}
                sx={{ mb: 2 }}
              />
              <Button onClick={() => navigator.clipboard.writeText(ltiLink)} variant="outlined">Copy</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={!!snackbarMsg}
        autoHideDuration={3000}
        onClose={() => setSnackbarMsg(null)}
        message={snackbarMsg}
      />
    </Container>
  );
});

export default Dashboard;
