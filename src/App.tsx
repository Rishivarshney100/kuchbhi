import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import LogoBetween from './components/LogoBetween';
import Registration from './pages/Registration';
import Games from './pages/Games';
import Leaderboard from './pages/Leaderboard';
import TechnicalQuiz from './games/TechnicalQuiz';
import TicTacToe from './games/TicTacToe';
import TowerOfHanoi from './games/TowerOfHanoi';
import WordScramble from './games/WordScramble';
import { UserProvider } from './context/UserContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <LogoBetween />
                  <Registration />
                </>
              }
            />
            <Route path="/games" element={<Games />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/games/technical-quiz" element={<TechnicalQuiz />} />
            <Route path="/games/tic-tac-toe" element={<TicTacToe />} />
            <Route path="/games/tower-of-hanoi" element={<TowerOfHanoi />} />
            <Route path="/games/word-scramble" element={<WordScramble />} />
          </Routes>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;