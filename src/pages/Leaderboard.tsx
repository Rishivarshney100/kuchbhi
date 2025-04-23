import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack
} from '@mui/material';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import { colorPalette } from '../constants/colors';
import { gameTabs, GameKey } from '../constants/games';
import { getGameKey } from '../utils/gameUtils';

type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  rank: number;
  createdAt: Date;
};

const Leaderboard = () => {
  const { user } = useUser();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<{
    technicalQuiz: LeaderboardEntry[];
    towerOfHanoi: LeaderboardEntry[];
    wordScramble: LeaderboardEntry[];
  }>({
    technicalQuiz: [],
    towerOfHanoi: [],
    wordScramble: []
  });

  const fetchGameLeaderboard = useCallback(async (game: GameKey): Promise<LeaderboardEntry[]> => {
    const q = query(collection(db, 'users'), orderBy(`scores.${game}`, 'desc'), limit(10));
    const snapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];
    let rank = 1;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.scores && data.scores[game]) {
        entries.push({ 
          id: doc.id, 
          name: data.name, 
          score: data.scores[game], 
          rank: rank++,
          createdAt: data.createdAt.toDate()
        });
      }
    });

    // Sort entries with equal scores by creation timestamp (older profiles get higher rank)
    entries.sort((a, b) => {
      if (a.score === b.score) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      return 0; // Keep the original score-based order
    });

    // Update ranks after sorting
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }, []);

  useEffect(() => {
  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const technicalQuizData = await fetchGameLeaderboard('technicalQuiz');
      const towerOfHanoiData = await fetchGameLeaderboard('towerOfHanoi');
      const wordScrambleData = await fetchGameLeaderboard('wordScramble');
      setLeaderboardData({
        technicalQuiz: technicalQuizData,
        towerOfHanoi: towerOfHanoiData,
        wordScramble: wordScrambleData
      });
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

    fetchLeaderboardData();
  }, [fetchGameLeaderboard]);

  return (
    <Container maxWidth={false} disableGutters sx={{ backgroundColor: '#121212', minHeight: '100vh', py: 5, color: '#fff' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '0 0 10px #FFE600, 0 0 20px #FFE600, 0 0 30px #FFE600',
            mb: 2
          }}
        >
          🏆 LEADERBOARD 🏆
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
      </Box>

      <Paper sx={{ 
        backgroundColor: '#1f1f1f', 
        borderRadius: 4, 
        mx: 2,
        position: 'relative',
        overflow: 'hidden',
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
        <Tabs 
          value={tabValue} 
          onChange={(e, val) => setTabValue(val)} 
          centered 
          textColor="inherit"
          TabIndicatorProps={{ 
            style: { 
              backgroundColor: '#FFE600',
              height: '4px',
              borderRadius: '2px'
            } 
          }}
          sx={{
            '& .MuiTab-root': {
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              textTransform: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: '#FFE600',
                transform: 'translateY(-2px)'
              },
              '&.Mui-selected': {
                color: '#FFE600',
                textShadow: '0 0 10px rgba(255, 230, 0, 0.5)'
              }
            }
          }}
        >
          {gameTabs.map((tab, idx) => (
            <Tab 
              key={idx} 
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1
                }}>
                  {idx === 0 && '🧠'}
                  {idx === 1 && '🏗️'}
                  {idx === 2 && '🔤'}
                  {tab}
                </Box>
              } 
            />
          ))}
        </Tabs>

        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            p: 5,
            position: 'relative'
          }}>
            <CircularProgress 
              color="inherit" 
              sx={{
                color: '#FFE600',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }}
            />
            <Typography 
              variant="h6" 
              sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#FFE600',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255, 230, 0, 0.5)'
              }}
            >
              Loading...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Top 3 Podium */}
            <Box sx={{ 
              p: 4, 
              display: 'flex', 
              justifyContent: 'center',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at center, rgba(255, 230, 0, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none'
              }
            }}>
              <Stack 
                direction="row" 
                spacing={4} 
                alignItems="flex-end" 
                sx={{ 
                  height: '240px',
                  width: '100%',
                  maxWidth: '600px',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '20px',
                    background: 'linear-gradient(90deg, #2b2b2b 0%, #1a1a1a 50%, #2b2b2b 100%)',
                    borderRadius: '0 0 12px 12px',
                    zIndex: 1
                  }
                }}
              >
                {/* Second Place */}
                {leaderboardData[getGameKey(tabValue)][1] && (
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: '#C0C0C0', 
                        mb: 1,
                        textShadow: '0 0 10px rgba(192, 192, 192, 0.5)',
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      🥈
                    </Typography>
                    <Paper
                      elevation={8}
                      sx={{
                        width: '100%',
                        height: '160px',
                        background: 'linear-gradient(135deg, #E0E0E0 0%, #C0C0C0 50%, #A0A0A0 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px 12px 0 0',
                        p: 2,
                        boxShadow: '0 8px 32px rgba(192, 192, 192, 0.4)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                          animation: 'shine 3s infinite'
                        },
                        ...(user && leaderboardData[getGameKey(tabValue)][1].id === user.id && {
                          border: '2px solid #FF0000',
                          borderBottom: 'none'
                        })
                      }}
                    >
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: '#000', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          mb: 1,
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        {leaderboardData[getGameKey(tabValue)][1].name}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#000',
                          textAlign: 'center',
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        {leaderboardData[getGameKey(tabValue)][1].score}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* First Place */}
                {leaderboardData[getGameKey(tabValue)][0] && (
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 3
                  }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: '#FFD700', 
                        mb: 1,
                        textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      👑
                    </Typography>
                    <Paper
                      elevation={12}
                      sx={{
                        width: '100%',
                        height: '200px',
                        background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 50%, #E6A800 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px 12px 0 0',
                        p: 2,
                        boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                          animation: 'shine 3s infinite'
                        },
                        ...(user && leaderboardData[getGameKey(tabValue)][0].id === user.id && {
                          border: '2px solid #FF0000',
                          borderBottom: 'none'
                        })
                      }}
                    >
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: '#000', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          mb: 1,
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        {leaderboardData[getGameKey(tabValue)][0].name}
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: '#000',
                          textAlign: 'center',
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        {leaderboardData[getGameKey(tabValue)][0].score}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Third Place */}
                {leaderboardData[getGameKey(tabValue)][2] && (
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: '#CD7F32', 
                        mb: 1,
                        textShadow: '0 0 10px rgba(205, 127, 50, 0.5)',
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      🥉
                    </Typography>
                    <Paper
                      elevation={8}
                      sx={{
                        width: '100%',
                        height: '160px',
                        background: 'linear-gradient(135deg, #E67E22 0%, #CD7F32 50%, #B87333 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px 12px 0 0',
                        p: 2,
                        boxShadow: '0 8px 32px rgba(205, 127, 50, 0.4)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                          animation: 'shine 3s infinite'
                        },
                        ...(user && leaderboardData[getGameKey(tabValue)][2].id === user.id && {
                          border: '2px solid #FF0000',
                          borderBottom: 'none'
                        })
                      }}
                    >
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: '#000', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          mb: 1,
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        {leaderboardData[getGameKey(tabValue)][2].name}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#000',
                          textAlign: 'center',
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        {leaderboardData[getGameKey(tabValue)][2].score}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Remaining Positions Table */}
            <TableContainer sx={{ 
              px: 3, 
              py: 2,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, #FFE600, transparent)',
                opacity: 0.5
              }
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: '#292929',
                    '& th': {
                      borderBottom: '2px solid #FFE600',
                      padding: '16px'
                    }
                  }}>
                    <TableCell sx={{ 
                      color: '#FFE600', 
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}>
                      RANK
                    </TableCell>
                    <TableCell sx={{ 
                      color: '#FFE600', 
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}>
                      NAME
                    </TableCell>
                    <TableCell sx={{ 
                      color: '#FFE600', 
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}>
                      SCORE
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboardData[getGameKey(tabValue)].slice(3).map((entry, index) => (
                    <TableRow 
                      key={entry.id} 
                      sx={{ 
                        backgroundColor: index % 2 === 0 ? '#1a1a1a' : '#2b2b2b',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#333',
                          transform: 'translateX(4px)'
                        },
                        ...(user && entry.id === user.id && {
                          border: '2px solid #FF0000',
                          fontWeight: 'bold',
                          backgroundColor: 'rgba(255, 0, 0, 0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 0, 0, 0.15)'
                          }
                        })
                      }}
                    >
                      <TableCell sx={{ 
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: user && entry.id === user.id ? 'bold' : 'normal'
                      }}>
                        {index + 4}
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: user && entry.id === user.id ? 'bold' : 'normal'
                      }}>
                        {entry.name}
                        {user && entry.id === user.id && (
                          <Box 
                            component="span" 
                            sx={{ 
                              color: '#FF0000',
                              ml: 1,
                              animation: 'pulse 2s infinite'
                            }}
                          >
                            (You)
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: user && entry.id === user.id ? 'bold' : 'normal'
                      }}>
                        {entry.score}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <style>
              {`
                @keyframes pulse {
                  0% { transform: scale(1); }
                  50% { transform: scale(1.1); }
                  100% { transform: scale(1); }
                }
                @keyframes shine {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
                @keyframes glow {
                  0% { text-shadow: 0 0 10px rgba(255, 230, 0, 0.5); }
                  50% { text-shadow: 0 0 20px rgba(255, 230, 0, 0.8); }
                  100% { text-shadow: 0 0 10px rgba(255, 230, 0, 0.5); }
                }
              `}
            </style>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Leaderboard;
