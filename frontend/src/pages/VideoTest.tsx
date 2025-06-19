import React, { useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import VideoPlayer from '../components/VideoPlayer';

const VideoTest: React.FC = () => {
  // Auto-authenticate for testing
  useEffect(() => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNGNiYjY0MC03OTI3LTQ3YmEtYTE1Ni01YjgwMDk5YTFlNDciLCJpYXQiOjE3NDg4NTEwNDksImV4cCI6MTc0ODkzNzQ0OX0.dSGmpPiu870miNhOxP3G4UBwfumQrDMnBn0xE0jMWNc';
    const user = {
      "id": "d4cbb640-7927-47ba-a156-5b80099a1e47",
      "username": "admin",
      "email": "admin@example.com"
    };
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    console.log('Auto-authenticated for testing');
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Video Player Test
        </Typography>
        <Button onClick={clearAuth} variant="outlined" color="secondary">
          Clear Auth
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Video 1 (ex1.mov with HLS only)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          This video has HLS segments but no compressed .mp4 file
        </Typography>
        <VideoPlayer videoId="dff2e8ed-0fa4-492e-be80-6092f4461175" />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Video 2 (ex2.mov with HLS + compressed .mp4)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          This video has both HLS segments and a compressed .mp4 file
        </Typography>
        <VideoPlayer videoId="171f21e8-f273-4fe0-8a4f-d35d382b1b2d" />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Debug Information
        </Typography>
        <Typography variant="body2">
          Check the browser console for detailed VideoPlayer debugging logs.
        </Typography>
        <Typography variant="body2">
          Video 1 should use HLS playback. Video 2 should also use HLS playback.
        </Typography>
      </Paper>
    </Box>
  );
};

export default VideoTest;
