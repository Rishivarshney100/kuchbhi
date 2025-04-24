import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';

type Rod = number[];
type GameState = {
  rods: Rod[];
  moves: number;
  minMoves: number;
};

const TowerOfHanoi = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [gameState, setGameState] = useState<GameState>({
    rods: [[], [], []],
    moves: 0,
    minMoves: 0
  });
  const [scoreSaved, setScoreSaved] = useState(false);

  const [draggedDisk, setDraggedDisk] = useState<{ disk: number; fromRod: number } | null>(null);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const numDisks = 3;
    const initialRod = Array.from({ length: numDisks }, (_, i) => numDisks - i);
    setGameState({
      rods: [initialRod, [], []],
      moves: 0,
      minMoves: Math.pow(2, numDisks) - 1
    });
    setDraggedDisk(null);
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

      setGameState(prev => ({
        ...prev,
        rods: newRods,
        moves: prev.moves + 1
      }));
    }

    setDraggedDisk(null);
  };

  const isGameComplete = () => gameState.rods[2].length === 3;

  const saveScore = async () => {
    if (!user || scoreSaved) return;
    
    try {
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // Calculate score out of 100
      // Perfect solution (minimum moves) = 100 points
      // Each extra move reduces score by 10 points
      // Minimum score is 10 points
      const score = Math.max(100 - Math.max(0, gameState.moves - gameState.minMoves) * 10, 10);
      
      // Only update if the new score is higher than the existing score
      if (!userData?.scores?.towerOfHanoi || score > userData.scores.towerOfHanoi) {
        await updateDoc(userRef, {
          'scores.towerOfHanoi': score
        });
      }
      
      setScoreSaved(true);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  useEffect(() => {
    if (isGameComplete() && !scoreSaved) {
      saveScore();
    }
  }, [gameState.rods]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={6} sx={{ p: 4, background: 'linear-gradient(145deg, #1f1c2c, #928dab)', color: '#fff', borderRadius: '16px' }}>
          <Typography variant="h4" align="center" gutterBottom>
            🏗️ Tower of Hanoi
          </Typography>

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

          {isGameComplete() && (
            <>
              <Typography variant="h5" align="center" gutterBottom>
                🎉 Congratulations! You solved the puzzle!
              </Typography>
              {user && scoreSaved && (
                <Typography variant="body1" align="center" sx={{ color: '#4CAF50' }}>
                  Score saved to leaderboard!
                </Typography>
              )}
              {!user && (
                <Typography variant="body1" align="center" sx={{ color: '#FFA726' }}>
                  Sign in to save your score to the leaderboard!
                </Typography>
              )}
            </>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="info"
              onClick={initializeGame}
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
        </Paper>
      </Box>
    </Container>
  );
};

export default TowerOfHanoi;