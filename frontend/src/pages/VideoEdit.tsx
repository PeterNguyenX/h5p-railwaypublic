import React, { useState } from 'react';
import {
  Box,
  Container,
  Stack,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Paper,
  Alert,
  Snackbar,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import SaveIcon from '@mui/icons-material/Save';
import { Video } from '../stores/videoStore';
import H5PEditor from '../components/H5PEditor';
import api from '../config/api';
import { useTranslation } from 'react-i18next';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const VideoEdit = observer(() => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [h5pContent, setH5pContent] = useState<any[]>([]);
  const [showH5PEditor, setShowH5PEditor] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { t } = useTranslation();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  React.useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await api.get<Video>(`/videos/${id}`);
        const data = response.data;
        setVideo(data);
        setTitle(data.title);
        setDescription(data.description);
        setH5pContent(data.h5pContent || []);
      } catch (err) {
        setSnackbar({
          open: true,
          message: err instanceof Error ? err.message : 'Failed to fetch video',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.put(`/videos/${id}`, {
        title,
        description,
      });
      setSnackbar({
        open: true,
        message: t('video.updateSuccess'),
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : t('video.updateError'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddH5PContent = async (contentData: any) => {
    try {
      setLoading(true);
      const response = await api.post<{ content: any }>(`/h5p/video/${video?.id}`, { contentData });
      setH5pContent([...h5pContent, response.data.content]);
      setShowH5PEditor(false);
      setSnackbar({
        open: true,
        message: t('h5p.addSuccess'),
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : t('h5p.addError'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('video.edit')}
        </Typography>

        {loading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('common.loading')}
          </Alert>
        )}

        <Paper sx={{ mt: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={t('video.basicInfo')} />
            <Tab label={t('h5p.content')} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              <TextField
                label={t('video.title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
              <TextField
                label={t('video.description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                fullWidth
              />
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={loading}
                  startIcon={<SaveIcon />}
                >
                  {t('common.save')}
                </Button>
              </Box>
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Stack spacing={3}>
              <Typography variant="h6">{t('h5p.timeline')}</Typography>
              {h5pContent.map((content, index) => (
                <Box key={index}>
                  <Typography>{content.title}</Typography>
                </Box>
              ))}
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowH5PEditor(true)}
                startIcon={<ContentCutIcon />}
              >
                {t('h5p.add')}
              </Button>
            </Stack>
          </TabPanel>
        </Paper>

        {showH5PEditor && (
          <H5PEditor
            onSave={handleAddH5PContent}
            onCancel={() => setShowH5PEditor(false)}
          />
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
});

export default VideoEdit; 