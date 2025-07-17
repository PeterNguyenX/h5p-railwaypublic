import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProjectCard from '../components/ProjectCard';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch projects from API
    fetch('/api/projects', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          setError('Unexpected API response.');
          setProjects([]);
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to load projects.');
        setProjects([]);
      });
  }, []);

  const handleCreateProject = () => {
    navigate('/create');
  };

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
          onClick={handleCreateProject}
          sx={{ mb: 4 }}
        >
          Create New Project
        </Button>
        {error && (
          <Typography color="error" align="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
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