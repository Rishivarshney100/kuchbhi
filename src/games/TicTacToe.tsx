import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Paper, Typography, Button, Box, TextField, Switch, FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Sound file paths (put them in /public or import as modules if using bundler)
const clickSound = new Audio('/mausklick-82774.mp3');
const winSound = new Audio('/winning-218995.mp3');

type Player = 'X' | 'O' | null;
type Board = Player[];

const TicTacToe = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [playerNames, setPlayerNames] = useState({ X: '', O: '' });
  const [gameStarted, setGameStarted] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  const calculateWinner = (squares: Board): Player => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (index: number) => {
    if (board[index] || calculateWinner(board)) return;
    clickSound.play();

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const winner = calculateWinner(newBoard);
    if (winner) {
      winSound.play();
      setScore(prev => ({
        ...prev,
        [winner]: prev[winner] + 1
      }));
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const handleFinish = () => {
    navigate('/games');
  };

  const handleStartGame = () => {
    if (playerNames.X && playerNames.O) {
      setGameStarted(true);
    } else {
      alert('Please enter both player names.');
    }
  };

  const handleChangeName = (player: 'X' | 'O', value: string) => {
    setPlayerNames(prev => ({ ...prev, [player]: value }));
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(square => square !== null);

  // Toggle theme mode
  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setThemeMode(event.target.checked ? 'dark' : 'light');
  };

  // Create the theme
  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: themeMode === 'light' ? '#ff7e5f' : '#90caf9',
      },
      secondary: {
        main: themeMode === 'light' ? '#feb47b' : '#f44336',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 4, background: themeMode === 'light' ? 'linear-gradient(135deg, #ff7e5f, #feb47b)' : 'linear-gradient(135deg, #333, #666)' }}>
            <Typography variant="h4" gutterBottom align="center" sx={{ color: themeMode === 'light' ? '#fff' : '#000' }}>
              <SportsEsportsIcon sx={{ mr: 1 }} />
              Tic Tac Toe
            </Typography>

            {/* Theme Toggle */}
            <Box sx={{ textAlign: 'right' }}>
              <FormControlLabel
                control={<Switch checked={themeMode === 'dark'} onChange={handleThemeChange} />}
                label="Dark Mode"
              />
            </Box>

            {!gameStarted ? (
              <>
                <TextField
                  label="Player X Name"
                  fullWidth
                  margin="normal"
                  variant="filled"
                  value={playerNames.X}
                  onChange={e => handleChangeName('X', e.target.value)}
                />
                <TextField
                  label="Player O Name"
                  fullWidth
                  margin="normal"
                  variant="filled"
                  value={playerNames.O}
                  onChange={e => handleChangeName('O', e.target.value)}
                />
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button variant="contained" color="primary" onClick={handleStartGame}>
                    Start Game
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" align="center" sx={{ color: themeMode === 'light' ? '#fff' : '#000' }}>
                    <EmojiEventsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    {playerNames.X} (X): {score.X} | {playerNames.O} (O): {score.O}
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
                  {board.map((square, index) => (
                    <motion.div key={index} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outlined"
                        sx={{
                          height: '80px',
                          fontSize: '2rem',
                          border: '2px solid',
                          width: '100%',
                          background: square === 'X' ? '#4caf50' : square === 'O' ? '#f44336' : '#fff',
                          color: square ? '#fff' : '#000',
                          transition: 'all 0.2s ease-in-out',
                        }}
                        onClick={() => handleClick(index)}
                      >
                        {square}
                      </Button>
                    </motion.div>
                  ))}
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  {winner ? (
                    <Typography variant="h5" gutterBottom sx={{ color: themeMode === 'light' ? '#fff' : '#000' }}>
                      🎉 {playerNames[winner]} (Player {winner}) wins!
                    </Typography>
                  ) : isDraw ? (
                    <Typography variant="h5" gutterBottom sx={{ color: themeMode === 'light' ? '#fff' : '#000' }}>
                      It's a draw!
                    </Typography>
                  ) : (
                    <Typography variant="h5" gutterBottom sx={{ color: themeMode === 'light' ? '#fff' : '#000' }}>
                      Next turn: {isXNext ? playerNames.X : playerNames.O} ({isXNext ? 'X' : 'O'})
                    </Typography>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleReset} sx={{ mr: 1 }}>
                      Reset Game
                    </Button>
                    <Button variant="contained" color="secondary" onClick={handleFinish}>
                      Return to Games
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default TicTacToe;
