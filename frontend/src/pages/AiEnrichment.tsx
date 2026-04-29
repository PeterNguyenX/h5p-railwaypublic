import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import axios from 'axios';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import RefreshIcon from '@mui/icons-material/Refresh';
import aiEnrichmentStore from '../stores/aiEnrichmentStore';
import TranscriptPanel from '../components/ai/TranscriptPanel';
import SuggestionCard from '../components/ai/SuggestionCard';
import SuggestionEditor from '../components/ai/SuggestionEditor';
import StagingBar from '../components/ai/StagingBar';
import type { DiffSuggestion } from '../types/aiEnrichment';

/** Video metadata from backend. */
interface VideoData {
  id: string;
  title: string;
  filePath: string | null;
  hlsPath: string | null;
  duration: number | null;
}

const AiEnrichment: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Initialize store with video ID
  useEffect(() => {
    if (id) {
      aiEnrichmentStore.setVideoId(id);
    }
    return () => {
      aiEnrichmentStore.reset();
    };
  }, [id]);

  // Load video metadata and check for previously saved AI results
  useEffect(() => {
    const loadVideo = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/videos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVideo(response.data);

        // Try to load previously saved AI results
        try {
          const aiResponse = await axios.get(`/api/ai/results/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (aiResponse.data.suggestions && aiResponse.data.suggestions.length > 0) {
            aiEnrichmentStore.suggestions = aiResponse.data.suggestions;
            setSnackbar({ 
              open: true, 
              message: `Loaded ${aiResponse.data.suggestions.length} previously generated suggestions`, 
              severity: 'info' 
            });
          }
        } catch (err) {
          // No saved results yet, that's fine
        }
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to load video', severity: 'error' });
      } finally {
        setLoadingVideo(false);
      }
    };
    loadVideo();
  }, [id]);

  // Sync video time with store
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      aiEnrichmentStore.setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // Seek video to a specific time
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Handle transcript file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await aiEnrichmentStore.parseTranscript(file);
    if (aiEnrichmentStore.error) {
      setSnackbar({ open: true, message: aiEnrichmentStore.error, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: `Parsed ${aiEnrichmentStore.segments.length} segments from ${file.name}`, severity: 'success' });
    }
  };

  // Run AI analysis
  const handleAnalyze = async () => {
    await aiEnrichmentStore.analyzeStreaming();
    if (aiEnrichmentStore.error) {
      setSnackbar({ open: true, message: aiEnrichmentStore.error, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: `Generated ${aiEnrichmentStore.suggestions.length} suggestions`, severity: 'success' });
    }
  };

  // Apply accepted suggestions
  const handleApply = async () => {
    await aiEnrichmentStore.injectAccepted();
    if (aiEnrichmentStore.error) {
      setSnackbar({ open: true, message: aiEnrichmentStore.error, severity: 'error' });
    } else if (aiEnrichmentStore.lastInjectionResult) {
      const result = aiEnrichmentStore.lastInjectionResult;
      setSnackbar({
        open: true,
        message: `Successfully injected ${result.injected.length} H5P elements${result.errors.length > 0 ? ` (${result.errors.length} failed)` : ''}`,
        severity: result.errors.length > 0 ? 'info' : 'success'
      });
    }
  };

  // Build video source URL
  const getVideoSrc = (): string | null => {
    if (!video) return null;
    if (video.filePath) {
      return `/api/uploads/${video.filePath}`;
    }
    if (video.hlsPath) {
      return `/api/uploads/${video.hlsPath}`;
    }
    return null;
  };

  // Find the suggestion being edited
  const editingSuggestion = editingSuggestionId
    ? aiEnrichmentStore.suggestions.find(s => s.id === editingSuggestionId)
    : null;

  // Get diff suggestions for display
  const diffSuggestions: DiffSuggestion[] = aiEnrichmentStore.diffSuggestions;

  if (loadingVideo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 2 }}>
        <Tooltip title="Back to video editor" arrow>
          <IconButton onClick={() => navigate(`/videos/${id}/edit`)}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            AI H5P Enrichment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {video?.title || 'Untitled Video'}
          </Typography>
        </Box>
      </Box>

      {/* Error banner */}
      {aiEnrichmentStore.error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => { aiEnrichmentStore.error = null; }}>
          {aiEnrichmentStore.error}
        </Alert>
      )}

      {/* Three-panel layout */}
      <Grid container spacing={2}>
        {/* Left panel: Video player */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ overflow: 'hidden' }}>
            <Box sx={{ backgroundColor: '#000', position: 'relative' }}>
              {getVideoSrc() ? (
                <Box
                  component="video"
                  ref={videoRef}
                  src={getVideoSrc() || undefined}
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  sx={{ width: '100%', display: 'block', maxHeight: 300 }}
                />
              ) : (
                <Box sx={{ p: 4, textAlign: 'center', color: '#fff' }}>
                  <Typography variant="body2">Video source not available</Typography>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Transcript upload */}
            <Box sx={{ p: 2 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".vtt,.srt"
                title="Upload transcript file"
                aria-label="Upload transcript file"
                onChange={handleFileUpload}
                hidden
              />
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ mb: 1 }}
              >
                {aiEnrichmentStore.transcriptFilename
                  ? `Uploaded: ${aiEnrichmentStore.transcriptFilename}`
                  : 'Upload Transcript (.vtt / .srt)'}
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={aiEnrichmentStore.isAnalyzing ? <CircularProgress size={18} /> : <AutoFixHighIcon />}
                onClick={handleAnalyze}
                disabled={aiEnrichmentStore.segments.length === 0 || aiEnrichmentStore.isAnalyzing}
              >
                {aiEnrichmentStore.isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </Button>
              {aiEnrichmentStore.suggestions.length > 0 && (
                <Button
                  fullWidth
                  variant="text"
                  startIcon={<RefreshIcon />}
                  onClick={handleAnalyze}
                  disabled={aiEnrichmentStore.isAnalyzing}
                  sx={{ mt: 0.5 }}
                  size="small"
                >
                  Re-run Analysis (shows diff)
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Centre panel: Transcript */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
            <TranscriptPanel
              segments={aiEnrichmentStore.segments}
              suggestions={aiEnrichmentStore.suggestions}
              currentTime={aiEnrichmentStore.currentTime}
              onTimestampClick={seekTo}
            />
          </Paper>
        </Grid>

        {/* Right panel: Suggestions */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              AI Suggestions ({aiEnrichmentStore.suggestions.length})
            </Typography>

            {/* Inline editor */}
            {editingSuggestion && (
              <SuggestionEditor
                suggestion={editingSuggestion}
                onSave={(suggestionId, config) => {
                  aiEnrichmentStore.updateSuggestionConfig(suggestionId, config);
                  setEditingSuggestionId(null);
                  setSnackbar({ open: true, message: 'Config updated', severity: 'info' });
                }}
                onCancel={() => setEditingSuggestionId(null)}
              />
            )}

            {/* Suggestion cards */}
            {diffSuggestions.length === 0 && !aiEnrichmentStore.isAnalyzing && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Upload a transcript and run AI analysis to generate suggestions.
              </Typography>
            )}

            {diffSuggestions
              .sort((a, b) => a.timestamp - b.timestamp)
              .map(suggestion => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  diffStatus={suggestion.diffStatus}
                  onAccept={(suggestionId) => aiEnrichmentStore.setSuggestionStatus(suggestionId, 'accepted')}
                  onReject={(suggestionId) => aiEnrichmentStore.setSuggestionStatus(suggestionId, 'rejected')}
                  onEdit={(suggestionId) => setEditingSuggestionId(suggestionId)}
                  onTimestampClick={seekTo}
                />
              ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Staging bar */}
      <StagingBar
        acceptedCount={aiEnrichmentStore.acceptedSuggestions.length}
        pendingCount={aiEnrichmentStore.pendingSuggestions.length}
        totalCount={aiEnrichmentStore.suggestions.length}
        isInjecting={aiEnrichmentStore.isInjecting}
        isAnalyzing={aiEnrichmentStore.isAnalyzing}
        progressMessage={aiEnrichmentStore.progressMessage}
        onApply={handleApply}
        onAcceptAll={() => aiEnrichmentStore.acceptAll()}
        onRejectAll={() => aiEnrichmentStore.rejectAll()}
        onRemoveRejected={() => aiEnrichmentStore.removeRejected()}
      />

      {/* Snackbar notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
});

export default AiEnrichment;
