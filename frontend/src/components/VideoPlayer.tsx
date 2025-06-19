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
        console.log('Video data received:', response.data);
        console.log('Video filePath:', (response.data as any).filePath);
        console.log('Video hlsPath:', (response.data as any).hlsPath);
        console.log('Video youtubeUrl:', (response.data as any).youtubeUrl);
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
      // Construct HLS URL consistently with API base path
      let hlsUrl;
      if (videoData.hlsPath.startsWith('uploads/')) {
        hlsUrl = `/api/${videoData.hlsPath}`;
      } else if (videoData.hlsPath.startsWith('/uploads/')) {
        hlsUrl = `/api${videoData.hlsPath}`;
      } else {
        hlsUrl = `/api/${videoData.hlsPath}`;
      }
      
      console.log('Setting up HLS for:', videoData.title);
      console.log('HLS URL:', hlsUrl);
      console.log('Hls.isSupported():', Hls.isSupported());
      console.log('Browser canPlayType HLS:', videoRef.current.canPlayType('application/vnd.apple.mpegurl'));
      
      if (Hls.isSupported()) {
        console.log('Using HLS.js for playback');
        const hls = new Hls({
          debug: true,
          enableWorker: false
        });
        
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest parsed successfully');
          setDuration(videoRef.current?.duration || 0);
        });
        
        hls.on(Hls.Events.MANIFEST_LOADING, () => {
          console.log('🔄 HLS manifest loading...');
        });
        
        hls.on(Hls.Events.MANIFEST_LOADED, () => {
          console.log('📥 HLS manifest loaded');
        });
        
        hls.on(Hls.Events.LEVEL_LOADED, () => {
          console.log('📊 HLS level loaded');
        });
        
        hls.on(Hls.Events.FRAG_LOADING, () => {
          console.log('🔄 HLS fragment loading...');
        });
        
        hls.on(Hls.Events.FRAG_LOADED, () => {
          console.log('📥 HLS fragment loaded');
        });
        
        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          console.error('❌ HLS error:', {
            type: data.type,
            details: data.details,
            fatal: data.fatal,
            event,
            data
          });
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Fatal network error encountered, try to recover');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Fatal media error encountered, try to recover');
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal error, cannot recover');
                setError(`HLS playback error: ${data.details}`);
                break;
            }
          }
        });
        
        // Cleanup function
        return () => {
          hls.destroy();
        };
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('Using native HLS support (Safari)');
        videoRef.current.src = hlsUrl;
      } else {
        console.error('HLS not supported by browser');
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

  // Handle uploaded videos - prioritize HLS when available
  let videoElement;
  
  if (videoData.hlsPath) {
    // HLS video - src will be set by useEffect above
    console.log('Using HLS playback for:', videoData.title);
    videoElement = (
      <video
        ref={videoRef}
        onTimeUpdate={onTimeUpdate}
        onLoadStart={() => console.log('HLS Video loading started')}
        onLoadedData={() => console.log('HLS Video data loaded')}
        onCanPlay={() => console.log('HLS Video can play')}
        onError={(e) => {
          console.error('HLS Video error:', e);
          console.error('HLS Video error target:', e.target);
          const video = e.target as HTMLVideoElement;
          if (video.error) {
            console.error('HLS Video error code:', video.error.code);
            console.error('HLS Video error message:', video.error.message);
          }
        }}
        controls
        crossOrigin="anonymous"
        aria-label={videoData.title}
      />
    );
  } else {
    // Direct video file - fallback when HLS not available
    let videoUrl;
    
    if (videoData.filePath.startsWith('uploads/')) {
      videoUrl = `/api/${videoData.filePath}`;
    } else if (videoData.filePath.startsWith('/uploads/')) {
      videoUrl = `/api${videoData.filePath}`;
    } else {
      videoUrl = `/api/uploads/${videoData.filePath}`;
    }
    
    console.log('Using direct video playback for:', videoData.title);
    console.log('Direct Video URL:', videoUrl);
    console.log('videoData.filePath:', videoData.filePath);
    console.log('videoData.status:', videoData.status);
    
    videoElement = (
      <video
        ref={videoRef}
        src={videoUrl}
        onTimeUpdate={onTimeUpdate}
        onLoadStart={() => console.log('Direct Video loading started')}
        onLoadedData={() => console.log('Direct Video data loaded')}
        onCanPlay={() => console.log('Direct Video can play')}
        onError={(e) => {
          console.error('Direct Video error:', e);
          const video = e.target as HTMLVideoElement;
          if (video.error) {
            console.error('Direct Video error code:', video.error.code);
            console.error('Direct Video error message:', video.error.message);
          }
        }}
        controls
        crossOrigin="anonymous"
        aria-label={videoData.title}
      />
    );
  }

  return (
    <VideoContainer>
      {videoElement}
    </VideoContainer>
  );
};

export default VideoPlayer;