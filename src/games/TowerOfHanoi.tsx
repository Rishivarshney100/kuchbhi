import React, { useState, useEffect, useRef } from 'react';
import { Container, Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

type Rod = number[];
type GameState = {
  rods: Rod[];
  moves: number;
  minMoves: number;
};

const TowerOfHanoi = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>({
    rods: [[], [], []],
    moves: 0,
    minMoves: 0
  });

  const [draggedDisk, setDraggedDisk] = useState<{ disk: number; fromRod: number } | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const diskRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    setTouchPosition(null);
  };

  const handleTouchStart = (e: React.TouchEvent, disk: number, fromRod: number, index: number) => {
    const touch = e.touches[0];
    const diskElement = diskRefs.current[index];
    if (!diskElement) return;

    const rect = diskElement.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;

    setTouchPosition({ x: offsetX, y: offsetY });
    setDraggedDisk({ disk, fromRod });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedDisk || !touchPosition) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent, toRodIndex: number) => {
    if (!draggedDisk) return;
    
    const targetRod = gameState.rods[toRodIndex];
    const { disk, fromRod } = draggedDisk;
    const sourceRod = gameState.rods[fromRod];

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
    setTouchPosition(null);
  };

  const isGameComplete = () => gameState.rods[2].length === 3;

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
              height: 300,
              position: 'relative'
            }}
          >
            {gameState.rods.map((rod, rodIndex) => (
              <Box
                key={rodIndex}
                onTouchEnd={(e) => handleTouchEnd(e, rodIndex)}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  borderRadius: 2,
                  p: 1,
                  background: 'rgba(255,255,255,0.05)',
                  position: 'relative',
                  touchAction: 'none'
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
                <AnimatePresence>
                  {[...rod].reverse().map((disk, index) => (
                    <motion.div
                      key={`${rodIndex}-${disk}`}
                      ref={(el) => {
                        if (el) {
                          diskRefs.current[index] = el;
                        }
                      }}
                      onTouchStart={(e) => handleTouchStart(e, disk, rodIndex, index)}
                      onTouchMove={handleTouchMove}
                      layout
                      initial={{ scale: 1 }}
                      whileTap={{ scale: 1.1 }}
                      style={{
                        width: `${disk * 60}px`,
                        height: '30px',
                        background: `linear-gradient(145deg, #6a11cb, #2575fc)`,
                        margin: '4px 0',
                        borderRadius: '8px',
                        zIndex: 2,
                        textAlign: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                        touchAction: 'none',
                        position: 'relative'
                      }}
                    >
                      {draggedDisk?.disk === disk && touchPosition && (
                        <motion.div
                          style={{
                            position: 'absolute',
                            top: touchPosition.y,
                            left: touchPosition.x,
                            width: '10px',
                            height: '10px',
                            background: 'red',
                            borderRadius: '50%'
                          }}
                          animate={{
                            x: [0, 5, 0, -5, 0],
                            y: [0, -5, 0, 5, 0]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity
                          }}
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            ))}
          </Box>

          {isGameComplete() && (
            <Typography variant="h5" align="center" gutterBottom>
              🎉 Congratulations! You solved the puzzle!
            </Typography>
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