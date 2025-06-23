import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import YouTubeIcon from '@mui/icons-material/YouTube';
import api from '../config/api';
import './VideoUpload.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`upload-tabpanel-${index}`}
      aria-labelledby={`upload-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const VideoUpload: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setUploading(true);
    setError(null);

    try {
      if (tabValue === 0) {
        // File upload
        if (!file) {
          setError(t('videoUpload.noFileError'));
          return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('video', file);

        await api.post('/videos/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // YouTube upload
        if (!youtubeUrl) {
          setError(t('videoUpload.noYoutubeUrlError'));
          return;
        }

        await api.post('/videos/youtube', {
          title,
          description,
          youtubeUrl,
        });
      }

      setSuccess(t('upload.success'));
      setTimeout(() => setSuccess(null), 3000);

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.response && err.response.status === 409) {
        setError(t('videoUpload.duplicateError'));
      } else {
        setError(err instanceof Error ? err.message : t('videoUpload.uploadError'));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('videoUpload.title')}
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('videoUpload.titleLabel')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              margin="normal"
            />

            <TextField
              fullWidth
              label={t('videoUpload.descriptionLabel')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={4}
              margin="normal"
            />

            <Box sx={{ borderBlockEnd: 1, borderColor: 'divider', mt: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab icon={<CloudUploadIcon />} label={t('videoUpload.fileUpload')} />
                <Tab icon={<YouTubeIcon />} label={t('videoUpload.youtubeUpload')} />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <input
                type="file"
                accept="video/*"
                className="hidden-file-input"
                onChange={handleFileChange}
                ref={fileInputRef}
                title={t('videoUpload.fileInputTitle')}
              />

              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                fullWidth
              >
                {file ? file.name : t('videoUpload.selectFile')}
              </Button>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TextField
                fullWidth
                label={t('videoUpload.youtubeUrlLabel')}
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </TabPanel>

            <Box sx={{ mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={uploading || (tabValue === 0 ? !file : !youtubeUrl)}
                startIcon={uploading && <CircularProgress size={20} />}
                fullWidth
              >
                {uploading ? t('videoUpload.uploading') : t('videoUpload.submit')}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default VideoUpload;