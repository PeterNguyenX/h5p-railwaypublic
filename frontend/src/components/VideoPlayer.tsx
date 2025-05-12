import React, { useRef, useEffect, useState } from 'react';
import { Box, styled, Typography } from '@mui/material';
import api from '../config/api';
import Hls from 'hls.js';

interface VideoPlayerProps {
  videoId: string;
  onTimeUpdate?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
}

const VideoContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  backgroundColor: 'black',
  '& video': {
    width: '100%',
    maxHeight: '70vh',
  },
  '& iframe': {
    width: '100%',
    height: '70vh',
    border: 'none',
  },
});

const ErrorMessage = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
  backgroundColor: '#f5f5f5',
  color: '#d32f2f',
  padding: '16px',
  textAlign: 'center',
});

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/videos/${videoId}`);
        setVideoData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching video data:', err);
        setError('Failed to load video data');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', () => {
        setDuration(videoRef.current?.duration || 0);
      });
    }
  }, []);

  useEffect(() => {
    if (videoRef.current && videoData?.hlsPath) {
      const videoUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${videoData.hlsPath}`;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setDuration(videoRef.current?.duration || 0);
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = videoUrl;
      } else {
        setError('Your browser does not support HLS playback.');
      }
    }
  }, [videoData?.hlsPath]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading video...</Typography>
      </Box>
    );
  }

  if (error || !videoData) {
    return (
      <ErrorMessage>
        <Typography>{error || 'Video not found'}</Typography>
      </ErrorMessage>
    );
  }

  if (!videoData) {
    return (
      <ErrorMessage>
        <Typography>Video data is not available.</Typography>
      </ErrorMessage>
    );
  }

  // Handle YouTube videos
  if (videoData.youtubeUrl) {
    const youtubeId = videoData.youtubeId || videoData.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
    
    if (!youtubeId) {
      return (
        <ErrorMessage>
          <Typography>Invalid YouTube URL</Typography>
        </ErrorMessage>
      );
    }

    return (
      <VideoContainer>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0`}
          title={videoData.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </VideoContainer>
    );
  }

  // Handle uploaded videos
  const videoUrl = videoData.filePath.startsWith('/uploads/videos/')
    ? `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${videoData.filePath}`
    : `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/${videoData.filePath}`;
  console.log('Video URL:', videoUrl);

  return (
    <VideoContainer>
      <video
        ref={videoRef}
        src={videoUrl}
        onTimeUpdate={onTimeUpdate}
        controls
        crossOrigin="anonymous"
        aria-label={videoData.title}
      />
    </VideoContainer>
  );
};

export default VideoPlayer;