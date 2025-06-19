import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import Hls from 'hls.js';

const HLSTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

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
    addLog('Auto-authenticated for testing');
  }, []);

  const testHLS = () => {
    if (!videoRef.current) {
      addLog('❌ Video element not available');
      return;
    }

    const hlsUrl = '/api/uploads/hls/ex1/stream.m3u8';
    addLog(`🎬 Testing HLS URL: ${hlsUrl}`);
    addLog(`🔍 Hls.isSupported(): ${Hls.isSupported()}`);
    addLog(`🔍 Browser canPlayType HLS: ${videoRef.current.canPlayType('application/vnd.apple.mpegurl')}`);

    if (Hls.isSupported()) {
      addLog('✅ Using HLS.js for playback');
      
      const hls = new Hls({
        debug: false, // Set to false to reduce console noise
        enableWorker: false
      });
      
      setHlsInstance(hls);
      
      hls.on(Hls.Events.MANIFEST_LOADING, () => addLog('🔄 HLS manifest loading...'));
      hls.on(Hls.Events.MANIFEST_LOADED, () => addLog('📥 HLS manifest loaded'));
      hls.on(Hls.Events.MANIFEST_PARSED, () => addLog('✅ HLS manifest parsed successfully'));
      hls.on(Hls.Events.LEVEL_LOADED, () => addLog('📊 HLS level loaded'));
      hls.on(Hls.Events.FRAG_LOADING, () => addLog('🔄 HLS fragment loading...'));
      hls.on(Hls.Events.FRAG_LOADED, () => addLog('📥 HLS fragment loaded'));
      
      hls.on(Hls.Events.ERROR, (event: any, data: any) => {
        addLog(`❌ HLS error: ${data.type} - ${data.details} (fatal: ${data.fatal})`);
        if (data.response) {
          addLog(`📄 Response: ${data.response.code} ${data.response.text}`);
        }
      });
      
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
      
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      addLog('🍎 Using native HLS support (Safari)');
      videoRef.current.src = hlsUrl;
    } else {
      addLog('❌ HLS not supported by browser');
    }
  };

  const testDirectVideo = () => {
    if (!videoRef.current) {
      addLog('❌ Video element not available');
      return;
    }

    const directUrl = '/api/uploads/videos/ex1.mov';
    addLog(`🎬 Testing direct video URL: ${directUrl}`);
    videoRef.current.src = directUrl;
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const destroyHLS = () => {
    if (hlsInstance) {
      hlsInstance.destroy();
      setHlsInstance(null);
      addLog('🗑️ HLS instance destroyed');
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        HLS.js Direct Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <video
          ref={videoRef}
          controls
          style={{ width: '100%', maxHeight: '400px' }}
          onLoadStart={() => addLog('📹 Video loadstart event')}
          onLoadedData={() => addLog('📹 Video loadeddata event')}
          onCanPlay={() => addLog('📹 Video canplay event')}
          onPlay={() => addLog('📹 Video play event')}
          onError={(e) => {
            const video = e.target as HTMLVideoElement;
            if (video.error) {
              addLog(`❌ Video error: ${video.error.code} - ${video.error.message}`);
            }
          }}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button onClick={testHLS} variant="contained" color="primary">
            Test HLS
          </Button>
          <Button onClick={testDirectVideo} variant="contained" color="secondary">
            Test Direct Video
          </Button>
          <Button onClick={destroyHLS} variant="outlined">
            Destroy HLS
          </Button>
          <Button onClick={clearLogs} variant="outlined">
            Clear Logs
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Debug Logs
        </Typography>
        <Box sx={{ 
          maxHeight: '300px', 
          overflow: 'auto', 
          backgroundColor: '#f5f5f5', 
          p: 2, 
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default HLSTest;
