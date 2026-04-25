import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import ErrorBoundary from './components/ErrorBoundary';

// Import new pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Account from './pages/Account';
import Admin from './pages/Admin';

// Import new layout
import Layout from './components/layout/Layout';

// Guest redirect component
function GuestRedirect() {
  return <Navigate to="/login" replace />;
}

const App: React.FC = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<GuestRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/app" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="editor" element={<Editor />} />
            <Route path="editor/:id" element={<Editor />} />
            <Route path="account" element={<Account />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </I18nextProvider>
  );
};

export default App;