import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './Dashboard.css'; // Reusing your existing styles

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null);

  useEffect(() => {
    // 1. Get current user to highlight them on the board
    const localData = JSON.parse(localStorage.getItem('finquest_user'));
    if (localData) {
      setCurrentUserData(localData);
    }

    // 2. Fetch REAL users from Firestore
    const fetchLeaderboard = async () => {
      try {
        const usersRef = collection(db, "users");
        // Pull top 50 users sorted by highest XP
        const q = query(usersRef, orderBy("xp", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        
        const realUsers = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Only push users who actually have a profile set up
          if (data.profile && data.profile.name) {
            realUsers.push({
              id: doc.id,
              name: data.profile.name,
              status: data.profile.status,
              archetype: data.archetype?.title || 'Beginner',
              xp: data.xp || 0
            });
          }
        });
        
        setLeaderboardData(realUsers);
      } catch (error) {
        console.error("Error fetching real leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <>
      <Navbar />
      <div className="dash-container">
        <header className="dash-header">
          <div>
            <div className="dash-logo"><span>Fin<span style={{color: '#8b5cf6'}}>Quest</span> | GLOBAL LEADERBOARD</span></div>
            <div style={{ color: '#9ca3af', marginTop: '0.5rem', fontSize: '0.9rem' }}>Real-time rankings from the Firestore database.</div>
          </div>
        </header>

        <main className="dash-main" style={{ display: 'block' }}>
          <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #374151' }}>
            
            {loading ? (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Fetching live database...</div>
            ) : leaderboardData.length === 0 ? (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No users found in the database yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Header Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 100px', padding: '0.75rem 1rem', color: '#9ca3af', fontSize: '0.85rem', textTransform: 'uppercase', borderBottom: '1px solid #374151' }}>
                  <div>Rank</div>
                  <div>Player</div>
                  <div>Archetype</div>
                  <div style={{ textAlign: 'right' }}>Total XP</div>
                </div>

                {/* Real Data Rows */}
                {leaderboardData.map((user, index) => {
                  const isCurrentUser = currentUserData && currentUserData.profile.name === user.name;
                  const isStudent = user.status === 'non-earning';
                  const themeColor = isStudent ? '#10b981' : '#8b5cf6';

                  return (
                    <div 
                      key={user.id} 
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '50px 1fr 1fr 100px', 
                        padding: '1rem', 
                        backgroundColor: isCurrentUser ? `${themeColor}20` : '#030712', 
                        borderRadius: '0.5rem', 
                        border: isCurrentUser ? `1px solid ${themeColor}` : '1px solid #374151',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: index < 3 ? '#fbbf24' : '#d1d5db' }}>
                        #{index + 1}
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {user.name} {isCurrentUser && <span style={{ fontSize: '0.7rem', backgroundColor: themeColor, color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>YOU</span>}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                        {user.archetype}
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 'bold', color: themeColor }}>
                        {user.xp} XP
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
};

export default Leaderboard;