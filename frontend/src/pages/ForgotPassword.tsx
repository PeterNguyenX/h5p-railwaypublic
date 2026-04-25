import React, { FormEvent, useState } from 'react';
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../config/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccessMessage(
        response.data?.message ||
          'If the account exists, a password reset email has been sent.'
      );
      setEmail('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to submit reset request right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your account email and we will send a reset link.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}

            <TextField
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />

            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <Typography variant="body2" align="center">
              Back to{' '}
              <RouterLink to="/login">
                Login
              </RouterLink>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
