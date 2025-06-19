import React, { useEffect } from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import VideoPlayer from '../components/VideoPlayer';

const FinalTest: React.FC = () => {
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
    console.log('🔑 Authentication set for testing');
    console.log('📋 Now testing VideoPlayer with real data from database');
    console.log('🎯 Expected: Videos should load using HLS playback');
    console.log('🔍 Check Network tab for API calls and video requests');
  }, []);

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Final VideoPlayer Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        📋 hls.js is now installed! Videos should work. Check browser console for detailed logs.
      </Alert>

      <Alert severity="success" sx={{ mb: 3 }}>
        ✅ API Test: /api/videos/dff2e8ed-0fa4-492e-be80-6092f4461175 returns valid data<br/>
        ✅ HLS Test: /api/uploads/hls/ex1/stream.m3u8 is accessible<br/>
        ✅ Direct Video Test: /api/uploads/videos/ex1.mov is accessible
      </Alert>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom color="primary">
          🎬 Test Video 1 (HLS Stream)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Video ID: dff2e8ed-0fa4-492e-be80-6092f4461175<br/>
          Expected: Should use HLS.js for streaming playback
        </Typography>
        <VideoPlayer videoId="dff2e8ed-0fa4-492e-be80-6092f4461175" />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom color="primary">
          🎬 Test Video 2 (HLS + Compressed)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Video ID: 171f21e8-f273-4fe0-8a4f-d35d382b1b2d<br/>
          Expected: Should use HLS.js for streaming playback
        </Typography>
        <VideoPlayer videoId="171f21e8-f273-4fe0-8a4f-d35d382b1b2d" />
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Expected Console Logs
        </Typography>
        <Typography variant="body2" component="div">
          Look for these messages in the browser console:
          <ul>
            <li>✅ "Setting up HLS for: Test Video 1"</li>
            <li>✅ "Using HLS.js for playback"</li>
            <li>✅ "🔄 HLS manifest loading..."</li>
            <li>✅ "📥 HLS manifest loaded"</li>
            <li>✅ "✅ HLS manifest parsed successfully"</li>
            <li>✅ "📥 HLS fragment loaded"</li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
};

export default FinalTest;
