import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  IconButton,
  Typography,
  styled,
  CircularProgress,
  Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { formatDuration } from '../utils/format';
import { useTranslation } from 'react-i18next';
import api from '../config/api';
import './VideoPlayer.css';

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  inlineSize: '100%',
  backgroundColor: '#000',
  aspectRatio: '16/9',
}));

const VideoControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  insetBlockEnd: 0,
  insetInlineStart: 0,
  insetInlineEnd: 0,
  padding: theme.spacing(2),
  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  opacity: 0,
  transition: 'opacity 0.3s ease',
  '&:hover': {
    opacity: 1,
  },
}));

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
}

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await api.get<Video>(`/videos/${id}`);
        setVideo(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('videoPlayer.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id, t]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !video) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">{error || t('videoPlayer.notFound')}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {video.title}
        </Typography>
        
        <VideoContainer ref={containerRef}>
          <div className="video-player-container">
            <video
              ref={videoRef}
              src={`/api/videos/${id}/stream`}
              onClick={handlePlayPause}
            />
          </div>
          
          <VideoControls>
            <IconButton
              onClick={handlePlayPause}
              size="small"
              sx={{ color: 'white' }}
              aria-label={isPlaying ? t('videoPlayer.pause') : t('videoPlayer.play')}
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>

            <Typography variant="caption" sx={{ color: 'white', inlineSize: 100 }}>
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </Typography>

            <IconButton
              onClick={handleFullscreen}
              size="small"
              sx={{ color: 'white' }}
              aria-label={t('videoPlayer.fullscreen')}
            >
              <FullscreenIcon />
            </IconButton>
          </VideoControls>
        </VideoContainer>

        <Typography variant="body1" sx={{ mt: 2 }}>
          {video.description}
        </Typography>
      </Box>
    </Container>
  );
};

export default VideoPlayer;