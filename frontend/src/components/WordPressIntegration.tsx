import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  styled
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import api from '../config/api';

interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  status: string;
  link: string;
}

interface H5PContent {
  id: number;
  title: string;
  library: string;
  params: any;
  created: string;
  updated: string;
}

const StyledIframe = styled('iframe')({
  border: 'none',
});

const WordPressIntegration: React.FC = () => {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [h5pContent, setH5pContent] = useState<H5PContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createPostDialog, setCreatePostDialog] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [showEmbeddedView, setShowEmbeddedView] = useState(false);
  const [embeddedUrl, setEmbeddedUrl] = useState('http://localhost:3001/api/wordpress/wp-admin/');

  // Fetch WordPress posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Note: This requires WordPress REST API to be enabled
      // Try WordPress REST API endpoint
      try {
        const response = await axios.get<WordPressPost[]>('http://localhost:8888/h5p-wp/wp-json/wp/v2/posts');
        setPosts(response.data);
      } catch (restError: any) {
        console.log('WordPress REST API not available:', restError.message);
        setError('WordPress REST API is not enabled or accessible. Use direct WordPress access instead.');
      }
    } catch (err: any) {
      setError('Failed to fetch WordPress posts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch H5P content from WordPress
  const fetchH5PContent = async () => {
    try {
      setLoading(true);
      const response = await api.get<H5PContent[]>('/wordpress/h5p');
      setH5pContent(response.data);
    } catch (err: any) {
      setError('Failed to fetch H5P content: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new WordPress post
  const createPost = async () => {
    try {
      setLoading(true);
      await api.post('/wordpress/posts', newPost);
      setCreatePostDialog(false);
      setNewPost({ title: '', content: '' });
      await fetchPosts();
    } catch (err: any) {
      setError('Failed to create post: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync H5P content with WordPress
  const syncH5PContent = async (content: any) => {
    try {
      setLoading(true);
      await api.post('/wordpress/h5p/sync', content);
      await fetchH5PContent();
    } catch (err: any) {
      setError('Failed to sync H5P content: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Disabled automatic loading - users can manually access WordPress
  // useEffect(() => {
  //   fetchPosts();
  //   fetchH5PContent();
  // }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        WordPress Integration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* WordPress Access Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            WordPress Access
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Access your WordPress installation for content management.
            <br />
            <strong>Recommended:</strong> Use the direct access buttons below for full WordPress functionality without browser restrictions.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => window.open('http://localhost:8888/h5p-wp/', '_blank')}
              color="primary"
              size="large"
            >
              🌐 WordPress Site
            </Button>
            <Button
              variant="contained"
              onClick={() => window.open('http://localhost:8888/h5p-wp/wp-admin/', '_blank')}
              color="secondary"
              size="large"
            >
              ⚙️ WordPress Admin
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.open('http://localhost:8888/h5p-wp/wp-admin/plugins.php', '_blank')}
              color="info"
            >
              🔌 Plugins
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowEmbeddedView(!showEmbeddedView)}
              color="warning"
              size="small"
            >
              {showEmbeddedView ? "Hide" : "Show"} Embedded (Experimental)
            </Button>
          </Box>
          
          {/* Embedded WordPress View - Experimental */}
          {showEmbeddedView && (
            <Box sx={{ mt: 3, border: '1px solid #ddd', borderRadius: 1 }}>
              <Alert severity="warning" sx={{ m: 2 }}>
                <strong>Experimental Feature:</strong> Embedded WordPress may have limitations due to browser security policies. 
                For full functionality, use the direct access buttons above.
              </Alert>
              <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">
                  WordPress Embedded View
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    variant={embeddedUrl.includes('wp-admin/') && !embeddedUrl.includes('page=') ? "contained" : "outlined"}
                    onClick={() => setEmbeddedUrl('http://localhost:3001/api/wordpress/wp-admin/')}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    size="small" 
                    variant={embeddedUrl.includes('plugins.php') ? "contained" : "outlined"}
                    onClick={() => setEmbeddedUrl('http://localhost:3001/api/wordpress/wp-admin/plugins.php')}
                  >
                    Plugins
                  </Button>
                  <Button 
                    size="small" 
                    variant={embeddedUrl === 'http://localhost:3001/api/wordpress/' ? "contained" : "outlined"}
                    onClick={() => setEmbeddedUrl('http://localhost:3001/api/wordpress/')}
                  >
                    Site
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => window.open('http://localhost:8888/h5p-wp/wp-admin/', '_blank')}
                  >
                    Open in New Tab
                  </Button>
                </Box>
              </Box>
              <Box sx={{ height: 600, overflow: 'hidden', position: 'relative' }}>
                <StyledIframe
                  src={embeddedUrl}
                  width="100%"
                  height="100%"
                  title="WordPress Admin"
                  key={embeddedUrl}
                  onError={() => {
                    console.log('Iframe failed to load:', embeddedUrl);
                  }}
                />
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 8, 
                  right: 8, 
                  bgcolor: 'rgba(255,255,255,0.9)', 
                  p: 1, 
                  borderRadius: 1,
                  fontSize: '0.8em',
                  color: 'text.secondary'
                }}>
                  Having issues? Try "Open in New Tab" →
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* WordPress Posts Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            WordPress Posts
          </Typography>
          <Button
            variant="contained"
            onClick={() => setCreatePostDialog(true)}
            disabled={loading}
          >
            Create New Post
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {posts.map((post) => (
              <Grid item xs={12} md={6} key={post.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {post.title.rendered}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                      dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={post.status}
                        color={post.status === 'publish' ? 'success' : 'default'}
                        size="small"
                      />
                      <Button
                        component="a"
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                      >
                        View in WordPress
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* H5P Content Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          H5P Content in WordPress
        </Typography>

        <Grid container spacing={2}>
          {h5pContent.map((content) => (
            <Grid item xs={12} md={6} key={content.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {content.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Library: {content.library}
                  </Typography>
                  <Typography variant="caption" display="block" gutterBottom>
                    Created: {new Date(content.created).toLocaleDateString()}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => syncH5PContent(content)}
                    disabled={loading}
                  >
                    Sync to Local
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Create Post Dialog */}
      <Dialog
        open={createPostDialog}
        onClose={() => setCreatePostDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New WordPress Post</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Post Title"
            fullWidth
            variant="outlined"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Post Content"
            fullWidth
            variant="outlined"
            multiline
            rows={6}
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePostDialog(false)}>Cancel</Button>
          <Button
            onClick={createPost}
            variant="contained"
            disabled={loading || !newPost.title.trim()}
          >
            Create Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Actions */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={fetchPosts}
            disabled={loading}
          >
            Refresh Posts
          </Button>
          <Button
            variant="outlined"
            onClick={fetchH5PContent}
            disabled={loading}
          >
            Refresh H5P Content
          </Button>
          <Button
            component={RouterLink}
            to="/dashboard"
            variant="outlined"
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default WordPressIntegration;
