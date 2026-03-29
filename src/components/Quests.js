import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './Quests.css';

const Quests = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  
  // Gamification State
  const [currentXp, setCurrentXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [claimedAchievements, setClaimedAchievements] = useState([]);
  const [todaysLedger, setTodaysLedger] = useState([]);

  // Quiz Engine State
  const [activeLesson, setActiveLesson] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('finquest_user'));
    if (!data) {
      navigate('/onboarding');
      return;
    }
    
    // Streak Logic (Requires 10 days for 1.2x boost)
    const today = new Date().toDateString();
    let userStreak = data.streak || 1;
    let lastActive = data.lastActive || today;

    if (lastActive !== today) {
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActive === yesterday.toDateString()) userStreak += 1; 
      else userStreak = 1; 
    }

    const updatedData = { ...data, streak: userStreak, lastActive: today };
    localStorage.setItem('finquest_user', JSON.stringify(updatedData));
    
    setUserData(updatedData);
    setCurrentXp(updatedData.xp || 0);
    setStreak(userStreak);
    setCompletedQuests(updatedData.completedQuests || []);
    setClaimedAchievements(updatedData.claimedAchievements || []);

    // Fetch ledger for verification
    const isStudent = data.profile.status === 'non-earning';
    const dbKey = isStudent ? `db_student_${data.profile.name}` : `db_${data.profile.name}`;
    const savedDb = JSON.parse(localStorage.getItem(dbKey));
    if (savedDb && savedDb.ledger) {
      const todayStr = new Date().toLocaleDateString();
      setTodaysLedger(savedDb.ledger.filter(tx => tx.date.startsWith(todayStr)));
    }
  }, [navigate]);

  if (!userData) return <div className="quest-container">Loading Quest Board...</div>;

  const isStudent = userData.profile.status === 'non-earning';
  const themeClass = isStudent ? 'student' : 'pro';
  const themeColor = isStudent ? '#10b981' : '#8b5cf6';
  const xpMultiplier = streak >= 10 ? 1.2 : 1;

  // --- QUEST VERIFICATION LOGIC ---
  const hasLoggedToday = todaysLedger.length > 0;
  const hasSavedToday = todaysLedger.some(tx => tx.category === 'save');
  const hasInvestedToday = todaysLedger.some(tx => tx.category === 'invest');
  const hasZeroLifestyle = hasLoggedToday && !todaysLedger.some(tx => tx.category === 'lifestyle');

  // ==========================================
  // 🎓 STUDENT CONTENT POOL
  // ==========================================
  const studentDailyQuests = [
    { id: 'sd1', title: "Daily Tracker", desc: "Log at least one transaction in your dashboard today.", baseXp: 50, isVerified: hasLoggedToday },
    { id: 'sd2', title: "Stash Your Change", desc: "Log a 'Save' transaction to your emergency buffer.", baseXp: 100, isVerified: hasSavedToday },
    { id: 'sd3', title: "Zero Lifestyle Spend", desc: "Log transactions today without any 'Lifestyle' expenses.", baseXp: 75, isVerified: hasZeroLifestyle }
  ];

  const studentLearningModules = [
    { 
      id: 'slm1', title: "The 50/30/20 Rule for Allowances", readTime: "2 Min Read", maxXp: 300,
      content: "Even if you only get a small allowance, the habit of splitting it matters. 50% goes to Survival (food, rent, transport). 30% goes to Guilt-Free spending (movies, subscriptions). 20% MUST go to your Stash (savings). Building this muscle now makes managing a salary later effortless.",
      questions: [
        { q: "Under the 50/30/20 rule, what is the 20% reserved for?", options: ["Guilt-free spending", "Savings and the Stash", "Survival needs"], correct: 1 },
        { q: "Why use this rule while still a student?", options: ["To build the behavioral habit early", "Because banks require it", "To impress your professors"], correct: 0 }
      ]
    },
    { 
      id: 'slm2', title: "What is an Emergency Buffer?", readTime: "3 Min Read", maxXp: 400,
      content: "An emergency buffer is cash you do NOT touch unless there is a crisis (laptop breaks, medical bill). For a student, a good buffer is ₹10,000 to ₹15,000. It prevents you from taking on high-interest bad debt (like credit cards or loan apps) when things go wrong.",
      questions: [
        { q: "What is the primary purpose of an emergency buffer?", options: ["To buy the latest iPhone", "To invest in the stock market", "To prevent taking on bad debt during a crisis"], correct: 2 },
        { q: "Is a weekend trip to Goa considered an emergency?", options: ["Yes", "No"], correct: 1 }
      ]
    }
  ];

  const studentAchievements = [
    { id: 'sach1', title: "Bronze Saver", desc: "Accumulate your first 1,000 XP.", reqXp: 1000, rewardXp: 500, icon: "🥉" },
    { id: 'sach2', title: "Campus Scholar", desc: "Reach 5,000 total XP.", reqXp: 5000, rewardXp: 1500, icon: "🎓" },
    { id: 'sach3', title: "Habit Builder", desc: "Maintain a 10-Day Login Streak.", reqStreak: 10, rewardXp: 1000, icon: "🔥" }
  ];

  const studentQuotes = [
    { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
    { text: "The habit of saving is itself an education.", author: "Frances Willard" },
    { text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" }
  ];

  const studentHeadlines = [
    ["5 High-Paying Side Hustles for College Students in 2026", "Why Companies Look at Personal Projects Over GPAs", "The Rise of Zero-Fee Brokerage Accounts for Gen Z"],
    ["Student Loan Interest Rates Expected to Freeze Next Quarter", "How to Build an Emergency Fund on a ₹5,000 Allowance", "The Best Entry-Level Tech Jobs Post-AI Boom"],
    ["Budget Travel: How Gen Z is Seeing the World for Cheap", "Top 3 High-Yield Savings Accounts for Students", "Is Buying a Car in College a Financial Mistake?"]
  ];

  // ==========================================
  // 💼 PRO CONTENT POOL
  // ==========================================
  const proDailyQuests = [
    { id: 'pd1', title: "Daily Tracker", desc: "Log at least one cash flow transaction today.", baseXp: 50, isVerified: hasLoggedToday },
    { id: 'pd2', title: "Deploy Capital", desc: "Log an 'Invest' transaction into Equity, Debt, or Gold.", baseXp: 150, isVerified: hasInvestedToday },
    { id: 'pd3', title: "Zero Lifestyle Spend", desc: "Log expenses today without any 'Lifestyle' drain.", baseXp: 100, isVerified: hasZeroLifestyle }
  ];

  const proLearningModules = [
    { 
      id: 'plm1', title: "The 8th Wonder: Compounding", readTime: "2 Min Read", maxXp: 400,
      content: "Compound interest is the addition of interest to the principal sum of a deposit. It is the result of reinvesting interest, rather than paying it out. By starting at age 20 instead of 30, your money has twice as many doubling cycles.",
      questions: [
        { q: "What is the core mechanic of compound interest?", options: ["Earning interest on principal only", "Earning interest on previously earned interest", "A guaranteed bank fee reduction"], correct: 1 },
        { q: "Why is starting early mathematically better?", options: ["Banks give younger people better rates", "You get more doubling cycles over time", "Inflation doesn't affect young people"], correct: 1 }
      ]
    },
    { 
      id: 'plm2', title: "Asset Allocation 101", readTime: "3 Min Read", maxXp: 400,
      content: "Never put all your eggs in one basket. Equity (Stocks) provides aggressive growth to beat inflation. Debt (Bonds/FDs) provides safety during market crashes. Gold is a hedge against currency devaluation. A strong portfolio balances all three based on your age.",
      questions: [
        { q: "What is the primary purpose of Debt in a portfolio?", options: ["Aggressive growth", "Safety during market crashes", "Tax evasion"], correct: 1 },
        { q: "Which asset class is best used to aggressively beat inflation over 20 years?", options: ["Gold", "Debt", "Equity"], correct: 2 }
      ]
    }
  ];

  const proAchievements = [
    { id: 'pach1', title: "Bronze Earner", desc: "Accumulate your first 1,000 XP.", reqXp: 1000, rewardXp: 500, icon: "🥉" },
    { id: 'pach2', title: "Market Master", desc: "Reach 5,000 total XP.", reqXp: 5000, rewardXp: 1500, icon: "📈" },
    { id: 'pach3', title: "Discipline", desc: "Maintain a 10-Day Login Streak.", reqStreak: 10, rewardXp: 1000, icon: "🔥" }
  ];

  const proQuotes = [
    { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
    { text: "Wealth is not about having a lot of money; it's about having a lot of options.", author: "Chris Rock" },
    { text: "How many millionaires do you know who have become wealthy by investing in savings accounts? I rest my case.", author: "Robert G. Allen" }
  ];

  const proHeadlines = [
    ["NIFTY 50 Hits New Highs Driven by Tech Sectors", "Tax Optimization: Maximizing Section 80C and Beyond", "Real Estate vs. Index Funds in 2026"],
    ["Fed Interest Rate Cuts: What it Means for Debt Markets", "The Hidden Costs of Lifestyle Creep at ₹1L+/Month", "Why Gold is Rallying Amidst Global Tensions"],
    ["Early Retirement Trends: How Millennials are Hitting FIRE", "Top 5 Performing Mutual Funds This Quarter", "Navigating the New Capital Gains Tax Laws"]
  ];

  // --- ASSIGN ACTIVE POOLS based on user type ---
  const dailyQuests = isStudent ? studentDailyQuests : proDailyQuests;
  const learningModules = isStudent ? studentLearningModules : proLearningModules;
  const achievements = isStudent ? studentAchievements : proAchievements;
  
  const dayIndex = new Date().getDay() % 3; 
  const activeQuote = isStudent ? studentQuotes[dayIndex] : proQuotes[dayIndex];
  const activeHeadlines = isStudent ? studentHeadlines[dayIndex] : proHeadlines[dayIndex];

  // --- HANDLERS ---
  const handleClaimDaily = (quest) => {
    if (completedQuests.includes(quest.id) || !quest.isVerified) return;
    const finalXp = Math.floor(quest.baseXp * xpMultiplier);
    const newXpTotal = currentXp + finalXp;
    const newCompleted = [...completedQuests, quest.id];
    setCurrentXp(newXpTotal);
    setCompletedQuests(newCompleted);
    const updatedData = { ...userData, xp: newXpTotal, completedQuests: newCompleted };
    localStorage.setItem('finquest_user', JSON.stringify(updatedData));
    setUserData(updatedData);
  };

  const handleClaimAchievement = (ach) => {
    if (claimedAchievements.includes(ach.id)) return;
    if (ach.reqXp && currentXp < ach.reqXp) return;
    if (ach.reqStreak && streak < ach.reqStreak) return;
    const newXpTotal = currentXp + ach.rewardXp;
    const newClaimed = [...claimedAchievements, ach.id];
    setCurrentXp(newXpTotal);
    setClaimedAchievements(newClaimed);
    const updatedData = { ...userData, xp: newXpTotal, claimedAchievements: newClaimed };
    localStorage.setItem('finquest_user', JSON.stringify(updatedData));
    setUserData(updatedData);
  };

  // --- QUIZ LOGIC ---
  const openQuiz = (lesson) => {
    setActiveLesson(lesson);
    setQuizAnswers({});
  };

  const handleOptionSelect = (qIndex, oIndex) => {
    setQuizAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
  };

  const submitQuiz = () => {
    let score = 0;
    activeLesson.questions.forEach((q, index) => {
      if (quizAnswers[index] === q.correct) score += 1;
    });

    const percentage = score / activeLesson.questions.length;
    const earnedXp = Math.floor((activeLesson.maxXp * percentage) * xpMultiplier);
    const finalXp = earnedXp === 0 ? 50 : earnedXp; 

    const newXpTotal = currentXp + finalXp;
    const newCompleted = [...completedQuests, activeLesson.id];

    setCurrentXp(newXpTotal);
    setCompletedQuests(newCompleted);
    
    const updatedData = { ...userData, xp: newXpTotal, completedQuests: newCompleted };
    localStorage.setItem('finquest_user', JSON.stringify(updatedData));
    setUserData(updatedData);
    
    alert(`Quiz Complete! Score: ${score}/${activeLesson.questions.length}. Earned: +${finalXp} XP`);
    setActiveLesson(null);
  };

  return (
    <>
      <Navbar />
      <div className="quest-container">
        <main className="quest-main">
          
          <div className="quest-header" style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1>Guild Quests & XP</h1>
                <p>Player: <strong style={{ color: themeColor}}>{userData.profile.name}</strong> | Rank: {userData.archetype.title}</p>
              </div>
              <div style={{ textAlign: 'right', backgroundColor: '#111827', padding: '1rem 1.5rem', borderRadius: '1rem', border: `1px solid ${streak >= 10 ? '#fbbf24' : '#374151'}` }}>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Streak</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: streak >= 10 ? '#fbbf24' : '#f3f4f6' }}>🔥 {streak} {streak === 1 ? 'Day' : 'Days'}</div>
                {streak >= 10 ? <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>1.2x XP Multiplier Active!</div> : <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{10 - streak} days to unlock 1.2x XP</div>}
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', height: '12px', background: '#1f2937', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (currentXp / 5000) * 100)}%`, height: '100%', background: themeColor, transition: 'width 0.5s ease' }}></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.5rem' }}>Total XP: <strong style={{color: '#fff'}}>{currentXp}</strong> / 5000 to Next Rank</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            
            <div className="quest-section" style={{ animation: 'fadeIn 0.4s' }}>
              <h2 className="quest-section-title">⏱️ Daily Bounties</h2>
              {dailyQuests.map(quest => {
                const isDone = completedQuests.includes(quest.id);
                return (
                  <div key={quest.id} className={`quest-card ${isDone ? 'completed' : ''}`} style={{ borderLeft: quest.isVerified && !isDone ? `4px solid ${themeColor}` : '' }}>
                    <div className="quest-info">
                      <h4>{quest.title}</h4>
                      <p>{quest.desc}</p>
                    </div>
                    <button className={`claim-btn ${quest.isVerified && !isDone ? themeClass : ''}`} onClick={() => handleClaimDaily(quest)} disabled={isDone || !quest.isVerified} style={{ background: !quest.isVerified && !isDone ? '#1f2937' : '', color: !quest.isVerified && !isDone ? '#6b7280' : '' }}>
                      {isDone ? 'Claimed' : (quest.isVerified ? `Claim +${Math.floor(quest.baseXp * xpMultiplier)}` : `Incomplete`)}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="quest-section" style={{ animation: 'fadeIn 0.5s' }}>
              <h2 className="quest-section-title">🏆 Lifetime Achievements</h2>
              {achievements.map(ach => {
                const isDone = claimedAchievements.includes(ach.id);
                const isUnlocked = (ach.reqXp ? currentXp >= ach.reqXp : true) && (ach.reqStreak ? streak >= ach.reqStreak : true);
                return (
                  <div key={ach.id} className={`quest-card ${isDone ? 'completed' : ''}`} style={{ borderLeft: isUnlocked && !isDone ? '4px solid #fbbf24' : '' }}>
                    <div className="quest-info" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '2rem' }}>{ach.icon}</div>
                      <div><h4>{ach.title}</h4><p>{ach.desc}</p></div>
                    </div>
                    <button className={`claim-btn ${isUnlocked && !isDone ? 'student' : ''}`} onClick={() => handleClaimAchievement(ach)} disabled={isDone || !isUnlocked} style={{ background: isUnlocked && !isDone ? '#fbbf24' : '', color: isUnlocked && !isDone ? '#000' : '', border: isUnlocked && !isDone ? 'none' : '' }}>
                      {isDone ? 'Earned' : (isUnlocked ? `Claim +${ach.rewardXp}` : `Locked`)}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* FIXED OVERFLOW COL 3: NEW DAILY INSIGHTS WIDGET */}
            <div className="quest-section" style={{ animation: 'fadeIn 0.55s' }}>
              <h2 className="quest-section-title">📰 Daily Insights</h2>
              <div className="quest-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem', backgroundColor: 'transparent', border: 'none', padding: '0' }}>
                
                <div style={{ width: '100%', boxSizing: 'border-box', padding: '1.25rem', backgroundColor: `${themeColor}15`, borderRadius: '0.75rem', borderLeft: `4px solid ${themeColor}` }}>
                  <p style={{ fontStyle: 'italic', color: '#e5e7eb', marginBottom: '0.75rem', lineHeight: '1.5' }}>"{activeQuote.text}"</p>
                  <p style={{ fontSize: '0.85rem', color: themeColor, fontWeight: 'bold' }}>— {activeQuote.author}</p>
                </div>

                <div style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#030712', border: '1px solid #374151', borderRadius: '0.75rem', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Top News Today</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activeHeadlines.map((headline, idx) => (
                      <li key={idx} style={{ fontSize: '0.9rem', color: '#d1d5db', display: 'flex', gap: '0.75rem', lineHeight: '1.4' }}>
                        <span style={{ color: themeColor, marginTop: '2px' }}>●</span> {headline}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>

            <div className="quest-section" style={{ animation: 'fadeIn 0.6s', gridColumn: '1 / -1' }}>
              <h2 className="quest-section-title">📚 Knowledge Library (One-Time)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {learningModules.map(lesson => {
                  const isDone = completedQuests.includes(lesson.id);
                  return (
                    <div key={lesson.id} className={`quest-card ${isDone ? 'completed' : ''}`}>
                      <div className="quest-info">
                        <h4>{lesson.title}</h4>
                        <p style={{ color: themeColor, fontWeight: 'bold', fontSize: '0.8rem', marginTop: '4px' }}>{lesson.readTime}</p>
                      </div>
                      <button className="claim-btn" onClick={() => openQuiz(lesson)} disabled={isDone} style={{ background: isDone ? '#1f2937' : themeColor, color: isDone ? '#6b7280' : '#030712', border: 'none' }}>
                        {isDone ? 'Mastered' : `Start (Up to +${lesson.maxXp})`}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </main>
      </div>

      {activeLesson && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setActiveLesson(null)}>×</button>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f3f4f6' }}>{activeLesson.title}</h2>
            
            <div className="article-content" style={{ borderLeftColor: themeColor }}>
              {activeLesson.content}
            </div>

            <div className="quiz-section">
              <h3>Knowledge Check</h3>
              {activeLesson.questions.map((q, qIndex) => (
                <div key={qIndex} className="quiz-question">
                  <p>{qIndex + 1}. {q.q}</p>
                  <div className="quiz-options">
                    {q.options.map((opt, oIndex) => (
                      <button 
                        key={oIndex} 
                        className={`quiz-option ${quizAnswers[qIndex] === oIndex ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect(qIndex, oIndex)}
                        style={quizAnswers[qIndex] === oIndex ? { backgroundColor: `${themeColor}20`, borderColor: themeColor, color: themeColor, fontWeight: 'bold' } : {}}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button 
                className="submit-quiz-btn"
                disabled={Object.keys(quizAnswers).length < activeLesson.questions.length}
                onClick={submitQuiz}
                style={{ backgroundColor: Object.keys(quizAnswers).length < activeLesson.questions.length ? '#374151' : themeColor, color: Object.keys(quizAnswers).length < activeLesson.questions.length ? '#9ca3af' : '#030712' }}
              >
                Submit Answers
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Quests;