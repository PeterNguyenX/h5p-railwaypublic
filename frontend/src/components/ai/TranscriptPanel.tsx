import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  useTheme
} from '@mui/material';
import type { TranscriptSegment, AISuggestion } from '../../types/aiEnrichment';

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  suggestions: AISuggestion[];
  currentTime: number;
  onTimestampClick: (time: number) => void;
}

/** Format seconds into MM:SS display. */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Map H5P type to a short label color. */
const typeColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
  MultiChoice: 'primary',
  TrueFalse: 'secondary',
  FillBlanks: 'success',
  Hotspot: 'warning',
  DragDrop: 'info'
};

const TranscriptPanel: React.FC<TranscriptPanelProps> = observer(({
  segments,
  suggestions,
  currentTime,
  onTimestampClick
}) => {
  const theme = useTheme();

  /** Check if a segment has an AI suggestion near its time range. */
  const getSuggestionsForSegment = (segment: TranscriptSegment): AISuggestion[] => {
    return suggestions.filter(
      s => s.timestamp >= segment.start && s.timestamp <= segment.end
    );
  };

  /** Check if a segment is currently active (video playback). */
  const isActive = (segment: TranscriptSegment): boolean => {
    return currentTime >= segment.start && currentTime <= segment.end;
  };

  if (segments.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Upload a .vtt or .srt transcript file to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
      <Typography variant="subtitle2" sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        Transcript ({segments.length} segments)
      </Typography>
      {segments.map((segment, index) => {
        const segSuggestions = getSuggestionsForSegment(segment);
        const active = isActive(segment);

        return (
          <Box
            key={index}
            onClick={() => onTimestampClick(segment.start)}
            sx={{
              px: 2,
              py: 1,
              cursor: 'pointer',
              borderLeft: active ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
              backgroundColor: active
                ? theme.palette.action.selected
                : segSuggestions.length > 0
                  ? theme.palette.action.hover
                  : 'transparent',
              '&:hover': { backgroundColor: theme.palette.action.hover },
              transition: 'background-color 0.2s, border-color 0.2s'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  color: 'text.secondary',
                  minWidth: 90
                }}
              >
                {formatTime(segment.start)} → {formatTime(segment.end)}
              </Typography>
              {segSuggestions.map(s => (
                <Tooltip key={s.id} title={`${s.type}: ${s.reason}`} arrow>
                  <Chip
                    label={s.type}
                    size="small"
                    color={typeColors[s.type] || 'default'}
                    variant={s.status === 'accepted' ? 'filled' : 'outlined'}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                </Tooltip>
              ))}
            </Box>
            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
              {segment.text}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
});

export default TranscriptPanel;
