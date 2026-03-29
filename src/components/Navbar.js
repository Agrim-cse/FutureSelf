import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Grab user data to know their status and name
  const userData = JSON.parse(localStorage.getItem('finquest_user'));
  
  // If no user is logged in, don't render the navbar (failsafe)
  if (!userData) return null;

  const isStudent = userData.profile?.status === 'non-earning';
  const themeColor = isStudent ? '#10b981' : '#8b5cf6';
  const activeClass = isStudent ? 'student-active' : 'pro-active';

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
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

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
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
        <span 
          className={`nav-link ${location.pathname === '/leaderboard' ? `active ${activeClass}` : ''}`}
          onClick={() => navigate('/leaderboard')}
          style={{ cursor: 'pointer' }}
        >
          Leaderboard
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '1rem', padding: '2rem',
            maxWidth: '400px', width: '90%'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f3f4f6' }}>Confirm Logout</h3>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              Are you sure you want to log out? Your progress is safely saved.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={cancelLogout} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancel
              </button>
              <button onClick={confirmLogout} style={{ flex: 1, padding: '0.75rem', backgroundColor: themeColor, color: isStudent ? '#030712' : '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;