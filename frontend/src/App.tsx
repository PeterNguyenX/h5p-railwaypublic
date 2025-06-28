import React from 'react';
import { ThemeProvider, createTheme, Box, CssBaseline } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VideoUpload from './pages/VideoUpload';
import VideoEdit from './pages/VideoEdit';
import VideoPlayer from './pages/VideoPlayer';
import VideoTest from './pages/VideoTest';
import VideoDebug from './pages/VideoDebug';
import HLSTest from './pages/HLSTest';
import FinalTest from './pages/FinalTest';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import WordPressIntegration from './components/WordPressIntegration';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18nextProvider i18n={i18n}>
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <Box component="main" sx={{ flex: 1, py: 3 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <PrivateRoute>
                    <VideoUpload />
                  </PrivateRoute>
                }
              />
              <Route
                path="/videos/:id/edit"
                element={
                  <PrivateRoute>
                    <VideoEdit />
                  </PrivateRoute>
                }
              />
              <Route
                path="/videos/:id"
                element={
                  <PrivateRoute>
                    <VideoPlayer />
                  </PrivateRoute>
                }
              />
              <Route path="/edit/:id" element={<VideoEdit />} />
              <Route path="/test" element={<VideoTest />} />
              <Route path="/debug" element={<VideoDebug />} />
              <Route path="/hls-test" element={<HLSTest />} />
              <Route path="/final" element={<FinalTest />} />
              <Route 
                path="/wordpress" 
                element={
                  <PrivateRoute>
                    <WordPressIntegration />
                  </PrivateRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
        </Box>
      </I18nextProvider>
    </ThemeProvider>
  );
};

export default App;