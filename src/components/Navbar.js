import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Grab user data to know their status and name
  const userData = JSON.parse(localStorage.getItem('finquest_user'));
  
  // If no user is logged in, don't render the navbar (failsafe)
  if (!userData) return null;

  const isStudent = userData.profile?.status === 'non-earning';
  const themeColor = isStudent ? '#10b981' : '#8b5cf6';
  const activeClass = isStudent ? 'student-active' : 'pro-active';

  const handleLogout = () => {
    // 1. Securely sign out from Firebase
    signOut(auth).then(() => {
      // 2. Clear the local storage
      localStorage.clear();
      // 3. Send them back to the landing/auth page
      navigate('/');
    }).catch((error) => {
      console.error("Logout Error:", error);
      // Fallback: clear local storage anyway if auth fails
      localStorage.clear();
      navigate('/');
    });
  };

  const handleNavHome = () => {
    navigate(isStudent ? '/student-dashboard' : '/pro-dashboard');
  };

  return (
    <nav className="navbar-container">
      {/* Brand / Logo */}
      <div className="navbar-logo" onClick={handleNavHome} style={{ cursor: 'pointer' }}>
        Fin<span style={{ color: themeColor }}>Quest</span>
      </div>

      {/* Navigation Links */}
      <div className="navbar-links">
        <span 
          className={`nav-link ${location.pathname.includes('dashboard') ? `active ${activeClass}` : ''}`}
          onClick={handleNavHome}
          style={{ cursor: 'pointer' }}
        >
          Command Center
        </span>
        <span 
          className={`nav-link ${location.pathname === '/quests' ? `active ${activeClass}` : ''}`}
          onClick={() => navigate('/quests')}
          style={{ cursor: 'pointer' }}
        >
          Quests & XP
        </span>
      </div>

      {/* User Actions */}
      <div className="navbar-user">
        <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>
          Player: <strong style={{ color: '#fff' }}>{userData.profile?.name || 'Player'}</strong>
        </span>
        <button className="nav-logout-btn" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;