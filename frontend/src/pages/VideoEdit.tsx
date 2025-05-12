import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import VideoPlayer from '../components/VideoPlayer';
import H5PEditor from '../components/H5PEditor';

const VideoEdit: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Video Editor
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6">Preview Player</Typography>
          <VideoPlayer videoId={id || ''} />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">H5P Interaction Panel</Typography>
          <H5PEditor
            videoId={id || ''}
            onSave={(contentData) => {
              console.log('H5P content saved:', contentData);
            }}
            onCancel={() => {
              console.log('H5P editing canceled');
            }}
          />
        </Paper>
      </Box>
    </Container>
  );
});

export default VideoEdit;