import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import useSound from 'use-sound';

type Rod = number[];
type GameState = {
  rods: Rod[];
  moves: number;
  minMoves: number;
};

const TowerOfHanoi = () => {
  const navigate = useNavigate();
  const { user, updateUserScore } = useUser();
  const [activeStep, setActiveStep] = useState(0);
  const [gameConfig, setGameConfig] = useState({ numDisks: 3 });
  const [gameState, setGameState] = useState<GameState>({
    rods: [[], [], []],
    moves: 0,
    minMoves: 0
  });
  const [draggedDisk, setDraggedDisk] = useState<{ disk: number; fromRod: number } | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [playMoveSound] = useSound('/sounds/disk_move.mp3', { volume: 0.5 });

  const handleConfigChange = (e: SelectChangeEvent<number>) => {
    setGameConfig({ ...gameConfig, numDisks: Number(e.target.value) });
  };

  const startNewGame = () => {
    const initialRod = Array.from({ length: gameConfig.numDisks }, (_, i) => gameConfig.numDisks - i);
    setGameState({
      rods: [initialRod, [], []],
      moves: 0,
      minMoves: Math.pow(2, gameConfig.numDisks) - 1
    });
    setDraggedDisk(null);
    setGameCompleted(false);
    setActiveStep(1);
  };

  const handleDragStart = (disk: number, fromRod: number) => {
    setDraggedDisk({ disk, fromRod });
  };

  const handleDrop = (toRodIndex: number) => {
    if (!draggedDisk) return;
    const { disk, fromRod } = draggedDisk;

    const sourceRod = gameState.rods[fromRod];
    const targetRod = gameState.rods[toRodIndex];

    if (sourceRod[sourceRod.length - 1] !== disk) return; 
    if (targetRod.length === 0 || disk < targetRod[targetRod.length - 1]) {
      const newRods = [...gameState.rods];
      newRods[fromRod] = sourceRod.slice(0, -1);
      newRods[toRodIndex] = [...targetRod, disk];

      const newMoves = gameState.moves + 1;
      setGameState(prev => ({
        ...prev,
        rods: newRods,
        moves: newMoves
      }));

      // Play move sound
      playMoveSound();

      // Check if game is complete
      if (toRodIndex === 2 && newRods[2].length === gameConfig.numDisks) {
        setGameCompleted(true);
        if (user) {
          const score = Math.round((gameState.minMoves / newMoves) * 100);
          updateUserScore('towerOfHanoi', score).catch(console.error);
        }
      }
    }

    setDraggedDisk(null);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={6} sx={{ p: 4, background: 'linear-gradient(145deg, #1f1c2c, #928dab)', color: '#fff', borderRadius: '16px' }}>
          <Typography variant="h4" align="center" gutterBottom>
            🏗️ Tower of Hanoi
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

          {activeStep === 0 ? (
            <Box>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: '#fff' }}>Number of Disks</InputLabel>
                <Select
                  value={gameConfig.numDisks}
                  label="Number of Disks"
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
                  <MenuItem value={3}>3 Disks</MenuItem>
                  <MenuItem value={4}>4 Disks</MenuItem>
                  <MenuItem value={5}>5 Disks</MenuItem>
                  <MenuItem value={6}>6 Disks</MenuItem>
                </Select>
                <FormHelperText sx={{ color: '#FFE600' }}>
                  Select the number of disks for the game
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
          ) : !gameCompleted ? (
            <>
              <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                Moves: {gameState.moves} (Minimum: {gameState.minMoves})
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 3,
                  mb: 3,
                  height: 300
                }}
              >
                {gameState.rods.map((rod, rodIndex) => (
                  <Box
                    key={rodIndex}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(rodIndex)}
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      borderRadius: 2,
                      p: 1,
                      background: 'rgba(255,255,255,0.05)',
                      position: 'relative'
                    }}
                  >
                    {/* Tower Rod */}
                    <Box sx={{
                      position: 'absolute',
                      top: '40px',
                      bottom: '5px',
                      width: '7px',
                      background: '#ccc',
                      borderRadius: 'px'
                    }} />

                    {/* Disks */}
                    {[...rod].reverse().map((disk, index) => (
                      <motion.div
                        key={index}
                        draggable={index === 0}
                        onDragStart={() => handleDragStart(disk, rodIndex)}
                        layout
                        style={{
                          width: `${disk * 60}px`,
                          height: '30px',
                          background: `linear-gradient(145deg, #6a11cb, #2575fc)`,
                          margin: '4px 0',
                          borderRadius: '8px',
                          zIndex: 2,
                          textAlign: 'center',
                          color: 'white',
                          cursor: index === 0 ? 'grab' : 'default',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                      </motion.div>
                    ))}
                  </Box>
                ))}
              </Box>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  color="info"
                  onClick={startNewGame}
                  sx={{ mr: 2, borderRadius: '12px', px: 4 }}
                >
                  Reset Game
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => navigate('/games')}
                  sx={{ borderRadius: '12px', px: 4 }}
                >
                  Return to Games
                </Button>
              </Box>
            </>
          ) : (
            <Box textAlign="center">
              <Typography variant="h5" gutterBottom>
                🎉 Congratulations! You solved the puzzle!
              </Typography>
              <Typography variant="h6" gutterBottom>
                Your score: {Math.round((gameState.minMoves / gameState.moves) * 100)}%
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={startNewGame}
                  sx={{ mr: 2, borderRadius: '12px', px: 4 }}
                >
                  Play Again
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/games')}
                  sx={{ borderRadius: '12px', px: 4 }}
                >
                  Return to Games
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default TowerOfHanoi;