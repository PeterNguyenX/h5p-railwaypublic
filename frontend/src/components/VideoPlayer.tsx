import React, { useRef, useEffect } from 'react';
import { Box, IconButton, Slider, styled } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

interface VideoPlayerProps {
  videoUrl: string;
  onTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
}

const VideoContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  backgroundColor: 'black',
  '& video': {
    width: '100%',
    maxHeight: '70vh',
  },
});

const ControlsContainer = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

const TimeDisplay = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  color: 'white',
  fontSize: '0.875rem',
  marginTop: '8px',
});

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', () => {
        setDuration(videoRef.current?.duration || 0);
      });
    }
  }, []);

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

  const handleTimeChange = (event: Event, value: number | number[]) => {
    if (videoRef.current) {
      const newTime = Array.isArray(value) ? value[0] : value;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <VideoContainer>
      <video
        ref={videoRef}
        src={videoUrl}
        onTimeUpdate={onTimeUpdate}
      />
      <ControlsContainer>
        <IconButton
          onClick={togglePlay}
          sx={{ color: 'white' }}
          size="large"
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Slider
            value={currentTime}
            min={0}
            max={duration}
            onChange={handleTimeChange}
            sx={{
              color: 'white',
              '& .MuiSlider-thumb': {
                backgroundColor: 'white',
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)',
                },
                '&.Mui-active': {
                  boxShadow: '0 0 0 14px rgba(255, 255, 255, 0.16)',
                },
              },
              '& .MuiSlider-track': {
                backgroundColor: 'white',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          />
          <TimeDisplay>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </TimeDisplay>
        </Box>
        <IconButton
          onClick={() => videoRef.current?.requestFullscreen()}
          sx={{ color: 'white' }}
          size="large"
        >
          <FullscreenIcon />
        </IconButton>
      </ControlsContainer>
    </VideoContainer>
  );
};

export default VideoPlayer; 