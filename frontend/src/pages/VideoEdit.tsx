import React, { useState, useEffect } from 'react';
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
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import InteractiveIcon from '@mui/icons-material/TouchApp';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QuizIcon from '@mui/icons-material/Quiz';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import VideoPlayer from '../components/VideoPlayer';
import AdvancedH5PEditor from '../components/AdvancedH5PEditor';
import WordPressIntegration from '../components/WordPressIntegration';
import api from '../config/api';

const VideoEdit: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const [h5pEditorOpen, setH5pEditorOpen] = useState(false);
  const [currentContentId, setCurrentContentId] = useState<string | undefined>();
  const [preselectedLibrary, setPreselectedLibrary] = useState<string | undefined>();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [h5pContents, setH5pContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState(true); // Always on
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const [videoData, setVideoData] = useState<any>(null);
  const [answeredContentIds, setAnsweredContentIds] = useState<Set<string>>(new Set());
  const [ltiDialogOpen, setLtiDialogOpen] = useState(false);
  const [ltiLink, setLtiLink] = useState<string | null>(null);
  const [ltiError, setLtiError] = useState<string | null>(null);

  // H5P Content Creator Templates - Available Content Types (Supported)
  const h5pContentTypes = [
    {
      id: 'H5P.MultiChoice',
      title: 'Multiple Choice',
      description: 'Create flexible multiple choice questions with feedback',
      icon: <QuizIcon />,
      category: 'Quiz'
    },
    {
      id: 'H5P.TrueFalse',
      title: 'True/False Question',
      description: 'Create simple true or false questions',
      icon: <QuizIcon />,
      category: 'Quiz'
    },
    {
      id: 'H5P.Blanks',
      title: 'Fill in the Blanks',
      description: 'Create tasks where users fill in missing words',
      icon: <TextFieldsIcon />,
      category: 'Interactive'
    }
  ];

  // Fetch video data
  const fetchVideoData = async () => {
    try {
      const response = await api.get(`/videos/${id}`);
      setVideoData(response.data);
    } catch (error: any) {
      console.error('Error fetching video data:', error);
    }
  };

  // Fetch H5P content for this video
  const fetchH5PContent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/h5p/video/${id}/content`);
      setH5pContents(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error fetching H5P content:', error);
      setSaveError('Failed to load H5P content');
    } finally {
      setLoading(false);
    }
  };

  // Export video with H5P content as .h5p file
  const exportToH5P = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/h5p/video/${id}/export`, {}, {
        responseType: 'blob'
      });
      
      // Create download link with descriptive filename
      const blob = new Blob([response.data as any], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename based on original video filename
      let filename = 'video.h5p';
      if (videoData?.filePath) {
        // Extract filename from filePath and replace extension with .h5p
        const pathParts = videoData.filePath.split('/');
        const fullFileName = pathParts[pathParts.length - 1];
        const nameWithoutExt = fullFileName.replace(/\.[^/.]+$/, '');
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '-');
        filename = `${sanitizedName}.h5p`;
      } else if (videoData?.title) {
        // Fallback to title if no filePath
        const sanitizedTitle = videoData.title.replace(/[^a-zA-Z0-9\-_]/g, '-').substring(0, 50);
        filename = `${sanitizedTitle}.h5p`;
      }
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSaveSuccess(true);
      setExportDialog(false);
    } catch (error: any) {
      console.error('Error exporting H5P:', error);
      setSaveError('Failed to export H5P file');
    } finally {
      setLoading(false);
    }
  };

  // Create H5P content with specific library
  const createH5PContent = (libraryId: string) => {
    setCurrentContentId(undefined);
    setPreselectedLibrary(libraryId);
    setH5pEditorOpen(true);
    // You can pass the libraryId to the editor to pre-select the content type
  };

  // Delete H5P content
  const deleteH5PContent = async (contentId: string) => {
    try {
      await api.delete(`/h5p/content/${contentId}`);
      await fetchH5PContent();
      setSaveSuccess(true);
    } catch (error: any) {
      console.error('Error deleting H5P content:', error);
      setSaveError('Failed to delete H5P content');
    }
  };

  useEffect(() => {
    if (id) {
      fetchVideoData();
      fetchH5PContent();
    }
  }, [id]);

  const handleOpenH5PEditor = (contentId?: string) => {
    setCurrentContentId(contentId);
    setPreselectedLibrary(undefined); // Clear preselection for manual editor opening
    setH5pEditorOpen(true);
  };

  const handleSaveH5PContent = async (contentData: any) => {
    try {
      // Use the timestamp from the content data
      const timestamp = contentData.timestamp || 0;

      let response;
      if (contentData.id) {
        // Update existing content
        response = await api.put(`/h5p/content/${contentData.id}`, {
          contentData,
          timestamp
        });
        console.log('H5P content updated:', response.data);
      } else {
        // Create new content
        response = await api.post(`/h5p/video/${id}`, {
          contentData,
          timestamp
        });
        console.log('H5P content created:', response.data);
      }

      setSaveSuccess(true);
      // Refresh the H5P content list
      await fetchH5PContent();
    } catch (error: any) {
      console.error('Error saving H5P content:', error);
      setSaveError(error.response?.data?.error || 'Failed to save H5P content');
    }
  };

  const handleVideoTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    // This function can be used to track video time for H5P interactions
    const video = event.target as HTMLVideoElement;
    const currentTime = video.currentTime;
    
    // Update the current video time state
    setCurrentVideoTime(currentTime);
    
    // You can add logic here to trigger H5P interactions at specific times
    console.log('Video time:', currentTime);
  };

  // Handle when H5P content is answered correctly
  const handleContentAnswered = (contentId: string) => {
    setAnsweredContentIds(prev => {
      const newSet = new Set(prev);
      newSet.add(contentId);
      return newSet;
    });
  };

  // Handle LTI export
  const handleLtiExport = async () => {
    setLtiError(null);
    setLtiLink(null);
    try {
      const res = await api.get<{ ltiLink: string }>(`/lti/generate/${id}`);
      setLtiLink(res.data.ltiLink);
      setLtiDialogOpen(true);
    } catch (err: any) {
      setLtiError(err.response?.data?.error || 'Failed to generate LTI link');
      setLtiDialogOpen(true);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Video Editor
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" gutterBottom>
              Preview Player
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialog(true)}
                disabled={h5pContents.length === 0}
              >
                Export (.h5p)
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={handleLtiExport}
                color="secondary"
              >
                Export LTI Link
              </Button>
            </Stack>
          </Stack>
          <VideoPlayer 
            videoId={id || ''} 
            h5pContents={h5pContents}
            onTimeUpdate={handleVideoTimeUpdate}
            onContentAnswered={handleContentAnswered}
          />
          
          {/* Created H5P Content - Right below video */}
          {h5pContents.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Interactive Content in this Video
              </Typography>
              <Grid container spacing={2}>
                {h5pContents.map((content, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        opacity: answeredContentIds.has(content.id) ? 0.5 : 1,
                        transition: 'opacity 0.5s ease-in-out',
                        position: 'relative'
                      }}
                    >
                      {answeredContentIds.has(content.id) && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 1,
                            bgcolor: 'success.main',
                            color: 'white',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ✓
                        </Box>
                      )}
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                            {content.title || content.metadata?.title || `Interactive Content ${index + 1}`}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <IconButton size="small" onClick={() => handleOpenH5PEditor(content.id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => deleteH5PContent(content.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {content.library || 'H5P Interactive Content'}
                        </Typography>
                        {content.params?.question && (
                          <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                            "{content.params.question.substring(0, 80)}..."
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} mt={2}>
                          <Chip size="small" label={`${content.timestamp || 0}s`} />
                          <Chip size="small" label={content.status || 'Active'} color="success" />
                          {content.params?.answers && (
                            <Chip size="small" label={`${content.params.answers.length} options`} variant="outlined" />
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>

        {/* H5P Content Creator */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              H5P Content Creator
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose from available H5P content types to create interactive elements for your video.
            Each content type offers different interaction capabilities for enhanced learning experiences.
          </Typography>

          {/* Interactive Video Library Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {h5pContentTypes.map((library) => (
              <Grid item xs={12} sm={6} md={4} key={library.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => createH5PContent(library.id)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {React.cloneElement(library.icon, { sx: { fontSize: 40 } })}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {library.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {library.description}
                    </Typography>
                    <Chip 
                      label={library.category} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Empty State */}
          {h5pContents.length === 0 && (
            <Box
              sx={{
                minHeight: 200,
                border: '2px dashed #ccc',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f9f9f9',
                mt: 2
              }}
            >
              <Stack alignItems="center" spacing={2}>
                <InteractiveIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="h6" color="text.secondary">
                  No interactive content created yet
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Choose from the libraries above to create engaging interactive video content
                </Typography>
              </Stack>
            </Box>
          )}
        </Paper>

        {/* WordPress Integration Section */}
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            WordPress Integration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Manage and publish your video content through WordPress. Access the WordPress admin panel,
            create posts, and integrate your H5P content with your WordPress site.
          </Typography>
          <WordPressIntegration />
        </Paper>

        {/* Advanced H5P Editor Dialog */}
        <AdvancedH5PEditor
          open={h5pEditorOpen}
          onClose={() => setH5pEditorOpen(false)}
          onSave={handleSaveH5PContent}
          contentId={currentContentId}
          videoId={id || ''}
          preselectedLibrary={preselectedLibrary}
          currentVideoTime={currentVideoTime}
        />

        {/* Export Dialog */}
        <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Export Interactive Video</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Export your video with all H5P interactive content as a single .h5p file.
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Content to Export:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <VideoLibraryIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Video file" secondary="Main video content" />
                </ListItem>
                {h5pContents.map((content, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InteractiveIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={content.title || `Interactive Content ${index + 1}`}
                      secondary={`${content.library} at ${content.timestamp}s`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Alert severity="info">
              The exported .h5p file can be imported into any H5P-compatible platform or LMS.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={exportToH5P}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
            >
              {loading ? 'Exporting...' : 'Export H5P'}
            </Button>
          </DialogActions>
        </Dialog>

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

        {/* LTI Export Dialog */}
        <Dialog open={ltiDialogOpen} onClose={() => setLtiDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Export LTI Link</DialogTitle>
          <DialogContent>
            {ltiError && <Alert severity="error" sx={{ mb: 2 }}>{ltiError}</Alert>}
            {ltiLink && (
              <>
                <Typography variant="body1" paragraph>
                  Your video is now available as an LTI link. Copy this link to integrate it into your LMS:
                </Typography>
                <TextField
                  label="LTI Link"
                  value={ltiLink}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                  sx={{ mb: 2 }}
                />
                <Alert severity="info">
                  This LTI link provides access to your interactive video with all H5P content. 
                  Students can interact with the video directly from your LMS.
                </Alert>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLtiDialogOpen(false)}>Close</Button>
            {ltiLink && (
              <Button 
                variant="contained" 
                onClick={() => navigator.clipboard.writeText(ltiLink)}
                startIcon={<ShareIcon />}
              >
                Copy Link
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
});

export default VideoEdit;