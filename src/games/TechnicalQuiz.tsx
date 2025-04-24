import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  Alert, 
  Snackbar,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  SelectChangeEvent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import useSound from 'use-sound'; // optional, or use native Audio

// Define question type
interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

// Function to generate questions using Gemini API
const generateQuestionsWithGemini = async (topic: string, difficulty: string): Promise<Question[]> => {
  try {
    // Replace with your actual Gemini API key
    const GEMINI_API_KEY = 'AIzaSyCpI0Dr4ZwiCfgv3LB_598oDO6eAsXkVEE';
    
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key is not set. Please add your API key to the code.');
      throw new Error('Gemini API key is not configured');
    }

    // Construct the prompt for Gemini
    const prompt = `Generate 10 multiple choice questions about ${topic} at ${difficulty} difficulty level. 
    Format the response as a JSON array of objects with the following structure:
    [
      {
        "id": 1,
        "question": "Question text here",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": 0
      }
    ]
    The correctAnswer should be the index (0-3) of the correct option.
    Make sure the questions are challenging but fair, and the options are plausible.
    Return ONLY the JSON array, no additional text.`;

    // Make the API call to Gemini using the gemini-1.5-flash model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Extract the text from the response
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    try {
      // Find the JSON array in the response (in case there's additional text)
      const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (!jsonMatch) {
        throw new Error('Could not find JSON array in response');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate the questions
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format');
      }
      
      // Ensure each question has the required properties
      const validatedQuestions = questions.map((q, index) => ({
        id: q.id || index + 1,
        question: q.question || `Question ${index + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4 
          ? q.options 
          : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < 4
          ? q.correctAnswer
          : 0
      }));
      
      return validatedQuestions;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new Error('Failed to parse questions from Gemini API');
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

// Fallback function to generate mock questions if Gemini API fails
const generateMockQuestions = (topic: string): Question[] => {
  return [
    {
      id: 1,
      question: `What is the time complexity of binary search in ${topic}?`,
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
      correctAnswer: 1
    },
    {
      id: 2,
      question: `Which of these is not a ${topic} data type?`,
      options: ['String', 'Boolean', 'Integer', 'Object'],
      correctAnswer: 2
    },
    {
      id: 3,
      question: `What does ${topic} stand for?`,
      options: [
        'Hyper Text Markup Language',
        'High Tech Modern Language',
        'Hyper Transfer Markup Language',
        'Home Tool Markup Language'
      ],
      correctAnswer: 0
    },
    {
      id: 4,
      question: `What is the main advantage of ${topic}?`,
      options: [
        'Speed',
        'Simplicity',
        'Security',
        'Scalability'
      ],
      correctAnswer: 1
    },
    {
      id: 5,
      question: `Which company developed ${topic}?`,
      options: [
        'Microsoft',
        'Google',
        'Apple',
        'IBM'
      ],
      correctAnswer: 1
    },
    {
      id: 6,
      question: `When was ${topic} first released?`,
      options: [
        '1990',
        '1995',
        '2000',
        '2005'
      ],
      correctAnswer: 1
    },
    {
      id: 7,
      question: `What is the latest version of ${topic}?`,
      options: [
        '1.0',
        '2.0',
        '3.0',
        '4.0'
      ],
      correctAnswer: 2
    },
    {
      id: 8,
      question: `Which of these is a ${topic} framework?`,
      options: [
        'Django',
        'Flask',
        'Express',
        'All of the above'
      ],
      correctAnswer: 3
    },
    {
      id: 9,
      question: `What is the primary use of ${topic}?`,
      options: [
        'Web Development',
        'Mobile Development',
        'Desktop Development',
        'All of the above'
      ],
      correctAnswer: 3
    },
    {
      id: 10,
      question: `Which language is ${topic} written in?`,
      options: [
        'Java',
        'Python',
        'C++',
        'JavaScript'
      ],
      correctAnswer: 1
    }
  ];
};

const TechnicalQuiz = () => {
  const navigate = useNavigate();
  const { user, updateUserScore } = useUser();
  const [activeStep, setActiveStep] = useState(0);
  const [quizConfig, setQuizConfig] = useState({
    topic: '',
    difficulty: 'medium'
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [message, setMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [perfectScoreSound] = useSound('/sounds/perfect_score.mp3', { volume: 0.8 });
  const [timerSound, { stop: stopTimerSound }] = useSound('/sounds/tictictic.mp3', { volume: 0.5 });
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds timer
  const [timerActive, setTimerActive] = useState(true); // New state to control timer activity

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuizConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setQuizConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartQuiz = async () => {
    if (!quizConfig.topic) {
      setMessage('Please select a topic');
      setOpenSnackbar(true);
      return;
    }

    setIsLoading(true);
    setApiError(null);
    
    try {
      // Generate questions using Gemini API
      const generatedQuestions = await generateQuestionsWithGemini(
        quizConfig.topic, 
        quizConfig.difficulty
      );
      
      if (generatedQuestions.length === 0) {
        throw new Error('No questions were generated');
      }
      
      setQuestions(generatedQuestions);
      setActiveStep(1);
      setTimeLeft(10); // Reset timer when starting quiz
      timerSound(); // Play timer sound when starting quiz
    } catch (error) {
      console.error('Error starting quiz with Gemini:', error);
      
      // Set error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to connect to Gemini API';
      
      setApiError(errorMessage);
      setMessage(`Failed to generate questions: ${errorMessage}`);
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(Number(event.target.value));
    setTimerActive(false); // Stop the timer when an answer is selected
    // Don't stop the timer sound when an answer is selected
  };

  const handleNextQuestion = () => {
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
      setMessage('Correct! +10 point!');
      setMessageType('success');
    } else {
      setMessage(`Incorrect! The correct answer was: ${questions[currentQuestion].options[questions[currentQuestion].correctAnswer]}`);
      setMessageType('error');
    }
    
    setOpenSnackbar(true);
    stopTimerSound(); // Stop the timer sound when moving to next question

    // Delay moving to the next question to allow the user to see the notification
    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTimeLeft(10); // Reset timer for next question
        setTimerActive(true); // Reactivate the timer for the next question
        timerSound(); // Play timer sound for next question
      } else {
        setShowScore(true);
        // Play perfect score sound if user got all questions right
        if (score + 1 === questions.length) {
          perfectScoreSound();
        }
      }
    }, 1500);
  };

  // Add useEffect for timer countdown
  useEffect(() => {
    if (activeStep === 1 && !showScore && timeLeft > 0 && timerActive) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showScore) {
      // Time's up, move to next question
      setMessage('Time\'s up! Moving to next question.');
      setMessageType('info');
      setOpenSnackbar(true);
      stopTimerSound(); // Stop the timer sound when time runs out
      
      setTimeout(() => {
        if (currentQuestion + 1 < questions.length) {
          setCurrentQuestion(currentQuestion + 1);
          setSelectedAnswer(null);
          // Don't reset timer or play sound here - only when next button is clicked
        } else {
          setShowScore(true);
        }
      }, 1500);
    }
  }, [timeLeft, activeStep, showScore, currentQuestion, questions.length, timerSound, stopTimerSound, timerActive]);

  const handleFinish = async () => {
    try {
      // Calculate percentage score
      const percentageScore = Math.round((score / questions.length) * 100);
      
      // Save score to Firebase
      if (user) {
        await updateUserScore('technicalQuiz', percentageScore);
        setMessage(`Congratulations, Your score has been saved to the leaderboard!`);
        setMessageType('success');
      } else {
        setMessage('You must be registered to save your score.');
        setMessageType('warning');
      }
      
      setOpenSnackbar(true);
      stopTimerSound(); // Stop the timer sound when finishing the quiz
      
      // Navigate to games page after a delay
      setTimeout(() => {
        navigate('/games');
      }, 2000);
    } catch (error) {
      console.error('Error saving score:', error);
      setMessage('Failed to save your score. Please try again.');
      setMessageType('error');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleReset = () => {
    setActiveStep(0);
    setQuizConfig({
      topic: '',
      difficulty: 'medium'
    });
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowScore(false);
    setApiError(null);
    setTimeLeft(10); // Reset timer
    setTimerActive(true); // Reset timer activity
    stopTimerSound(); // Stop the timer sound when resetting
  };

  const steps = ['Configure Quiz', 'Take Quiz', 'Results'];

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
            Technical Quiz Challenge
          </Typography>

          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: 4,
              '& .MuiStepLabel-root .Mui-completed': {
                color: '#FFE600',
              },
              '& .MuiStepLabel-root .Mui-active': {
                color: '#FFE600',
              },
              '& .MuiStepLabel-label': {
                color: '#fff',
                '&.Mui-completed': {
                  color: '#FFE600',
                },
                '&.Mui-active': {
                  color: '#FFE600',
                  fontWeight: 'bold'
                }
              }
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box
              sx={{
                animation: 'fadeIn 0.5s ease-in-out'
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  color: '#FFE600',
                  mb: 3,
                  textAlign: 'center'
                }}
              >
                Configure Your Quiz
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label="Topic"
                  name="topic"
                  value={quizConfig.topic}
                  onChange={handleTextChange}
                  required
                  helperText="Enter a topic for your quiz (e.g., JavaScript, Python, React)"
                  sx={{
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
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#FFE600',
                    }
                  }}
                />
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="difficulty-label" sx={{ color: '#fff' }}>Difficulty</InputLabel>
                <Select
                  labelId="difficulty-label"
                  name="difficulty"
                  value={quizConfig.difficulty}
                  onChange={handleSelectChange}
                  label="Difficulty"
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
                  Select the difficulty level of the quiz
                </FormHelperText>
              </FormControl>
              
              <Button
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
                  },
                  '&:disabled': {
                    background: '#666',
                    color: '#999'
                  }
                }}
                onClick={handleStartQuiz}
                disabled={isLoading || !quizConfig.topic}
                fullWidth
                size="large"
              >
                {isLoading ? 'Generating Questions...' : 'Start Quiz'}
              </Button>
              
              {isLoading && (
                <Box 
                  sx={{ 
                    mt: 3, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2
                  }}
                >
                  <CircularProgress 
                    size={32} 
                    sx={{ 
                      color: '#FFE600',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round'
                      }
                    }} 
                  />
                  <Typography sx={{ color: '#FFE600' }}>
                    Generating questions...
                  </Typography>
                </Box>
              )}
              
              {apiError && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mt: 2,
                    background: 'rgba(255, 230, 0, 0.1)',
                    border: '1px solid rgba(255, 230, 0, 0.3)',
                    color: '#FFE600'
                  }}
                >
                  <Typography variant="body2">
                    Note: Using fallback questions because {apiError}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    To use Gemini API, add your API key to the code.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {activeStep === 1 && !showScore && (
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
                  Question {currentQuestion + 1} of {questions.length}
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
                variant="h6" 
                gutterBottom
                sx={{
                  color: '#fff',
                  mb: 3,
                  p: 2,
                  background: 'rgba(255, 230, 0, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 230, 0, 0.2)'
                }}
              >
                {questions[currentQuestion].question}
              </Typography>
              
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <RadioGroup 
                  value={selectedAnswer} 
                  onChange={handleAnswerSelect}
                  sx={{
                    '& .MuiFormControlLabel-root': {
                      margin: '8px 0',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 230, 0, 0.1)',
                        transform: 'translateX(4px)'
                      },
                      '&.Mui-checked': {
                        background: 'rgba(255, 230, 0, 0.2)',
                        border: '1px solid rgba(255, 230, 0, 0.3)'
                      }
                    },
                    '& .MuiRadio-root': {
                      color: '#FFE600',
                      '&.Mui-checked': {
                        color: '#FFE600'
                      }
                    },
                    '& .MuiTypography-root': {
                      color: '#fff'
                    }
                  }}
                >
                  {questions[currentQuestion].options.map((option: string, index: number) => (
                    <FormControlLabel
                      key={index}
                      value={index}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                marginTop: '-40px', // Negative margin to pull the button up
                marginRight: '16px' // Align with the radio options padding
              }}>
                <Button
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(45deg, #FFE600 30%, #FFD700 90%)',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    padding: '8px 16px', // Reduced padding for more compact look
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(255, 230, 0, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #FFD700 30%, #FFE600 90%)',
                      boxShadow: '0 6px 25px rgba(255, 230, 0, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': {
                      background: '#666',
                      color: '#999'
                    }
                  }}
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null}
                >
                  {currentQuestion + 1 === questions.length ? 'Finish' : 'Next Question'}
                </Button>
              </Box>
            </Box>
          )}

          {showScore && (
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
                Quiz Complete! 🎉
              </Typography>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{
                  color: '#fff',
                  mb: 1
                }}
              >
                Your score: {score} out of {questions.length}
              </Typography>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  color: '#FFE600',
                  mb: 3
                }}
              >
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
                  onClick={handleFinish}
                >
                  Save Score & Return to Games
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    color: '#FFE600',
                    borderColor: '#FFE600',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    '&:hover': {
                      background: 'rgba(255, 230, 0, 0.1)',
                      borderColor: '#FFD700',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={handleReset}
                >
                  Take Another Quiz
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={messageType} 
          sx={{ 
            width: '100%',
            background: messageType === 'success' 
              ? 'rgba(76, 175, 80, 0.9)' 
              : messageType === 'error'
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
          {message}
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

export default TechnicalQuiz;