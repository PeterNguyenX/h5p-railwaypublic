import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Stack,
  Paper,
} from '@mui/material';

interface H5PEditorProps {
  onSave: (contentData: any) => void;
  onCancel: () => void;
}

const H5PEditor: React.FC<H5PEditorProps> = ({ onSave, onCancel }) => {
  const [contentType, setContentType] = useState('question');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  const handleSave = () => {
    const contentData = {
      library: contentType,
      params: {
        question,
        options,
        correctAnswer,
      },
    };
    onSave(contentData);
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
      </Stack>
    </Paper>
  );
};

export default H5PEditor;
