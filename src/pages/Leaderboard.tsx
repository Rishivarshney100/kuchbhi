import React, { useState, useEffect } from 'react';
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

const colorPalette = {
  primaryBg: '#7925D3',
  secondaryBg: '#FFE600',
  altRowBg: '#EAA1FF',
  textColor: '#000'
};

const gameTabs = ["Technical Quiz", "Tower of Hanoi", "Word Scramble"] as const;
type GameKey = 'technicalQuiz' | 'towerOfHanoi' | 'wordScramble';

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

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

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

  const fetchGameLeaderboard = async (game: GameKey): Promise<LeaderboardEntry[]> => {
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
  };

  const getGameKey = (index: number): GameKey => ['technicalQuiz', 'towerOfHanoi', 'wordScramble'][index] as GameKey;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: colorPalette.secondaryBg }}>LEADERBOARD</Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Box>

      <Paper sx={{ mt: 3, backgroundColor: colorPalette.primaryBg, borderRadius: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} centered sx={{ backgroundColor: colorPalette.secondaryBg }}>
          {gameTabs.map((tab, idx) => (
            <Tab key={idx} label={tab} sx={{ fontWeight: 'bold', color: colorPalette.textColor }} />
          ))}
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: colorPalette.secondaryBg }}>
                    <TableCell><b>NO.</b></TableCell>
                    <TableCell><b>NAME</b></TableCell>
                    <TableCell><b>POINTS</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboardData[getGameKey(tabValue)].map((entry: LeaderboardEntry, index: number) => (
                    <TableRow key={entry.id} sx={{ backgroundColor: index % 2 === 0 ? colorPalette.secondaryBg : colorPalette.altRowBg }}>
                      <TableCell>{entry.rank}</TableCell>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell>{entry.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Leaderboard;