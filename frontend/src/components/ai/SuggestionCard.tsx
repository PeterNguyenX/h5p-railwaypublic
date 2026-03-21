import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { AISuggestion, DiffStatus } from '../../types/aiEnrichment';

interface SuggestionCardProps {
  suggestion: AISuggestion;
  diffStatus?: DiffStatus;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
  onTimestampClick: (time: number) => void;
}

/** Format seconds into MM:SS display. */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Map H5P type to a readable label. */
const typeLabels: Record<string, string> = {
  MultiChoice: 'Multiple Choice',
  TrueFalse: 'True / False',
  FillBlanks: 'Fill in the Blanks',
  Hotspot: 'Hotspot',
  DragDrop: 'Drag & Drop'
};

/** Map diff status to visual style. */
const diffChipProps: Record<DiffStatus, { label: string; color: 'success' | 'info' | 'warning' | 'error' }> = {
  new: { label: 'New', color: 'success' },
  unchanged: { label: 'Unchanged', color: 'info' },
  modified: { label: 'Modified', color: 'warning' },
  removed: { label: 'Removed', color: 'error' }
};

/** Map status to card border color. */
const statusBorders: Record<string, string> = {
  pending: '#757575',
  accepted: '#4caf50',
  rejected: '#f44336'
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  diffStatus,
  onAccept,
  onReject,
  onEdit,
  onTimestampClick
}) => {
  const [expanded, setExpanded] = React.useState(false);

  /** Render a short preview of the config. */
  const renderConfigPreview = (): string => {
    const cfg = suggestion.config;
    if (!cfg) return '';

    // Try common H5P config keys
    if (cfg.question && typeof cfg.question === 'string') {
      return cfg.question;
    }
    if (cfg.text && typeof cfg.text === 'string') {
      return cfg.text;
    }
    // For MultiChoice, show the question
    if (cfg.question && typeof cfg.question === 'object') {
      return JSON.stringify(cfg.question).slice(0, 100);
    }
    return JSON.stringify(cfg).slice(0, 120) + '…';
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderLeft: `4px solid ${statusBorders[suggestion.status] || '#757575'}`,
        opacity: suggestion.status === 'rejected' ? 0.5 : 1,
        transition: 'opacity 0.2s, border-color 0.3s'
      }}
    >
      <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Tooltip title="Jump to this timestamp" arrow>
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
              label={formatTime(suggestion.timestamp)}
              size="small"
              onClick={() => onTimestampClick(suggestion.timestamp)}
              sx={{ cursor: 'pointer', fontFamily: 'monospace' }}
            />
          </Tooltip>
          <Chip
            label={typeLabels[suggestion.type] || suggestion.type}
            size="small"
            color="primary"
            variant="outlined"
          />
          {diffStatus && diffChipProps[diffStatus] && (
            <Chip
              label={diffChipProps[diffStatus].label}
              size="small"
              color={diffChipProps[diffStatus].color}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          )}
          {suggestion.status !== 'pending' && (
            <Chip
              label={suggestion.status}
              size="small"
              color={suggestion.status === 'accepted' ? 'success' : 'error'}
              sx={{ height: 20, fontSize: '0.65rem', ml: 'auto' }}
            />
          )}
        </Box>

        {/* Config preview */}
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            cursor: 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: expanded ? 'normal' : 'nowrap'
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {renderConfigPreview()}
        </Typography>

        {/* Expandable config detail */}
        <Collapse in={expanded}>
          <Box
            sx={{
              mt: 1,
              p: 1,
              backgroundColor: 'grey.50',
              borderRadius: 1,
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              maxHeight: 200,
              overflow: 'auto'
            }}
          >
            {JSON.stringify(suggestion.config, null, 2)}
          </Box>
        </Collapse>

        {/* Reason */}
        {suggestion.reason && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {suggestion.reason}
          </Typography>
        )}
      </CardContent>

      {/* Action buttons */}
      {suggestion.status === 'pending' && diffStatus !== 'removed' && (
        <CardActions sx={{ pt: 0, px: 2, pb: 1 }}>
          <Tooltip title="Accept this suggestion" arrow>
            <IconButton
              size="small"
              color="success"
              onClick={() => onAccept(suggestion.id)}
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject this suggestion" arrow>
            <IconButton
              size="small"
              color="error"
              onClick={() => onReject(suggestion.id)}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit config" arrow>
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit(suggestion.id)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </CardActions>
      )}

      {/* Allow undoing accepted/rejected */}
      {suggestion.status !== 'pending' && diffStatus !== 'removed' && (
        <CardActions sx={{ pt: 0, px: 2, pb: 1 }}>
          <Button
            size="small"
            variant="text"
            onClick={() => onAccept(suggestion.id)}
            disabled={suggestion.status === 'accepted'}
          >
            Accept
          </Button>
          <Button
            size="small"
            variant="text"
            color="error"
            onClick={() => onReject(suggestion.id)}
            disabled={suggestion.status === 'rejected'}
          >
            Reject
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => onEdit(suggestion.id)}
          >
            Edit
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default SuggestionCard;
