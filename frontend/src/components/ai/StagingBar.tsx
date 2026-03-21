import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Chip,
  Box,
  CircularProgress,
  LinearProgress,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublishIcon from '@mui/icons-material/Publish';
import ClearAllIcon from '@mui/icons-material/ClearAll';

interface StagingBarProps {
  acceptedCount: number;
  pendingCount: number;
  totalCount: number;
  isInjecting: boolean;
  isAnalyzing: boolean;
  progressMessage: string;
  onApply: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onRemoveRejected: () => void;
}

const StagingBar: React.FC<StagingBarProps> = observer(({
  acceptedCount,
  pendingCount,
  totalCount,
  isInjecting,
  isAnalyzing,
  progressMessage,
  onApply,
  onAcceptAll,
  onRejectAll,
  onRemoveRejected
}) => {
  if (totalCount === 0 && !isAnalyzing) return null;

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={4}
      sx={{
        top: 'auto',
        bottom: 0,
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      {/* Progress bar for analysis */}
      {isAnalyzing && <LinearProgress color="primary" />}

      <Toolbar variant="dense" sx={{ gap: 1.5, minHeight: 52 }}>
        {/* Status message */}
        {isAnalyzing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              {progressMessage || 'Analyzing...'}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Counters */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Accepted suggestions ready to inject" arrow>
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                  label={`${acceptedCount} accepted`}
                  color="success"
                  size="small"
                  variant={acceptedCount > 0 ? 'filled' : 'outlined'}
                />
              </Tooltip>
              {pendingCount > 0 && (
                <Chip
                  label={`${pendingCount} pending`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Batch actions */}
            {pendingCount > 0 && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={onAcceptAll}
                  startIcon={<CheckCircleIcon />}
                >
                  Accept All
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={onRejectAll}
                >
                  Reject All
                </Button>
              </>
            )}

            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={onRemoveRejected}
              startIcon={<ClearAllIcon />}
            >
              Clear Rejected
            </Button>

            {/* Apply button */}
            <Button
              variant="contained"
              color="primary"
              disabled={acceptedCount === 0 || isInjecting}
              onClick={onApply}
              startIcon={isInjecting ? <CircularProgress size={16} /> : <PublishIcon />}
            >
              {isInjecting ? 'Applying...' : `Apply ${acceptedCount} Changes`}
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
});

export default StagingBar;
