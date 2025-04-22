import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {/* Left side logo */}
          <img
            src="u.png"
            alt="Logo"
            style={{ height: 50, marginRight: 10 }}
          />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            style={{ textDecoration: 'none', color: 'white', fontWeight: 'bold' }}
          >
            {/* Empty for now */}
          </Typography>
        </Box>

        

        {/* Right side buttons */}
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