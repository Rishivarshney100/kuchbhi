import React, { useState, useEffect } from 'react';
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
import useSound from 'use-sound';

const scrambleWord = (word: string): string => {
  let scrambled = word;
  // Keep scrambling until we get a different word
  while (scrambled === word) {
    scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
  }
  return scrambled;
};

const generateWordsWithGemini = async (difficulty: string): Promise<string[]> => {
  try {
    const GEMINI_API_KEY = 'AIzaSyCpI0Dr4ZwiCfgv3LB_598oDO6eAsXkVEE';
    const prompt = `Generate 5 ${difficulty} difficulty level words for a word scramble game. 
    The words should be appropriate for the difficulty level with these exact lengths:
    - Easy: 4-5 letters, common words
    - Medium: 5-6 letters, slightly challenging words
    - Hard: 7-8 letters, complex or technical words
    
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
    score: 0,
    isLoading: false,
    message: '',
    showMessage: false,
    messageType: 'info' as 'success' | 'error' | 'info' | 'warning',
    gameCompleted: false
  });
  const [timeLeft, setTimeLeft] = useState(10);
  const [perfectScoreSound] = useSound('/sounds/perfect_score.mp3', { volume: 0.8 });
  const [timerSound] = useSound('/sounds/tictictic.mp3', { volume: 0.5 });

  const handleConfigChange = (e: SelectChangeEvent<string>) => {
    setGameConfig({ ...gameConfig, difficulty: e.target.value });
  };

  const startNewGame = async () => {
    setGameState(prev => ({ ...prev, isLoading: true }));
    try {
      const words = await generateWordsWithGemini(gameConfig.difficulty);
      const scrambledWords = words.map(word => scrambleWord(word));
      setGameState(prev => ({
        ...prev,
        words,
        scrambledWords,
        currentWordIndex: 0,
        score: 0,
        isLoading: false,
        gameCompleted: false,
        message: '',
        showMessage: false
      }));
      setTimeLeft(10);
      setActiveStep(1);
      timerSound();
    } catch (error) {
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        message: 'Failed to generate words. Please try again.',
        showMessage: true,
        messageType: 'error'
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { words, currentWordIndex, score } = gameState;
    const currentWord = words[currentWordIndex];
    const userInput = (e.target as HTMLFormElement).elements.namedItem('guess') as HTMLInputElement;

    if (userInput.value.toUpperCase() === currentWord) {
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
          setGameState(prev => ({
            ...prev,
            currentWordIndex: prev.currentWordIndex + 1,
            message: '',
            showMessage: false
          }));
          userInput.value = '';
          setTimeLeft(10);
          timerSound();
        }, 1500);
      } else {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, gameCompleted: true }));
          if (user) {
            updateUserScore('wordScramble', newScore).catch(console.error);
          }
          if (newScore === 100) {
            perfectScoreSound();
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
          setGameState(prev => ({
            ...prev,
            currentWordIndex: prev.currentWordIndex + 1,
            message: '',
            showMessage: false
          }));
          userInput.value = '';
          setTimeLeft(10);
        }, 1500);
      } else {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, gameCompleted: true }));
        }, 1500);
      }
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && !gameState.gameCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      if (gameState.currentWordIndex < gameState.words.length - 1) {
        setGameState(prev => ({
          ...prev,
          currentWordIndex: prev.currentWordIndex + 1,
          message: 'Time\'s up! Moving to next question.',
          showMessage: true,
          messageType: 'info'
        }));
        setTimeLeft(10);
        timerSound();
      } else {
        setGameState(prev => ({ ...prev, gameCompleted: true }));
      }
    }
  }, [timeLeft, gameState.gameCompleted, gameState.currentWordIndex, gameState.words.length, timerSound]);

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        mt: 4, 
        mb: 4,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 0%, rgba(255, 230, 0, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}>
        <Paper 
          elevation={6} 
          sx={{ 
            p: 4,
            background: 'linear-gradient(135deg, #1f1f1f 0%, #2b2b2b 100%)',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 0%, rgba(255, 230, 0, 0.05) 0%, transparent 70%)',
              pointerEvents: 'none'
            }
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            align="center"
            sx={{
              color: '#FFE600',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(255, 230, 0, 0.5)',
              mb: 3
            }}
          >
            🎯 Word Scramble Challenge
          </Typography>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {['Configure', 'Play', 'Complete'].map((label) => (
              <Step key={label}>
                <StepLabel 
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: '#FFE600',
                      '&.Mui-active': {
                        color: '#FFE600',
                        fontWeight: 'bold'
                      },
                      '&.Mui-completed': {
                        color: '#FFE600'
                      }
                    },
                    '& .MuiStepIcon-root': {
                      color: 'rgba(255, 230, 0, 0.3)',
                      '&.Mui-active': {
                        color: '#FFE600'
                      },
                      '&.Mui-completed': {
                        color: '#FFE600'
                      }
                    }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {gameState.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <CircularProgress sx={{ color: '#FFE600' }} />
            </Box>
          ) : activeStep === 0 ? (
            <Box>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: '#fff' }}>Difficulty</InputLabel>
                <Select
                  value={gameConfig.difficulty}
                  label="Difficulty"
                  onChange={handleConfigChange}
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFE600',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFE600',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFE600',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#FFE600',
                    }
                  }}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
                <FormHelperText sx={{ color: '#FFE600' }}>
                  Select the difficulty level for the game
                </FormHelperText>
              </FormControl>
              <Button
                variant="contained"
                onClick={startNewGame}
                sx={{
                  background: 'linear-gradient(45deg, #FFE600 30%, #FFD700 90%)',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(255, 230, 0, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FFD700 30%, #FFE600 90%)',
                    boxShadow: '0 6px 25px rgba(255, 230, 0, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
                fullWidth
              >
                Start Game
              </Button>
            </Box>
          ) : !gameState.gameCompleted ? (
            <Box
              sx={{
                animation: 'fadeIn 0.5s ease-in-out'
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="h6" 
                  align="center"
                  sx={{
                    color: '#FFE600',
                    mb: 1
                  }}
                >
                  Question {gameState.currentWordIndex + 1} of {gameState.words.length}
                </Typography>
                <Typography 
                  variant="h6" 
                  align="center"
                  sx={{
                    color: timeLeft <= 3 ? '#ff4444' : '#FFE600',
                    mb: 1,
                    fontWeight: timeLeft <= 3 ? 'bold' : 'normal'
                  }}
                >
                  Time Remaining: {timeLeft}s
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(timeLeft / 10) * 100} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    background: 'rgba(255, 230, 0, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: timeLeft <= 3 
                        ? 'linear-gradient(90deg, #ff4444 0%, #ff0000 100%)'
                        : 'linear-gradient(90deg, #FFE600 0%, #FFD700 100%)',
                      borderRadius: 5
                    }
                  }}
                />
              </Box>

              <Typography 
                variant="h5" 
                align="center"
                sx={{
                  color: '#fff',
                  mb: 3,
                  p: 2,
                  background: 'rgba(255, 230, 0, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 230, 0, 0.2)'
                }}
              >
                {gameState.scrambledWords[gameState.currentWordIndex]}
              </Typography>

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  name="guess"
                  label="Your Answer"
                  variant="outlined"
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#FFE600',
                      },
                      '&:hover fieldset': {
                        borderColor: '#FFE600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FFE600',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#fff',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FFE600',
                    },
                    '& .MuiOutlinedInput-input': {
                      color: '#fff',
                    }
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(45deg, #FFE600 30%, #FFD700 90%)',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(255, 230, 0, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #FFD700 30%, #FFE600 90%)',
                        boxShadow: '0 6px 25px rgba(255, 230, 0, 0.4)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Submit Guess
                  </Button>
                </Box>
              </form>
            </Box>
          ) : (
            <Box 
              textAlign="center"
              sx={{
                animation: 'fadeIn 0.5s ease-in-out'
              }}
            >
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{
                  color: '#FFE600',
                  fontWeight: 'bold',
                  textShadow: '0 0 10px rgba(255, 230, 0, 0.5)',
                  mb: 2
                }}
              >
                Game Over! 🎮
              </Typography>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{
                  color: '#fff',
                  mb: 1
                }}
              >
                Your Final Score: {gameState.score}
              </Typography>
              
              <Box 
                sx={{ 
                  mt: 4, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: 2,
                  flexWrap: 'wrap'
                }}
              >
                <Button
                  variant="contained"
                  onClick={() => navigate('/games')}
                  sx={{
                    background: 'linear-gradient(45deg, #FFE600 30%, #FFD700 90%)',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(255, 230, 0, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #FFD700 30%, #FFE600 90%)',
                      boxShadow: '0 6px 25px rgba(255, 230, 0, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Return to Games
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
      
      <Snackbar 
        open={gameState.showMessage} 
        autoHideDuration={3000} 
        onClose={() => setGameState(prev => ({ ...prev, showMessage: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setGameState(prev => ({ ...prev, showMessage: false }))} 
          severity={gameState.messageType} 
          sx={{ 
            width: '100%',
            background: gameState.messageType === 'success' 
              ? 'rgba(76, 175, 80, 0.9)' 
              : gameState.messageType === 'error'
                ? 'rgba(244, 67, 54, 0.9)'
                : 'rgba(255, 230, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            '& .MuiAlert-icon': {
              color: '#fff',
              fontSize: '1.5rem'
            }
          }}
        >
          {gameState.message}
        </Alert>
      </Snackbar>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </Container>
  );
};

export default WordScramble;