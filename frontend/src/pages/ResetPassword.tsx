import React, { FormEvent, useMemo, useState } from 'react';
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import api from '../config/api';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!token) {
      setError('Reset token is missing. Please request a new password reset link.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
      });
      setSuccessMessage(response.data?.message || 'Password reset successful.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to reset password right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Reset Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set your new password to complete the reset.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}

            <TextField
              type="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              disabled={!!successMessage}
            />

            <TextField
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
              disabled={!!successMessage}
            />

            <Button type="submit" variant="contained" disabled={loading || !!successMessage}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>

            <Typography variant="body2" align="center">
              Return to{' '}
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

export default ResetPassword;
