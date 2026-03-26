import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import VoterLogin from './pages/VoterLogin';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import VotePage from './pages/VotePage';
import VoterWelcome from './pages/VoterWelcome';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/voter/login" element={<VoterLogin />} />
          <Route path="/voter/vote" element={<VotePage />} />
          <Route path="/e/:id" element={<VoterWelcome />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
