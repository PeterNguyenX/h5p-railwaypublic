import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  MenuItem,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QuizIcon from '@mui/icons-material/Quiz';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import api from '../config/api';

interface AdvancedH5PEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (contentData: any) => void;
  contentId?: string;
  videoId: string;
}

interface H5PLibrary {
  machineName: string;
  title: string;
  majorVersion: number;
  minorVersion: number;
  description: string;
}

const AdvancedH5PEditor: React.FC<AdvancedH5PEditorProps> = ({
  open,
  onClose,
  onSave,
  contentId,
  videoId
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libraries, setLibraries] = useState<H5PLibrary[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');
  const [step, setStep] = useState<'select' | 'edit'>('select');
  const [contentData, setContentData] = useState<any>({});

  // Multiple Choice specific state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  // True/False specific state
  const [statement, setStatement] = useState('');
  const [isTrue, setIsTrue] = useState(true);

  // Fill in the blanks specific state
  const [blankText, setBlankText] = useState('');

  useEffect(() => {
    if (open) {
      loadLibraries();
    }
  }, [open]);

  const loadLibraries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<H5PLibrary[]>('/h5p/libraries');
      setLibraries(response.data);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading H5P libraries:', err);
      setError(err.message || 'Failed to load H5P libraries');
      setLoading(false);
    }
  };

  const getLibraryIcon = (machineName: string) => {
    switch (machineName) {
      case 'H5P.MultiChoice':
        return <QuizIcon />;
      case 'H5P.TrueFalse':
        return <QuizIcon />;
      case 'H5P.InteractiveVideo':
        return <VideoLibraryIcon />;
      case 'H5P.DragQuestion':
        return <DragIndicatorIcon />;
      default:
        return <QuizIcon />;
    }
  };

  const handleLibrarySelect = (library: H5PLibrary) => {
    setSelectedLibrary(library.machineName);
    setStep('edit');
    
    // Initialize default content based on library type
    switch (library.machineName) {
      case 'H5P.MultiChoice':
        setQuestion('');
        setOptions(['', '', '', '']);
        setCorrectAnswer(0);
        break;
      case 'H5P.TrueFalse':
        setStatement('');
        setIsTrue(true);
        break;
      case 'H5P.Blanks':
        setBlankText('');
        break;
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const generateContentParams = () => {
    switch (selectedLibrary) {
      case 'H5P.MultiChoice':
        return {
          question: question,
          answers: options.map((option, index) => ({
            text: option,
            correct: index === correctAnswer,
            tipsAndFeedback: {
              tip: '',
              chosenFeedback: index === correctAnswer ? 'Correct!' : 'Incorrect, try again.',
              notChosenFeedback: ''
            }
          })),
          overallFeedback: [
            { from: 0, to: 100, feedback: 'Great job!' }
          ],
          behaviour: {
            enableRetry: true,
            enableSolutionsButton: true,
            enableCheckButton: true,
            type: 'auto',
            singlePoint: false,
            randomAnswers: true,
            showSolutionsRequiresInput: true,
            confirmCheckDialog: false,
            confirmRetryDialog: false,
            autoCheck: false,
            passPercentage: 50,
            showScorePoints: true
          }
        };
      
      case 'H5P.TrueFalse':
        return {
          question: statement,
          correct: isTrue ? 'true' : 'false',
          behaviour: {
            enableRetry: true,
            enableSolutionsButton: true,
            enableCheckButton: true,
            confirmCheckDialog: false,
            confirmRetryDialog: false,
            showScorePoints: true
          },
          l10n: {
            trueText: 'True',
            falseText: 'False',
            score: 'You got @score of @total points',
            checkAnswer: 'Check',
            showSolutionButton: 'Show solution',
            tryAgain: 'Retry',
            wrongAnswerMessage: 'Wrong answer',
            correctAnswerMessage: 'Correct answer',
            scoreBarLabel: 'You got :num out of :total points'
          }
        };
      
      case 'H5P.Blanks':
        return {
          text: blankText,
          questions: [],
          overallFeedback: [
            { from: 0, to: 100, feedback: 'Great job!' }
          ],
          behaviour: {
            enableRetry: true,
            enableSolutionsButton: true,
            enableCheckButton: true,
            showSolutionsRequiresInput: true,
            autoCheck: false,
            caseSensitive: true,
            showScorePoints: true,
            tryAgainButton: 'Retry',
            checkAnswerButton: 'Check',
            showSolutionButton: 'Show solution',
            scoreBarLabel: 'You got :num out of :total points'
          }
        };
      
      default:
        return {};
    }
  };

  const handleSave = async () => {
    try {
      const params = generateContentParams();
      
      const contentData = {
        library: selectedLibrary,
        params: params,
        metadata: {
          title: question || statement || 'H5P Content',
          license: 'U',
          extraTitle: question || statement || 'H5P Content'
        }
      };

      onSave(contentData);
      handleClose();
    } catch (err: any) {
      console.error('Error saving H5P content:', err);
      setError(err.message || 'Failed to save content');
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedLibrary('');
    setQuestion('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setStatement('');
    setIsTrue(true);
    setBlankText('');
    setError(null);
    onClose();
  };

  const renderLibrarySelector = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Content Type
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the type of interactive content you want to create
      </Typography>
      
      <Grid container spacing={2}>
        {libraries.map((library) => (
          <Grid item xs={12} sm={6} md={4} key={library.machineName}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  boxShadow: 6,
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s'
              }}
              onClick={() => handleLibrarySelect(library)}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  {getLibraryIcon(library.machineName)}
                  <Typography variant="h6" component="div">
                    {library.title}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {library.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderContentEditor = () => {
    switch (selectedLibrary) {
      case 'H5P.MultiChoice':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Create Multiple Choice Question
            </Typography>
            
            <TextField
              fullWidth
              label="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle1" gutterBottom>
              Answer Options
            </Typography>
            
            {options.map((option, index) => (
              <Stack key={index} direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                <Button
                  variant={correctAnswer === index ? 'contained' : 'outlined'}
                  onClick={() => setCorrectAnswer(index)}
                  sx={{ minWidth: 100 }}
                >
                  {correctAnswer === index ? 'Correct' : 'Mark Correct'}
                </Button>
              </Stack>
            ))}
          </Box>
        );

      case 'H5P.TrueFalse':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Create True/False Question
            </Typography>
            
            <TextField
              fullWidth
              label="Statement"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />

            <TextField
              select
              fullWidth
              label="Correct Answer"
              value={isTrue ? 'true' : 'false'}
              onChange={(e) => setIsTrue(e.target.value === 'true')}
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </TextField>
          </Box>
        );

      case 'H5P.Blanks':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Create Fill in the Blanks
            </Typography>
            
            <TextField
              fullWidth
              label="Text with blanks (use *answer* for blanks)"
              value={blankText}
              onChange={(e) => setBlankText(e.target.value)}
              multiline
              rows={4}
              helperText="Example: The capital of France is *Paris*."
              sx={{ mb: 3 }}
            />
          </Box>
        );

      default:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Content Type Not Supported Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This content type will be available in future updates.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {step === 'select' ? 'H5P Content Creator' : 'Edit Content'}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography>Loading H5P Libraries...</Typography>
            </Stack>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            {step === 'select' && renderLibrarySelector()}
            {step === 'edit' && (
              <>
                {renderContentEditor()}
                
                <Divider sx={{ my: 3 }} />
                
                <Stack direction="row" spacing={2} justifyContent="space-between">
                  <Button 
                    variant="outlined" 
                    onClick={() => setStep('select')}
                  >
                    Back to Library Selection
                  </Button>
                  
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleSave}
                      disabled={
                        (selectedLibrary === 'H5P.MultiChoice' && (!question || options.some(opt => !opt))) ||
                        (selectedLibrary === 'H5P.TrueFalse' && !statement) ||
                        (selectedLibrary === 'H5P.Blanks' && !blankText)
                      }
                    >
                      Save Content
                    </Button>
                  </Stack>
                </Stack>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedH5PEditor;
