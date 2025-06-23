import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProjectCard from '../components/ProjectCard';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch projects from API
    fetch('/api/projects', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(setProjects);
  }, []);

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
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          My H5P Projects
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/create')}
          sx={{ mb: 4 }}
        >
          Create New Project
        </Button>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              title={project.title}
              thumbnail={project.thumbnail_url}
              onEdit={() => navigate(`/edit/${project.id}`)}
              onDelete={() => {/* TODO: implement delete */}}
              onExport={() => {/* TODO: implement export */}}
            />
          ))}
        </div>
      </Box>
    </Container>
  );
};

export default Home;