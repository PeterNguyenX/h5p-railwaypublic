import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface H5PContainerProps {
  contentId: string;
}

const H5PContainer: React.FC<H5PContainerProps> = ({ contentId }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadH5P = async () => {
      try {
        const response = await fetch(`/api/h5p/content/${contentId}`);
        if (!response.ok) {
          throw new Error('Failed to load H5P content');
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load H5P content');
        setLoading(false);
      }
    };

    loadH5P();
  }, [contentId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 400 }}>
      <div id={`h5p-container-${contentId}`} />
    </Box>
  );
};

export default H5PContainer;
