import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  Fab,
  Alert,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import VideoPlayer from '../components/VideoPlayer';
import AdvancedH5PEditor from '../components/AdvancedH5PEditor';
import api from '../config/api';

const VideoEdit: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const [h5pEditorOpen, setH5pEditorOpen] = useState(false);
  const [currentContentId, setCurrentContentId] = useState<string | undefined>();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleOpenH5PEditor = (contentId?: string) => {
    setCurrentContentId(contentId);
    setH5pEditorOpen(true);
  };

  const handleSaveH5PContent = async (contentData: any) => {
    try {
      // Get current video timestamp if needed
      const timestamp = 0; // You can get this from the video player

      const response = await api.post(`/h5p/video/${id}`, {
        contentData,
        timestamp
      });

      console.log('H5P content saved:', response.data);
      setSaveSuccess(true);
    } catch (error: any) {
      console.error('Error saving H5P content:', error);
      setSaveError(error.response?.data?.error || 'Failed to save H5P content');
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Video Editor
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Preview Player
          </Typography>
          <VideoPlayer videoId={id || ''} />
        </Paper>

        <Paper sx={{ p: 3, position: 'relative' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              H5P Interactive Content
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenH5PEditor()}
              size="large"
            >
              Create H5P Content
            </Button>
          </Stack>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use the H5P editor to create interactive content like quizzes, presentations, 
            interactive videos, and more. Click "Create H5P Content" to open the full H5P editor 
            with access to all content types.
          </Typography>

          <Box
            sx={{
              minHeight: 200,
              border: '2px dashed #ccc',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f9f9f9'
            }}
          >
            <Stack alignItems="center" spacing={2}>
              <Typography variant="h6" color="text.secondary">
                No H5P content created yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenH5PEditor()}
              >
                Create Your First H5P Content
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* Advanced H5P Editor Dialog */}
        <AdvancedH5PEditor
          open={h5pEditorOpen}
          onClose={() => setH5pEditorOpen(false)}
          onSave={handleSaveH5PContent}
          contentId={currentContentId}
          videoId={id || ''}
        />

        {/* Success/Error Messages */}
        <Snackbar
          open={saveSuccess}
          autoHideDuration={6000}
          onClose={() => setSaveSuccess(false)}
        >
          <Alert onClose={() => setSaveSuccess(false)} severity="success">
            H5P content saved successfully!
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!saveError}
          autoHideDuration={6000}
          onClose={() => setSaveError(null)}
        >
          <Alert onClose={() => setSaveError(null)} severity="error">
            {saveError}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
});

export default VideoEdit;