import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  SelectChangeEvent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const scrambleWord = (word: string): string => {
  return word
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

const generateWordsWithGemini = async (difficulty: string): Promise<string[]> => {
  try {
    const GEMINI_API_KEY = 'AIzaSyCpI0Dr4ZwiCfgv3LB_598oDO6eAsXkVEE';
    const prompt = `Generate 5 ${difficulty} difficulty level words for a word scramble game. 
    The words should be appropriate for the difficulty level with these exact lengths:
    - Easy: 4-5 letters, common words (e.g., "book", "tree", "fish")
    - Medium: 5-6 letters, slightly challenging words (e.g., "apple", "house", "water")
    - Hard: 7-8 letters, complex or technical words (e.g., "program", "network", "science")
    
    Return in format: {"words": ["word1", "word2", "word3", "word4", "word5"]}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.words.map((w: string) => w.toUpperCase());
  } catch (error) {
    throw new Error('Failed to generate words');
  }
};

const WordScramble = () => {
  const navigate = useNavigate();
  const { user, updateUserScore } = useUser();
  const [activeStep, setActiveStep] = useState(0);
  const [gameConfig, setGameConfig] = useState({ difficulty: 'medium' });
  const [gameState, setGameState] = useState({
    words: [] as string[],
    scrambledWords: [] as string[],
    currentWordIndex: 0,
    userInput: '',
    score: 0,
    isLoading: false,
    message: '',
    showMessage: false,
    messageType: 'info' as 'success' | 'error' | 'info' | 'warning',
    gameCompleted: false,
    error: false
  });

  const handleConfigChange = (e: SelectChangeEvent<string>) => {
    setGameConfig({ ...gameConfig, difficulty: e.target.value });
  };

  const startNewGame = async () => {
    setGameState(prev => ({ ...prev, isLoading: true, error: false }));
    try {
      const words = await generateWordsWithGemini(gameConfig.difficulty);
      const scrambledWords = words.map(scrambleWord);
      setGameState(prev => ({
        ...prev,
        words,
        scrambledWords,
        currentWordIndex: 0,
        userInput: '',
        score: 0,
        isLoading: false,
        gameCompleted: false,
        error: false
      }));
      setActiveStep(1);
    } catch {
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        message: 'Failed to generate words. Please try again.',
        showMessage: true,
        messageType: 'error',
        error: true
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameState(prev => ({ ...prev, userInput: e.target.value.toUpperCase() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { userInput, words, currentWordIndex, score } = gameState;
    const currentWord = words[currentWordIndex];

    if (userInput === currentWord) {
      const newScore = score + 20;
      setGameState(prev => ({
        ...prev,
        score: newScore,
        message: 'Correct! +20 points!',
        showMessage: true,
        messageType: 'success'
      }));
      if (currentWordIndex < words.length - 1) {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, currentWordIndex: prev.currentWordIndex + 1, userInput: '' }));
        }, 1500);
      } else {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, gameCompleted: true }));
          if (user) {
            updateUserScore('wordScramble', newScore).catch(console.error);
          }
        }, 1500);
      }
    } else {
      setGameState(prev => ({
        ...prev,
        message: `Incorrect! The word was: ${currentWord}`,
        showMessage: true,
        messageType: 'error'
      }));
      if (currentWordIndex < words.length - 1) {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, currentWordIndex: prev.currentWordIndex + 1, userInput: '' }));
        }, 1500);
      } else {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, gameCompleted: true }));
        }, 1500);
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ p: 4, mt: 6, borderRadius: 4 }}>
        <Typography variant="h4" fontWeight="bold" align="center" color="primary.dark" gutterBottom>
          Word Scramble Game
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
          Unscramble the words and earn points!
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 4 }}>
          {['Configure', 'Play', 'Complete'].map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {gameState.isLoading && (
          <Box mt={4} textAlign="center">
            <CircularProgress />
            <Typography variant="body2" mt={2}>Generating words...</Typography>
          </Box>
        )}

        {!gameState.isLoading && activeStep === 0 && (
          <Box mt={4}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select value={gameConfig.difficulty} label="Difficulty" onChange={handleConfigChange}>
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
              <FormHelperText>Select a difficulty to begin</FormHelperText>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
              onClick={startNewGame}
            >
              Start Game
            </Button>
          </Box>
        )}

        {activeStep === 1 && !gameState.gameCompleted && (
          <Box mt={4}>
            <Typography
              variant="h3"
              align="center"
              fontWeight="bold"
              sx={{
                letterSpacing: 6,
                my: 3,
                color: 'secondary.main',
                backgroundColor: 'secondary.light',
                borderRadius: 2,
                p: 2
              }}
            >
              {gameState.scrambledWords[gameState.currentWordIndex]}
            </Typography>

            <form onSubmit={handleSubmit}>
              <TextField
                label="Your Guess"
                value={gameState.userInput}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                color="success"
                fullWidth
                sx={{ mt: 2, py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
              >
                Submit
              </Button>
            </form>

            <LinearProgress
              variant="determinate"
              value={((gameState.currentWordIndex + 1) / gameState.words.length) * 100}
              sx={{ my: 3, height: 10, borderRadius: 5 }}
              color="secondary"
            />

            <Typography align="center">
              Score: <strong>{gameState.score}</strong>
            </Typography>
          </Box>
        )}

        {gameState.gameCompleted && (
          <Box mt={5} textAlign="center">
            <Typography variant="h5" color="success.main" fontWeight="bold" gutterBottom>
              🎉 Game Completed!
            </Typography>
            <Typography variant="h6">
              Your Final Score: <strong>{gameState.score}</strong>
            </Typography>
            <Button
              sx={{ mt: 3 }}
              variant="outlined"
              onClick={() => {
                setActiveStep(0);
                setGameState(prev => ({ ...prev, gameCompleted: false }));
              }}
            >
              Play Again
            </Button>
          </Box>
        )}

        <Snackbar
          open={gameState.showMessage}
          autoHideDuration={3000}
          onClose={() => setGameState(prev => ({ ...prev, showMessage: false }))}
        >
          <Alert
            severity={gameState.messageType}
            variant="filled"
            onClose={() => setGameState(prev => ({ ...prev, showMessage: false }))}
          >
            {gameState.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default WordScramble;