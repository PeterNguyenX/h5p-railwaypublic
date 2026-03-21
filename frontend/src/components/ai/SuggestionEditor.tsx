import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import type { AISuggestion, H5PInteractionType } from '../../types/aiEnrichment';

interface SuggestionEditorProps {
  suggestion: AISuggestion;
  onSave: (id: string, config: Record<string, unknown>) => void;
  onCancel: () => void;
}

const H5P_TYPES: H5PInteractionType[] = [
  'MultiChoice',
  'TrueFalse',
  'FillBlanks',
  'Hotspot',
  'DragDrop'
];

const SuggestionEditor: React.FC<SuggestionEditorProps> = ({
  suggestion,
  onSave,
  onCancel
}) => {
  const [configJson, setConfigJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<H5PInteractionType>(suggestion.type);

  useEffect(() => {
    setConfigJson(JSON.stringify(suggestion.config, null, 2));
    setSelectedType(suggestion.type);
    setJsonError(null);
  }, [suggestion]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(configJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setJsonError('Config must be a JSON object');
        return;
      }
      setJsonError(null);
      onSave(suggestion.id, parsed);
    } catch {
      setJsonError('Invalid JSON syntax');
    }
  };

  /** Try to format JSON */
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(configJson);
      setConfigJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      setJsonError('Cannot format — invalid JSON');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
        Edit Suggestion — {suggestion.id.slice(-8)}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Timestamp (seconds)"
          type="number"
          value={suggestion.timestamp}
          disabled
          size="small"
          sx={{ width: 160 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>H5P Type</InputLabel>
          <Select
            value={selectedType}
            label="H5P Type"
            onChange={(e) => setSelectedType(e.target.value as H5PInteractionType)}
            disabled
          >
            {H5P_TYPES.map(t => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
        H5P Config (JSON):
      </Typography>
      <TextField
        multiline
        fullWidth
        minRows={6}
        maxRows={16}
        value={configJson}
        onChange={(e) => {
          setConfigJson(e.target.value);
          setJsonError(null);
        }}
        error={!!jsonError}
        helperText={jsonError}
        sx={{
          mb: 1.5,
          '& .MuiInputBase-input': {
            fontFamily: 'monospace',
            fontSize: '0.8rem'
          }
        }}
      />

      {suggestion.reason && (
        <Alert severity="info" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
          <strong>AI reason:</strong> {suggestion.reason}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button variant="outlined" size="small" onClick={handleFormat}>
          Format JSON
        </Button>
        <Button variant="outlined" size="small" color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" size="small" onClick={handleSave}>
          Save Changes
        </Button>
      </Box>
    </Paper>
  );
};

export default SuggestionEditor;
