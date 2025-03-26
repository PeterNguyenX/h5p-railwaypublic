import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme, Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Components
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VideoUpload from './pages/VideoUpload';
import VideoPlayer from './pages/VideoPlayer';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import VideoEdit from './pages/VideoEdit';

// Theme configuration
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
});

const App: React.FC = observer(() => {
  return (
    <I18nextProvider i18n={i18n}>
      <ChakraProvider theme={theme}>
        <Box minH="100vh">
          <Navbar />
          <Box as="main" p={4}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <VideoUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/video/:id"
                element={
                  <ProtectedRoute>
                    <VideoPlayer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/videos/:id/edit"
                element={
                  <ProtectedRoute>
                    <VideoEdit />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
        </Box>
      </ChakraProvider>
    </I18nextProvider>
  );
});

export default App; 