import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { Launch as LaunchIcon, CheckCircle } from '@mui/icons-material';

interface WordPressStatus {
  status: string;
  wordpressUrl: string;
  message: string;
}

const WordPress: React.FC = () => {
  const [wpStatus, setWpStatus] = useState<WordPressStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkWordPressStatus();
  }, []);

  const checkWordPressStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/wordpress/health');
      if (response.ok) {
        const data = await response.json();
        setWpStatus(data);
      } else {
        setError('WordPress service not available');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to WordPress';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openWordPress = () => {
    // Open WordPress in a new tab through the proxy
    window.open('/api/wordpress/', '_blank');
  };

  const openWordPressAdmin = () => {
    // Open WordPress admin in a new tab through the proxy
    window.open('/api/wordpress/wp-admin/', '_blank');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        WordPress Integration
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your H5P content through WordPress integration. WordPress provides
        additional content management capabilities and plugin ecosystem.
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button 
            size="small" 
            onClick={checkWordPressStatus}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {wpStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h6">WordPress Status</Typography>
              <Chip 
                icon={<CheckCircle />}
                label="Active"
                color="success"
                size="small"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {wpStatus.message}
            </Typography>
            
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<LaunchIcon />}
                onClick={openWordPress}
                color="primary"
              >
                Open WordPress Site
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<LaunchIcon />}
                onClick={openWordPressAdmin}
                color="secondary"
              >
                WordPress Admin
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Features Available
          </Typography>
          
          <Box component="ul" sx={{ pl: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>H5P Plugin:</strong> Create and manage interactive content
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Content Management:</strong> WordPress CMS for organizing content
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>User Management:</strong> WordPress user roles and permissions
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Plugin Ecosystem:</strong> Access to thousands of WordPress plugins
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Setup Instructions:</strong>
        </Typography>
        <ol>
          <li>Make sure MAMP is running with both Apache and MySQL</li>
          <li>Complete WordPress installation if not done yet</li>
          <li>Activate the H5P plugin in WordPress admin</li>
          <li>Start creating interactive content!</li>
        </ol>
      </Alert>
    </Container>
  );
};

export default WordPress;
