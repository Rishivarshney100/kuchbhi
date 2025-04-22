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
  TableRow
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
        entries.push({ id: doc.id, name: data.name, score: data.scores[game], rank: rank++ });
      }
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

      <Paper sx={{ backgroundColor: '#1f1f1f', borderRadius: 4, mx: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, val) => setTabValue(val)} 
          centered 
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: '#FFE600' } }}
        >
          {gameTabs.map((tab, idx) => (
            <Tab 
              key={idx} 
              label={tab} 
              sx={{ color: '#fff', fontWeight: 'bold' }}
            />
          ))}
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress color="inherit" />
          </Box>
        ) : (
          <TableContainer sx={{ px: 3, py: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#292929' }}>
                  <TableCell sx={{ color: '#FFE600', fontWeight: 'bold' }}>RANK</TableCell>
                  <TableCell sx={{ color: '#FFE600', fontWeight: 'bold' }}>NAME</TableCell>
                  <TableCell sx={{ color: '#FFE600', fontWeight: 'bold' }}>SCORE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboardData[getGameKey(tabValue)].map((entry, index) => (
                  <TableRow 
                    key={entry.id} 
                    sx={{ 
                      backgroundColor: index % 2 === 0 ? '#1a1a1a' : '#2b2b2b',
                      ...(user && entry.id === user.id && {
                        border: '2px solid #FF0000',
                        fontWeight: 'bold'
                      })
                    }}
                  >
                    <TableCell sx={{ color: '#fff' }}>{entry.rank}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {entry.name}
                      {user && entry.id === user.id && ' (You)'}
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>{entry.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default Leaderboard;
