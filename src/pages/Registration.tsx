import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';

const Registration = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    age: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate mobile number format
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(formData.mobileNumber)) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }
      
      // Add user data to Firestore
      const userRef = await addDoc(collection(db, 'users'), {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        age: parseInt(formData.age),
        createdAt: new Date(),
        scores: {
          technicalQuiz: 0,
          towerOfHanoi: 0,
          wordScramble: 0
        }
      });
      
      // Set the newly registered user as the current user
      await setCurrentUser(userRef.id);
      
      // Navigate to games page on success
      navigate('/games');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Registration
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Mobile Number"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="10-digit mobile number"
              inputProps={{ maxLength: 10 }}
            />
            <TextField
              fullWidth
              label="Age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ min: 1, max: 120 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </Paper>
      </Box>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Registration; 