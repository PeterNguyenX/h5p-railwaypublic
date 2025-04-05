import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

declare global {
  interface Window {
    H5P?: {
      init: () => void;
    };
  }
}

interface H5PPlayerProps {
  contentId: string;
}

const H5PPlayer: React.FC<H5PPlayerProps> = ({ contentId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize H5P player
    if (window.H5P) {
      window.H5P.init();
    }
  }, []);

  return (
    <Box ref={containerRef}>
      <div className="h5p-content" data-content-id={contentId} />
    </Box>
  );
};

export default H5PPlayer; 