import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = () => {
  return (
    <AppBar 
      position="static" 
      color="primary" 
      elevation={3}
      sx={{
        height: 45,
        justifyContent: 'center',
        background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 56, px: 2 }}>
        {/* Left logo + optional title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{ mr: 1, p: 0 }}
          >
            {/* <img
              src="/u.png"
              alt="Logo"
              style={{ height: 36, width: 'auto' }}
            /> */}
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1rem',
              color: 'white',
              fontWeight: 600,
              textDecoration: 'none',
            }}
            component={RouterLink}
            to="/"
          >
          </Typography>
        </Box>

        {/* Right side nav buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{ fontSize: '0.85rem', textTransform: 'none' }}
          >
            Registration
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/games"
            sx={{ fontSize: '0.85rem', textTransform: 'none' }}
          >
            Games
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/leaderboard"
            sx={{ fontSize: '0.85rem', textTransform: 'none' }}
          >
            Leaderboard
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
