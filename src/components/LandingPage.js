import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, ShieldCheck, Gamepad2, Flame, ArrowUp } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [topPlayers, setTopPlayers] = useState([]);

  // Smooth scroll to a specific section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Smooth scroll to the very top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for scrolling to show/hide the button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch top 3 players from Firestore
  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('xp', 'desc'), limit(3));
        const querySnapshot = await getDocs(q);
        
        const players = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.profile && data.profile.name) {
            players.push({
              id: doc.id,
              name: data.profile.name,
              xp: data.xp || 0,
              streak: data.streak || 1
            });
          }
        });
        
        setTopPlayers(players);
      } catch (error) {
        console.error('Error fetching top players:', error);
      }
    };

    fetchTopPlayers();
  }, []);

  return (
    <div className="lp-container">
      {/* Navigation Bar */}
      <nav className="lp-nav">
        <div className="lp-logo">
          <LayoutDashboard className="text-emerald" size={32} />
          <span>Fin<span className="text-emerald">Quest</span></span>
        </div>
        
        <div className="lp-nav-actions">
          <button onClick={() => scrollToSection('how-to-play')} className="lp-nav-link">
            How to Play
          </button>
          <button onClick={() => scrollToSection('leaderboard')} className="lp-nav-link">
            Leaderboard
          </button>
          <button onClick={() => navigate('/auth')} className="lp-btn-primary">
            Log In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="lp-hero">
        <h1 className="lp-title">
          Don't let your future self <br />
          <span className="text-gradient">go broke.</span>
        </h1>
        <p className="lp-subtitle">
          Cure retirement blindness. FinQuest turns compounding interest, asset allocation, and guilt-free spending into a visual game.
        </p>
        <button onClick={() => navigate('/auth')} className="lp-btn-primary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.25rem' }}>
          Start Your Quest
        </button>
      </main>

      {/* SECTION 1: Cost of Delay Banner */}
      <section className="lp-stat-banner">
        <div className="lp-stat-number">₹2.5 Crores</div>
        <p className="lp-stat-text">
          That's how much you lose by waiting until age 30 to invest just ₹5,000/month. <br />
          You aren't just spending money today—you are <span className="lp-highlight">stealing from your future</span>.
        </p>
      </section>

      {/* Feature Highlights Grid */}
      <div className="lp-features">
        <div className="lp-feature-card">
          <div className="lp-icon-wrapper"><TrendingUp size={28} className="text-emerald" /></div>
          <h3 className="lp-feature-title">Master Trajectory</h3>
          <p className="lp-feature-desc">Instantly visualize how your daily spending habits shape your total wealth by age 60.</p>
        </div>
        <div className="lp-feature-card">
          <div className="lp-icon-wrapper"><Gamepad2 size={28} className="text-emerald" /></div>
          <h3 className="lp-feature-title">Gamified Habits</h3>
          <p className="lp-feature-desc">Earn XP and climb the global leaderboard by staying in your green spending zones.</p>
        </div>
        <div className="lp-feature-card">
          <div className="lp-icon-wrapper"><ShieldCheck size={28} className="text-emerald" /></div>
          <h3 className="lp-feature-title">Crisis Simulator</h3>
          <p className="lp-feature-desc">Test your portfolio against real-world medical emergencies and market crashes.</p>
        </div>
      </div>

      {/* SECTION 2: How It Works */}
      <section id="how-to-play" className="lp-how-it-works">
        <h2 className="lp-section-title">How to Play the Game of Wealth</h2>
        <div className="lp-steps-grid">
          <div className="lp-step-card">
            <div className="lp-step-number">1</div>
            <h3 className="lp-step-title">Set Your Zones</h3>
            <p className="lp-step-desc">Use the Lifestyle Slider to lock in your guilt-free spending limit. Keep it in the Green Zone to thrive.</p>
          </div>
          <div className="lp-step-card">
            <div className="lp-step-number">2</div>
            <h3 className="lp-step-title">Equip Your Assets</h3>
            <p className="lp-step-desc">Allocate your remaining savings into the Vault, Hedge, Engine, and Wildcard to build your custom portfolio.</p>
          </div>
          <div className="lp-step-card">
            <div className="lp-step-number">3</div>
            <h3 className="lp-step-title">Level Up Daily</h3>
            <p className="lp-step-desc">Check in every day to earn XP, maintain your streak, and watch the Master Trajectory graph compound exponentially.</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Leaderboard Preview */}
      <section id="leaderboard" className="lp-leaderboard">
        <h2 className="lp-section-title">Global Top Players</h2>
        <div className="lp-lb-card">
          {topPlayers.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '1rem' }}>
              🏆 Join FinQuest to compete on the live leaderboard
            </div>
          ) : (
            <>
              <div className="lp-lb-header">
                <span style={{ color: '#9ca3af', fontWeight: '600' }}>Player</span>
                <span style={{ color: '#9ca3af', fontWeight: '600' }}>Stats</span>
              </div>
              {topPlayers.map((player, index) => (
                <div key={player.id} className="lp-lb-row">
                  <div className="lp-lb-player">
                    <span className="lp-lb-rank top">#{index + 1}</span>
                    <span>{player.name}</span>
                  </div>
                  <div className="lp-lb-stats">
                    <span className="lp-lb-xp">{player.xp.toLocaleString()} XP</span>
                    <span className="lp-lb-streak"><Flame size={16} /> {player.streak}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Scroll to Top Button */}
      <button 
        onClick={scrollToTop} 
        className={`lp-scroll-top ${showScrollTop ? 'visible' : ''}`}
        aria-label="Scroll to top"
      >
        <ArrowUp size={28} strokeWidth={3} />
      </button>

    </div>
  );
};

export default LandingPage;