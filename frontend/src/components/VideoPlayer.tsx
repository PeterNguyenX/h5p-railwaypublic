import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, 
  styled, 
  Typography, 
  Fab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Fade,
  Grow,
  Alert,
  Snackbar
} from '@mui/material';
import { QuestionMark, TouchApp, CheckCircle, Cancel, Replay } from '@mui/icons-material';
import api from '../config/api';
import Hls from 'hls.js';

interface VideoPlayerProps {
  videoId: string;
  onTimeUpdate?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  h5pContents?: any[]; // H5P content to display as overlays
  onContentAnswered?: (contentId: string) => void; // Callback when H5P content is answered correctly
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
  '@keyframes bounce': {
    '0%, 100%': {
      transform: 'translateY(0)'
    },
    '50%': {
      transform: 'translateY(-20px)'
    }
  }
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

const H5PInteractionOverlay = styled(Box)({
  position: 'absolute',
  zIndex: 10,
  pointerEvents: 'none',
  '& .h5p-interaction': {
    position: 'absolute',
    pointerEvents: 'auto',
    cursor: 'pointer'
  }
});

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoId, 
  onTimeUpdate, 
  h5pContents = [],
  onContentAnswered
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedH5PContent, setSelectedH5PContent] = useState<any>(null);
  const [h5pDialogOpen, setH5pDialogOpen] = useState(false);
  const [answeredContent, setAnsweredContent] = useState<Set<string>>(new Set());
  const [autoShowContent, setAutoShowContent] = useState<any>(null);
  
  // Animation and feedback states
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showIncorrectFeedback, setShowIncorrectFeedback] = useState(false);
  const [currentContentForRetry, setCurrentContentForRetry] = useState<any>(null);
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(0);

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
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration || 0);
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        if (onTimeUpdate) {
          const syntheticEvent = {
            target: video,
            currentTarget: video,
            type: 'timeupdate',
            bubbles: false,
            cancelable: false,
            defaultPrevented: false,
            eventPhase: 0,
            isTrusted: true,
            preventDefault: () => {},
            stopPropagation: () => {},
            isPropagationStopped: () => false,
            isDefaultPrevented: () => false,
            persist: () => {},
            timeStamp: Date.now(),
            nativeEvent: new Event('timeupdate')
          } as React.SyntheticEvent<HTMLVideoElement>;
          onTimeUpdate(syntheticEvent);
        }
      };
      
      const handlePlay = () => {
        setIsPlaying(true);
      };
      
      const handlePause = () => {
        setIsPlaying(false);
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      };
    }
  }, [onTimeUpdate]);

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

  const handleH5PInteractionClick = (content: any) => {
    setSelectedH5PContent(content);
    setH5pDialogOpen(true);
    // Pause video when interaction is opened
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const getActiveInteractions = () => {
    if (!h5pContents.length) return [];
    
    return h5pContents.filter(content => {
      const timestamp = content.timestamp || 0;
      const duration = content.duration || 10; // Default 10 second duration
      const isInTimeRange = currentTime >= timestamp && currentTime <= timestamp + duration;
      const isNotAnswered = !answeredContent.has(content.id);
      return isInTimeRange && isNotAnswered;
    });
  };

  // Check for content that should auto-show
  useEffect(() => {
    if (h5pContents.length > 0) {
      const activeContent = h5pContents.find(content => {
        const timestamp = content.timestamp || 0;
        const isAtTimestamp = Math.abs(currentTime - timestamp) < 0.5; // Within 0.5 seconds
        const isNotAnswered = !answeredContent.has(content.id);
        return isAtTimestamp && isNotAnswered;
      });

      if (activeContent) {
        // Check if this content should auto-show (not already showing the same content)
        const shouldShow = activeContent !== autoShowContent || !h5pDialogOpen;
        
        if (shouldShow) {
          console.log(`Auto-showing H5P content at ${currentTime}s:`, activeContent);
          setAutoShowContent(activeContent);
          setSelectedH5PContent(activeContent);
          setH5pDialogOpen(true);
          // Pause video when interaction appears
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      } else {
        // Clear auto-show content when no active content at current time
        if (autoShowContent && !h5pDialogOpen) {
          setAutoShowContent(null);
        }
      }
    }
  }, [currentTime, h5pContents, answeredContent, autoShowContent, h5pDialogOpen]);

  const handleCorrectAnswer = (contentId: string) => {
    // Show success animation
    setShowSuccessAnimation(true);
    setLastAnswerTime(currentTime);
    
    // Mark content as answered
    setAnsweredContent(prev => {
      const newSet = new Set(prev);
      newSet.add(contentId);
      return newSet;
    });
    
    // Call the callback to notify parent component
    if (onContentAnswered) {
      onContentAnswered(contentId);
    }
    
    // Close dialog after a brief delay to show animation
    setTimeout(() => {
      setH5pDialogOpen(false);
      setAutoShowContent(null);
      setShowSuccessAnimation(false);
      
      // Resume video playback
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }, 2000); // Show success animation for 2 seconds
  };

  const handleIncorrectAnswer = (content: any) => {
    setShowIncorrectFeedback(true);
    setCurrentContentForRetry(content);
    setLastAnswerTime(currentTime);
  };

  const handleTryAgain = () => {
    setShowIncorrectFeedback(false);
    setCurrentContentForRetry(null);
    // Keep dialog open for retry
  };

  const handleRewatch = async () => {
    console.log('Rewatch button clicked - closing dialog and rewinding video');
    
    // Store content reference before clearing states
    const contentToRewatch = currentContentForRetry;
    
    // Immediately close all feedback states and dialog
    setShowIncorrectFeedback(false);
    setCurrentContentForRetry(null);
    setH5pDialogOpen(false);
    setSelectedH5PContent(null);
    setAutoShowContent(null);
    
    // Remove the content from answered set so it can appear again
    if (contentToRewatch) {
      setAnsweredContent(prev => {
        const newSet = new Set(prev);
        newSet.delete(contentToRewatch.id);
        return newSet;
      });
      
      console.log(`Removed content ${contentToRewatch.id} from answered set for rewatch`);
    }
    
    // Rewind video 5 seconds before the question timestamp
    if (videoRef.current && contentToRewatch) {
      const rewindTime = Math.max(0, (contentToRewatch.timestamp || 0) - 5);
      
      try {
        // Pause first, then seek, then play
        videoRef.current.pause();
        setIsPlaying(false);
        
        // Set the current time
        videoRef.current.currentTime = rewindTime;
        
        // Wait for seek to complete before playing
        await new Promise((resolve) => {
          const handleSeeked = () => {
            videoRef.current?.removeEventListener('seeked', handleSeeked);
            resolve(void 0);
          };
          videoRef.current?.addEventListener('seeked', handleSeeked);
          
          // Add a timeout fallback in case seeked event doesn't fire
          setTimeout(() => {
            videoRef.current?.removeEventListener('seeked', handleSeeked);
            resolve(void 0);
          }, 1000);
        });
        
        // Small delay to ensure video is ready, then play
        setTimeout(async () => {
          try {
            await videoRef.current?.play();
            setIsPlaying(true);
            console.log(`Rewatching from ${rewindTime}s, question will auto-appear at ${contentToRewatch.timestamp}s`);
          } catch (playError) {
            console.error('Error playing video after rewatch:', playError);
            setIsPlaying(false);
          }
        }, 100);
        
      } catch (error) {
        console.error('Error during rewatch:', error);
        // Fallback - just set the time and let user manually play
        videoRef.current.currentTime = rewindTime;
        setIsPlaying(false);
      }
    }
  };

  const renderH5PContent = (content: any) => {
    const library = content.library;
    const params = content.params || {};

    const handleAnswerClick = (isCorrect: boolean) => {
      if (isCorrect) {
        handleCorrectAnswer(content.id);
      } else {
        handleIncorrectAnswer(content);
      }
    };

    switch (library) {
      case 'H5P.MultiChoice':
        return (
          <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              {params.question || 'Multiple Choice Question'}
            </Typography>
            {params.answers && params.answers.map((answer: any, index: number) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleAnswerClick(answer.correct)}
                  sx={{ 
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    '&:hover': {
                      bgcolor: answer.correct ? '#e8f5e8' : '#ffebee'
                    }
                  }}
                >
                  {answer.text}
                </Button>
              </Box>
            ))}
          </Box>
        );

      case 'H5P.TrueFalse':
        return (
          <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              {params.question || 'True/False Question'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button 
                variant="outlined"
                onClick={() => handleAnswerClick(params.correct === 'true')}
                sx={{ 
                  flex: 1,
                  '&:hover': {
                    bgcolor: params.correct === 'true' ? '#e8f5e8' : '#ffebee'
                  }
                }}
              >
                True
              </Button>
              <Button 
                variant="outlined"
                onClick={() => handleAnswerClick(params.correct === 'false')}
                sx={{ 
                  flex: 1,
                  '&:hover': {
                    bgcolor: params.correct === 'false' ? '#e8f5e8' : '#ffebee'
                  }
                }}
              >
                False
              </Button>
            </Box>
          </Box>
        );

      case 'H5P.Blanks':
        return (
          <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Fill in the Blanks
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {params.text || 'Complete the sentence by filling in the blanks.'}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => handleCorrectAnswer(content.id)}
              sx={{ mt: 1 }}
            >
              Complete
            </Button>
          </Box>
        );

      default:
        return (
          <Box sx={{ 
            p: 3, 
            bgcolor: '#f5f5f5', 
            borderRadius: 1,
            textAlign: 'center',
            minHeight: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {library}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Interactive content at {content.timestamp || 0}s
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Content preview not yet implemented for this library type
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => handleCorrectAnswer(content.id)}
                sx={{ mt: 2 }}
              >
                Continue
              </Button>
            </Box>
          </Box>
        );
    }
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
      
      {/* H5P Interaction Overlay - Always Active */}
      {h5pContents.length > 0 && (
        <H5PInteractionOverlay sx={{ width: '100%', height: '100%', top: 0, left: 0 }}>
          {getActiveInteractions().map((content, index) => (
            <Box
              key={index}
              className="h5p-interaction"
              sx={{
                position: 'absolute',
                left: `${(content.x || 10) + index * 15}%`, // Position based on content or default
                top: `${(content.y || 10) + index * 10}%`,
                zIndex: 20,
                pointerEvents: 'auto'
              }}
            >
              <Fab
                size="medium"
                color="primary"
                onClick={() => handleH5PInteractionClick(content)}
                sx={{ 
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
              >
                <TouchApp />
              </Fab>
            </Box>
          ))}
        </H5PInteractionOverlay>
      )}

      {/* H5P Content Dialog */}
      <Dialog 
        open={h5pDialogOpen} 
        onClose={() => {
          // Only allow manual close if not showing animations
          if (!showSuccessAnimation && !showIncorrectFeedback) {
            setH5pDialogOpen(false);
            setAutoShowContent(null);
            setSelectedH5PContent(null);
            // Resume video if it was paused
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play();
              setIsPlaying(true);
            }
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedH5PContent?.metadata?.title || 'Interactive Content'}
        </DialogTitle>
        <DialogContent>
          {/* Success Animation */}
          {showSuccessAnimation && (
            <Fade in={showSuccessAnimation}>
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  p: 4,
                  bgcolor: '#e8f5e8',
                  borderRadius: 2,
                  mb: 2
                }}
              >
                <Grow in={showSuccessAnimation} timeout={500}>
                  <CheckCircle 
                    sx={{ 
                      fontSize: 80, 
                      color: '#4caf50',
                      animation: 'bounce 1s ease-in-out infinite alternate'
                    }} 
                  />
                </Grow>
                <Typography variant="h5" sx={{ color: '#2e7d32', mt: 2, fontWeight: 'bold' }}>
                  🎉 Excellent! 🎉
                </Typography>
                <Typography variant="body1" sx={{ color: '#388e3c', mt: 1 }}>
                  Great job! You got it right!
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Incorrect Answer Feedback */}
          {showIncorrectFeedback && (
            <Fade in={showIncorrectFeedback}>
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  bgcolor: '#ffebee',
                  borderRadius: 2,
                  mb: 2
                }}
              >
                <Cancel 
                  sx={{ 
                    fontSize: 60, 
                    color: '#f44336',
                    mb: 2
                  }} 
                />
                <Typography variant="h6" sx={{ color: '#d32f2f', mb: 2 }}>
                  Not quite right
                </Typography>
                <Typography variant="body2" sx={{ color: '#c62828', mb: 3 }}>
                  Would you like to try again or rewatch the content?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    onClick={handleTryAgain}
                    sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={handleRewatch}
                    startIcon={<Replay />}
                    sx={{ color: '#1976d2', borderColor: '#1976d2' }}
                  >
                    Rewatch (5s before)
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Regular Content (when not showing animations) */}
          {!showSuccessAnimation && !showIncorrectFeedback && selectedH5PContent && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedH5PContent.library}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedH5PContent.metadata?.title || 'Interactive H5P content'}
              </Typography>
              
              {/* Render actual H5P content based on library type */}
              {renderH5PContent(selectedH5PContent)}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!showSuccessAnimation && !showIncorrectFeedback && (
            <Button onClick={() => {
              setH5pDialogOpen(false);
              setAutoShowContent(null);
              setSelectedH5PContent(null);
              // Resume video if it was paused
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
              }
            }}>
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </VideoContainer>
  );
};

export default VideoPlayer;