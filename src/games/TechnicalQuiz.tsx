import React, { useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
      // Try to generate questions using Gemini API
      const generatedQuestions = await generateQuestionsWithGemini(
        quizConfig.topic, 
        quizConfig.difficulty
      );
      
      if (generatedQuestions.length === 0) {
        throw new Error('No questions were generated');
      }
      
      setQuestions(generatedQuestions);
      setActiveStep(1);
    } catch (error) {
      console.error('Error starting quiz with Gemini:', error);
      
      // Set error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to connect to Gemini API';
      
      setApiError(errorMessage);
      
      // Fallback to mock questions
      setMessage(`Using fallback questions due to API error: ${errorMessage}`);
      setOpenSnackbar(true);
      
      // Use mock questions as fallback
      const mockQuestions = generateMockQuestions(quizConfig.topic);
      setQuestions(mockQuestions);
      setActiveStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(Number(event.target.value));
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowScore(true);
    }
  };

  const handleFinish = async () => {
    try {
      // Calculate percentage score
      const percentageScore = Math.round((score / questions.length) * 100);
      
      // Save score to Firebase
      if (user) {
        await updateUserScore('technicalQuiz', percentageScore);
        setMessage(`Your score of ${percentageScore}% has been saved to the leaderboard!`);
      } else {
        setMessage('You must be registered to save your score.');
      }
      
      setOpenSnackbar(true);
      
      // Navigate to games page after a delay
      setTimeout(() => {
        navigate('/games');
      }, 2000);
    } catch (error) {
      console.error('Error saving score:', error);
      setMessage('Failed to save your score. Please try again.');
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
  };

  const steps = ['Configure Quiz', 'Take Quiz', 'Results'];

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Custom Quiz
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
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
                />
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="difficulty-label">Difficulty</InputLabel>
                <Select
                  labelId="difficulty-label"
                  name="difficulty"
                  value={quizConfig.difficulty}
                  onChange={handleSelectChange}
                  label="Difficulty"
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
                <FormHelperText>Select the difficulty level of the quiz</FormHelperText>
              </FormControl>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartQuiz}
                disabled={isLoading || !quizConfig.topic}
                fullWidth
                size="large"
              >
                {isLoading ? 'Generating Questions...' : 'Start Quiz'}
              </Button>
              
              {isLoading && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography>Generating questions using AI...</Typography>
                </Box>
              )}
              
              {apiError && (
                <Alert severity="warning" sx={{ mt: 2 }}>
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

          {activeStep === 1 && !showScore && questions.length > 0 && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" align="center">
                  Question {currentQuestion + 1} of {questions.length}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={((currentQuestion + 1) / questions.length) * 100} 
                  sx={{ mt: 1, height: 10, borderRadius: 5 }}
                />
              </Box>
              
              <Typography variant="h6" gutterBottom>
                {questions[currentQuestion].question}
              </Typography>
              
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <RadioGroup value={selectedAnswer} onChange={handleAnswerSelect}>
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
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
                sx={{ mt: 2 }}
              >
                {currentQuestion + 1 === questions.length ? 'Finish' : 'Next Question'}
              </Button>
            </>
          )}

          {activeStep === 1 && showScore && (
            <Box textAlign="center">
              <Typography variant="h4" gutterBottom>
                Quiz Complete!
              </Typography>
              <Typography variant="h5" gutterBottom>
                Your score: {score} out of {questions.length}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Percentage: {Math.round((score / questions.length) * 100)}%
              </Typography>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFinish}
                >
                  Save Score & Return to Games
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
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
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TechnicalQuiz;