import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import VoterLogin from './pages/VoterLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Settings from './pages/Settings';
import VotePage from './pages/VotePage';
import VoterWelcome from './pages/VoterWelcome';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/voter/login" element={<VoterLogin />} />
          <Route path="/voter/vote" element={<VotePage />} />
          <Route path="/e/:id" element={<VoterWelcome />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/settings" element={<ProtectedAdminRoute><Settings /></ProtectedAdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
