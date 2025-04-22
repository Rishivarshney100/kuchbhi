import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          IQ Games
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Registration
          </Button>
          <Button color="inherit" component={RouterLink} to="/games">
            Games
          </Button>
          <Button color="inherit" component={RouterLink} to="/leaderboard">
            Leaderboard
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 