import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isLogin) {
      // If they are an existing user logging in, skip the quiz and go to the game.
      navigate('/dashboard'); 
    } else {
      // If they are a brand new user signing up, send them to character creation.
      navigate('/onboarding'); 
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        <div className="auth-header">
          <div className="auth-logo">
            <span>Fin<span className="text-emerald">Quest</span></span>
          </div>
          <p className="auth-subtitle">
            {isLogin ? 'Welcome back, Player 1.' : 'Create your account and start your quest.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          
          {!isLogin && (
            <div className="auth-input-group">
              <label className="auth-label">Username</label>
              <input type="text" className="auth-input" placeholder="Enter your gamer tag" required />
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">Email</label>
            <input type="email" className="auth-input" placeholder="you@example.com" required />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input type="password" className="auth-input" placeholder="••••••••" required />
          </div>

          <button type="submit" className="auth-btn">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "New here?" : "Already a member?"}
          <button 
            type="button" 
            className="auth-toggle-link" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Create Account' : 'Back to Login'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;