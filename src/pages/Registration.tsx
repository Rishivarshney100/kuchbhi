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
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(formData.mobileNumber)) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

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

      await setCurrentUser(userRef.id);
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
    <Container maxWidth="xs">
      <Box sx={{ mt: 2 }}>
        <Paper elevation={3} sx={{ p: 2, maxHeight: '90vh', overflow: 'auto' }}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Registration
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="dense"
              required
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="dense"
              required
            />
            <TextField
              fullWidth
              label="Mobile Number"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              margin="dense"
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
              margin="dense"
              required
              inputProps={{ min: 1, max: 120 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="medium"
              sx={{ mt: 2 }}
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