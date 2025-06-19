import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import api from '../config/api';

const VideoDebug: React.FC = () => {
  const [authStatus, setAuthStatus] = useState('checking');
  const [videoData1, setVideoData1] = useState<any>(null);
  const [videoData2, setVideoData2] = useState<any>(null);
  const [urlTests, setUrlTests] = useState<any>({});

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
    setAuthStatus('authenticated');
    console.log('Auto-authenticated for testing');
  }, []);

  // Test video data fetching
  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchVideoData();
    }
  }, [authStatus]);

  const fetchVideoData = async () => {
    try {
      console.log('Fetching video data...');
      
      const [response1, response2] = await Promise.all([
        api.get('/videos/dff2e8ed-0fa4-492e-be80-6092f4461175'),
        api.get('/videos/171f21e8-f273-4fe0-8a4f-d35d382b1b2d')
      ]);
      
      setVideoData1(response1.data);
      setVideoData2(response2.data);
      
      console.log('Video 1 data:', response1.data);
      console.log('Video 2 data:', response2.data);
      
      // Test URLs
      await testUrls(response1.data, response2.data);
    } catch (error) {
      console.error('Error fetching video data:', error);
    }
  };

  const testUrls = async (video1: any, video2: any) => {
    const tests: any = {};
    
    // Test Video 1 URLs
    const hls1 = `/api/${video1.hlsPath}`;
    const direct1 = `/api/${video1.filePath}`;
    
    // Test Video 2 URLs  
    const hls2 = `/api/${video2.hlsPath}`;
    const direct2 = `/api/${video2.filePath}`;
    
    try {
      tests.hls1 = await fetch(hls1).then(r => ({ status: r.status, ok: r.ok }));
      tests.direct1 = await fetch(direct1).then(r => ({ status: r.status, ok: r.ok }));
      tests.hls2 = await fetch(hls2).then(r => ({ status: r.status, ok: r.ok }));
      tests.direct2 = await fetch(direct2).then(r => ({ status: r.status, ok: r.ok }));
      
      console.log('URL Tests:', tests);
      setUrlTests(tests);
    } catch (error) {
      console.error('Error testing URLs:', error);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthStatus('cleared');
    window.location.reload();
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Video Debug Information
        </Typography>
        <Button onClick={clearAuth} variant="outlined" color="secondary">
          Clear Auth
        </Button>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Auth Status: {authStatus} | Check console for detailed logs
      </Alert>

      {videoData1 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Video 1 Debug (ex1.mov)
          </Typography>
          <Typography variant="body2"><strong>ID:</strong> {videoData1.id}</Typography>
          <Typography variant="body2"><strong>Title:</strong> {videoData1.title}</Typography>
          <Typography variant="body2"><strong>Status:</strong> {videoData1.status}</Typography>
          <Typography variant="body2"><strong>filePath:</strong> {videoData1.filePath}</Typography>
          <Typography variant="body2"><strong>hlsPath:</strong> {videoData1.hlsPath}</Typography>
          <Typography variant="body2"><strong>HLS URL:</strong> /api/{videoData1.hlsPath}</Typography>
          <Typography variant="body2"><strong>Direct URL:</strong> /api/{videoData1.filePath}</Typography>
          {urlTests.hls1 && (
            <Typography variant="body2" color={urlTests.hls1.ok ? 'green' : 'red'}>
              <strong>HLS Test:</strong> {urlTests.hls1.status} {urlTests.hls1.ok ? '✓' : '✗'}
            </Typography>
          )}
          {urlTests.direct1 && (
            <Typography variant="body2" color={urlTests.direct1.ok ? 'green' : 'red'}>
              <strong>Direct Test:</strong> {urlTests.direct1.status} {urlTests.direct1.ok ? '✓' : '✗'}
            </Typography>
          )}
        </Paper>
      )}

      {videoData2 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Video 2 Debug (ex2.mov)
          </Typography>
          <Typography variant="body2"><strong>ID:</strong> {videoData2.id}</Typography>
          <Typography variant="body2"><strong>Title:</strong> {videoData2.title}</Typography>
          <Typography variant="body2"><strong>Status:</strong> {videoData2.status}</Typography>
          <Typography variant="body2"><strong>filePath:</strong> {videoData2.filePath}</Typography>
          <Typography variant="body2"><strong>hlsPath:</strong> {videoData2.hlsPath}</Typography>
          <Typography variant="body2"><strong>HLS URL:</strong> /api/{videoData2.hlsPath}</Typography>
          <Typography variant="body2"><strong>Direct URL:</strong> /api/{videoData2.filePath}</Typography>
          {urlTests.hls2 && (
            <Typography variant="body2" color={urlTests.hls2.ok ? 'green' : 'red'}>
              <strong>HLS Test:</strong> {urlTests.hls2.status} {urlTests.hls2.ok ? '✓' : '✗'}
            </Typography>
          )}
          {urlTests.direct2 && (
            <Typography variant="body2" color={urlTests.direct2.ok ? 'green' : 'red'}>
              <strong>Direct Test:</strong> {urlTests.direct2.status} {urlTests.direct2.ok ? '✓' : '✗'}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default VideoDebug;
