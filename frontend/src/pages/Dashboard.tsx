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
  Button,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { formatDuration } from '../utils/format';
import api from '../config/api';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailPath: string;
  duration: string;
}

const Dashboard: React.FC = observer(() => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
    }
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
          <Button
            component={RouterLink}
            to="/upload"
            variant="contained"
            color="primary"
          >
            {t('dashboard.uploadVideo')}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={video.thumbnailPath || '/placeholder-video.jpg'}
                  alt={video.title}
                />
                <CardContent>
                  <Typography variant="h6" noWrap>
                    {video.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {video.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDuration(parseFloat(video.duration))}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    component={RouterLink}
                    to={`/videos/${video.id}`}
                    size="small"
                    color="primary"
                  >
                    <PlayArrowIcon />
                  </IconButton>
                  <IconButton
                    component={RouterLink}
                    to={`/videos/${video.id}/edit`}
                    size="small"
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(video.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
});

export default Dashboard;
