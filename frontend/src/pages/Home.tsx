import React from 'react';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          {t('home.title')}
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          {t('home.subtitle')}
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mt: 4 }}
        >
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            size="large"
          >
            {t('auth.login')}
          </Button>
          <Button
            component={RouterLink}
            to="/register"
            variant="outlined"
            size="large"
          >
            {t('auth.register')}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default Home; 