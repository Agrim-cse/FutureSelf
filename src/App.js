import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Onboarding from './components/Onboarding';
import StudentDashboard from './components/StudentDashboard'; // Import Student
import ProDashboard from './components/ProDashboard';         // Import Pro

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/pro-dashboard" element={<ProDashboard />} />
        {/* You can delete the old generic /dashboard route! */}
      </Routes>
    </Router>
  );
}

export default App;