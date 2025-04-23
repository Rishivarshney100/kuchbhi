import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <Box
      sx={{
        borderBottom: '4px solid',
        borderImage: 'linear-gradient(to right, #1565c0, #42a5f5) 1',
      }}
    >
      <AppBar 
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          color: '#000000',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: { xs: 2, md: 8 }, justifyContent: 'space-between' }}>
          
          {/* Logo / Title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              edge="start"
              component={RouterLink}
              to="/"
              sx={{ mr: 1, p: 0 }}
            >
              {/* <img src="/u.png" alt="Logo" style={{ height: 36 }} /> */}
            </IconButton>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                fontWeight: 700,
                fontSize: '1.75rem',
                color: '#1565c0',
                textDecoration: 'none',
                letterSpacing: '1px',
                fontFamily: '"Segoe UI", Roboto, sans-serif',
              }}
            >
              GameZone
            </Typography>
          </Box>

          {/* Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {['Registration', 'Games', 'Leaderboard'].map((label, i) => (
              <Button
                key={label}
                variant="contained"
                component={RouterLink}
                to={i === 0 ? '/' : `/${label.toLowerCase()}`}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  backgroundColor: '#1565c0',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#0d47a1',
                  },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;