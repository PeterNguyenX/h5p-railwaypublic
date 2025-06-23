import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Stack,
  Paper,
} from '@mui/material';

declare global {
  interface Window {
    H5P?: any;
    H5PEditor?: any;
    H5PIntegration?: any;
  }
}

export interface H5PEditorProps {
  videoId: string;
  onSave: (h5pData: any) => void;
  onCancel: () => void;
}

const H5PEditor: React.FC<H5PEditorProps> = ({ videoId, onSave, onCancel }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [contentType, setContentType] = useState('question');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  useEffect(() => {
    // Dynamically load H5P scripts and styles if not already loaded
    const loadH5PLibraries = async () => {
      // Load H5P core first
      const coreScript = document.createElement('script');
      coreScript.src = '/h5p/libraries/core/h5p.js';
      document.body.appendChild(coreScript);

      coreScript.onload = () => {
        if (!window.H5PIntegration) window.H5PIntegration = {};
        if (!window.H5PEditor) {
          const editorScript = document.createElement('script');
          editorScript.src = '/h5p/libraries/H5PEditor/editor.js';
          document.body.appendChild(editorScript);
          const editorStyle = document.createElement('link');
          editorStyle.rel = 'stylesheet';
          editorStyle.href = '/h5p/libraries/H5PEditor/editor.css';
          document.head.appendChild(editorStyle);
          editorScript.onload = () => {
            // Load the Hub client script after editor.js is loaded
            const hubScript = document.createElement('script');
            hubScript.src = '/h5p/libraries/hub/hub-client.js';
            document.body.appendChild(hubScript);
            hubScript.onload = () => {
              // Initialize H5P Editor after all scripts load
              if (window.H5PEditor && editorRef.current) {
                const editor = new window.H5PEditor.Editor(
                  // ...other config,
                  {
                    hubIsEnabled: true,
                    // ...other options
                  }
                );
                // You will need to pass config and handle save events
              }
            };
          };
        } else if (editorRef.current) {
          // Already loaded, initialize editor with hub enabled
          const editor = new window.H5PEditor.Editor(
            // ...other config,
            {
              hubIsEnabled: true,
              // ...other options
            }
          );
        }
      };
    };
    loadH5PLibraries();
  }, [videoId]);

  const handleSave = () => {
    // TODO: Get H5P data from editor instance
    const h5pData = {}; // Replace with actual data
    onSave(h5pData);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        <TextField
          select
          label="Content Type"
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          fullWidth
        >
          <MenuItem value="question">Multiple Choice Question</MenuItem>
          <MenuItem value="interactive-video">Interactive Video</MenuItem>
          <MenuItem value="presentation">Presentation</MenuItem>
        </TextField>

        <TextField
          label="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question..."
          multiline
          rows={3}
          fullWidth
        />

        {contentType === 'question' && (
          <>
            {options.map((option, index) => (
              <TextField
                key={index}
                label={`Option ${index + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Enter option ${index + 1}`}
                fullWidth
              />
            ))}

            <TextField
              select
              label="Correct Answer"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(Number(e.target.value))}
              fullWidth
            >
              {options.map((_, index) => (
                <MenuItem key={index} value={index}>
                  Option {index + 1}
                </MenuItem>
              ))}
            </TextField>
          </>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </Box>

        <div ref={editorRef} id="h5p-editor-container"></div>
        <Button variant="contained" onClick={handleSave}>
          Save H5P
        </Button>
      </Stack>
    </Paper>
  );
};

export default H5PEditor;
