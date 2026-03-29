import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
// --- SURGICAL DATABASE IMPORTS ---
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './Quests.css';

const Quests = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  
  // Gamification State
  const [currentXp, setCurrentXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [todayCompletedQuests, setTodayCompletedQuests] = useState([]);
  const [claimedAchievements, setClaimedAchievements] = useState([]);
  const [todaysLedger, setTodaysLedger] = useState([]);
  const [lastQuestsResetDate, setLastQuestsResetDate] = useState(null);

  // Quiz Engine State
  const [activeLesson, setActiveLesson] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  
  // Daily Insights State
  const [newsArticles, setNewsArticles] = useState([]);
  const [marketData, setMarketData] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('finquest_user'));
    if (!data) {
      navigate('/auth'); // Updated to /auth for safety
      return;
    }
    
    const today = new Date().toDateString();
    const lastResetDate = data.lastQuestsResetDate || today;
    
    // Reset daily quests if it's a new day
    let todaysQuests = data.todayCompletedQuests || [];
    if (lastResetDate !== today) {
      todaysQuests = [];
    }
    
    // Streak Logic (Requires 10 days for 1.2x boost)
    let userStreak = data.streak || 1;
    let lastActive = data.lastActive || today;

    if (lastActive !== today) {
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActive === yesterday.toDateString()) userStreak += 1; 
      else userStreak = 1; 
    }

    const updatedData = { ...data, streak: userStreak, lastActive: today, lastQuestsResetDate: today, todayCompletedQuests: todaysQuests };
    localStorage.setItem('finquest_user', JSON.stringify(updatedData));
    
    setUserData(updatedData);
    setCurrentXp(updatedData.xp || 0);
    setStreak(userStreak);
    setTodayCompletedQuests(todaysQuests);
    setCompletedQuests(updatedData.completedQuests || []);
    setClaimedAchievements(updatedData.claimedAchievements || []);
    setLastQuestsResetDate(today);

    // Fetch ledger for REAL-TIME verification (No random data)
    const isStudent = data.profile.status === 'non-earning';
    const dbKey = isStudent ? `db_student_${data.profile.name}` : `db_${data.profile.name}`;
    const savedDb = JSON.parse(localStorage.getItem(dbKey));
    
    if (savedDb && savedDb.ledger && Array.isArray(savedDb.ledger)) {
      const todayStr = new Date().toLocaleDateString();
      // Filters only transactions made today - exact date match with toLocaleDateString()
      setTodaysLedger(savedDb.ledger.filter(tx => {
        if (!tx || !tx.date) return false;
        return String(tx.date).includes(todayStr) || String(tx.date).startsWith(todayStr) || String(tx.date) === todayStr;
      }));
    } else {
      setTodaysLedger([]);
    }
  }, [navigate]);

  // --- DAILY ROTATING QUOTES (Date-based, no API) ---
  const studentQuotesArray = [
    { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
    { text: "The habit of saving is itself an education.", author: "Frances Willard" },
    { text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
    { text: "Money is a tool. It helps you take care of the people you love.", author: "Suze Orman" },
    { text: "Financial peace isn't the acquisition of stuff. It's peace of mind.", author: "Dave Ramsey" },
    { text: "The poor pay more because they have less to spend.", author: "Malcolm Gladwell" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "A budget is telling your money where to go instead of wondering where it went.", author: "John C. Maxwell" },
    { text: "Financial peace isn't the acquisition of stuff. It's peace of mind.", author: "Benjamin Franklin" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Don't just make money, make a difference.", author: "Oprah Winfrey" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }
  ];

  const proQuotesArray = [
    { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
    { text: "Wealth is not about having a lot of money; it's about having a lot of options.", author: "Chris Rock" },
    { text: "How many millionaires do you know who have become wealthy by investing in savings accounts? I rest my case.", author: "Robert G. Allen" },
    { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
    { text: "Compound interest is the eighth wonder of the world. He who understands it, earns it.", author: "Albert Einstein" },
    { text: "Diversification is the only free lunch in investing.", author: "Harry Markowitz" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Money is a terrible master but an excellent servant.", author: "Phineas Taylor Barnum" },
    { text: "It is not how much money you make, but how much you keep.", author: "Robert Kiyosaki" },
    { text: "If you don't find a way to make money while you sleep, you will work until you die.", author: "Warren Buffett" },
    { text: "Success is having the freedom to spend your days the way you want.", author: "Charlie Munger" },
    { text: "The richest people focus on scaling their income.", author: "Tim Ferriss" },
    { text: "Compound returns over decades built all legendary investor fortunes.", author: "Charlie Munger" },
    { text: "Time is your greatest asset in investing.", author: "Benjamin Graham" }
  ];

  // Fallback News Headlines
  const fallbackNews = [
    "RBI Signals Potential Rate Cuts Amid Inflation Moderation",
    "Top Tech Stocks Rally as Earnings Beat Expectations",
    "Startup Ecosystem Sees Record Funding Despite Global Slowdown"
  ];

  // --- FETCH LIVE NEWS (Top 3 articles) ---
  // Using NewsData.io API for Indian Finance News
  // Free Tier: 100 requests/day
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const apiKey = process.env.REACT_APP_NEWSDATA_API;
        const response = await fetch(
          `https://newsdata.io/api/1/news?country=in&category=business&apikey=${apiKey}`
        );
        if (response.status === 401) {
          console.warn('Invalid NewsData API key - using fallback news');
          setNewsArticles(fallbackNews);
          return;
        }
        if (!response.ok) throw new Error('News fetch failed');
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const headlines = data.results.slice(0, 3).map(article => article.title);
          setNewsArticles(headlines);
        } else {
          setNewsArticles(fallbackNews);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setNewsArticles(fallbackNews);
      }
    };
    
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- LIVE MARKET DATA (Static Values - March 29, 2026) ---
  useEffect(() => {
    // Current market values - hardcoded (updated March 29, 2026)
    const currentMarketData = [
      { symbol: 'NIFTY', name: 'NIFTY 50', value: 22819.60, change: -2.09 },
      { symbol: 'SENSEX', name: 'BSE SENSEX', value: 73583.22, change: -2.25 },
      { symbol: 'GOLD', name: 'Gold (per 10g)', value: 150350, change: -0.18 },
      { symbol: 'INR', name: 'USD/INR', value: 94.84, change: 0.52 }
    ];

    setMarketData(currentMarketData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // --- SURGICAL CLOUD SYNC HOOK ---
  useEffect(() => {
    const syncToCloud = async () => {
      const user = auth.currentUser;
      if (user && userData) {
        const questState = {
          xp: currentXp,
          streak: streak,
          completedQuests,
          todayCompletedQuests,
          claimedAchievements,
          lastActive: new Date().toDateString(),
          lastQuestsResetDate: lastQuestsResetDate || new Date().toDateString()
        };
        // Sync to Firebase
        await setDoc(doc(db, "users", user.uid), questState, { merge: true })
          .catch(err => console.error("Quest Sync Error:", err));
      }
    };
    if (userData) syncToCloud();
  }, [currentXp, completedQuests, todayCompletedQuests, claimedAchievements, streak, userData, lastQuestsResetDate]);

  if (!userData) return <div className="quest-container">Loading Quest Board...</div>;

  const isStudent = userData.profile.status === 'non-earning';
  const themeClass = isStudent ? 'student' : 'pro';
  const themeColor = isStudent ? '#10b981' : '#8b5cf6';
  
  // XP Multiplier: 1.0 base, +0.2 for every 10 days (10=1.2, 20=1.4, 30=1.6, etc.)
  const xpMultiplier = 1 + (Math.floor(streak / 10) * 0.2);

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

  // --- ASSIGN ACTIVE POOLS based on user type ---
  const dailyQuests = isStudent ? studentDailyQuests : proDailyQuests;
  const learningModules = isStudent ? studentLearningModules : proLearningModules;
  const achievements = isStudent ? studentAchievements : proAchievements;
  
  // Date-based rotation: changes every day automatically
  const quoteIndex = new Date().getDate() % (isStudent ? studentQuotesArray.length : proQuotesArray.length);
  const activeQuote = isStudent ? studentQuotesArray[quoteIndex] : proQuotesArray[quoteIndex];
  
  // Use fetched news or fallback
  const activeHeadlines = newsArticles.length > 0 ? newsArticles : fallbackNews;

  // --- HANDLERS ---
  const handleClaimDaily = (quest) => {
    if (todayCompletedQuests.includes(quest.id) || !quest.isVerified) return;
    const finalXp = Math.floor(quest.baseXp * xpMultiplier);
    const newXpTotal = currentXp + finalXp;
    const newTodayCompleted = [...todayCompletedQuests, quest.id];
    setCurrentXp(newXpTotal);
    setTodayCompletedQuests(newTodayCompleted);
    const updatedData = { ...userData, xp: newXpTotal, todayCompletedQuests: newTodayCompleted };
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
    
    alert(`Quiz Complete! Score: ${score}/${activeLesson.questions.length}. Earned: +${finalXp} XP (${xpMultiplier.toFixed(1)}x multiplier)`);
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
                {userData && (() => {
                  const tierNameMap = {
                    'The Thrill Seeker': 'The Spark',
                    'The Grinder': 'The Guardian',
                    'The Prodigy': 'The Navigator',
                    'The HENRY (High Earner, Not Rich Yet)': 'The Climber',
                    'The Safety Netter': 'The Conservator',
                    'The Architect': 'The Visionary'
                  };
                  const mappedTitle = tierNameMap[userData.archetype.title] || userData.archetype.title;
                  return <p>Player: <strong style={{ color: themeColor}}>{userData.profile.name}</strong> | Rank: {mappedTitle}</p>;
                })()}
              </div>
              <div style={{ textAlign: 'right', backgroundColor: '#111827', padding: '1rem 1.5rem', borderRadius: '1rem', border: `1px solid ${streak >= 10 ? '#fbbf24' : '#374151'}` }}>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Streak</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: streak >= 10 ? '#fbbf24' : '#f3f4f6' }}>🔥 {streak} {streak === 1 ? 'Day' : 'Days'}</div>
                {streak >= 10 ? <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>{xpMultiplier.toFixed(1)}x XP Multiplier Active!</div> : <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{10 - streak} days to unlock 1.2x XP</div>}
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', height: '12px', background: '#1f2937', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (currentXp / 5000) * 100)}%`, height: '100%', background: themeColor, transition: 'width 0.5s ease' }}></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.5rem' }}>Total XP: <strong style={{color: '#fff'}}>{currentXp}</strong> / 5000 to Next Rank</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            
            <div className="quest-section" style={{ animation: 'fadeIn 0.4s', display: 'flex', flexDirection: 'column' }}>
              <h2 className="quest-section-title">⏱️ Daily Bounties</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {dailyQuests.map(quest => {
                  const isDone = todayCompletedQuests.includes(quest.id);
                  return (
                    <div key={quest.id} className={`quest-card ${isDone ? 'completed' : ''}`} style={{ borderLeft: quest.isVerified && !isDone ? `4px solid ${themeColor}` : '', padding: '1rem', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div className="quest-info" style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{quest.title}</h4>
                        <p style={{ margin: '0', fontSize: '0.9rem', color: '#9ca3af' }}>{quest.desc}</p>
                      </div>
                      <button className={`claim-btn ${quest.isVerified && !isDone ? themeClass : ''}`} onClick={() => handleClaimDaily(quest)} disabled={isDone || !quest.isVerified} style={{ background: !quest.isVerified && !isDone ? '#1f2937' : '', color: !quest.isVerified && !isDone ? '#6b7280' : '', marginTop: '1rem' }}>
                        {isDone ? 'Claimed' : (quest.isVerified ? `Claim +${Math.floor(quest.baseXp * xpMultiplier)}` : `Incomplete`)}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="quest-section" style={{ animation: 'fadeIn 0.5s', display: 'flex', flexDirection: 'column' }}>
              <h2 className="quest-section-title">🏆 Lifetime Achievements</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {achievements.map(ach => {
                  const isDone = claimedAchievements.includes(ach.id);
                  const isUnlocked = (ach.reqXp ? currentXp >= ach.reqXp : true) && (ach.reqStreak ? streak >= ach.reqStreak : true);
                  return (
                    <div key={ach.id} className={`quest-card ${isDone ? 'completed' : ''}`} style={{ borderLeft: isUnlocked && !isDone ? '4px solid #fbbf24' : '', padding: '1rem', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div className="quest-info" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1 }}>
                        <div style={{ fontSize: '2rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem' }}>{ach.icon}</div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>{ach.title}</h4>
                          <p style={{ margin: '0', fontSize: '0.9rem', color: '#9ca3af' }}>{ach.desc}</p>
                        </div>
                      </div>
                      <button className={`claim-btn ${isUnlocked && !isDone ? 'student' : ''}`} onClick={() => handleClaimAchievement(ach)} disabled={isDone || !isUnlocked} style={{ background: isUnlocked && !isDone ? '#fbbf24' : '', color: isUnlocked && !isDone ? '#000' : '', border: isUnlocked && !isDone ? 'none' : '', marginTop: '1rem' }}>
                        {isDone ? 'Earned' : (isUnlocked ? `Claim +${ach.rewardXp}` : `Locked`)}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="quest-section" style={{ animation: 'fadeIn 0.55s' }}>
              <h2 className="quest-section-title">📰 Daily Insights</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontStyle: 'italic', color: '#e5e7eb', marginBottom: '0.75rem', lineHeight: '1.5', margin: '0 0 0.75rem 0' }}>"{activeQuote.text}"</p>
                  <p style={{ fontSize: '0.85rem', color: themeColor, fontWeight: 'bold', margin: 0 }}>— {activeQuote.author}</p>
                </div>

                <div style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', padding: '1rem', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px', margin: '0 0 1rem 0' }}>Top News Today</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {activeHeadlines.map((headline, idx) => (
                      <li key={idx} style={{ fontSize: '0.85rem', color: '#d1d5db', display: 'flex', gap: '0.75rem', lineHeight: '1.4', margin: 0 }}>
                        <span style={{ color: themeColor, marginTop: '2px', flexShrink: 0 }}>●</span> <span>{headline}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', padding: '1rem', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px', margin: '0 0 1rem 0' }}>Live Markets</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {marketData.map((asset, idx) => {
                      const changeColor = asset.change >= 0 ? '#10b981' : '#ef4444';
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#d1d5db', paddingBottom: '0.75rem', borderBottom: idx < marketData.length - 1 ? '1px solid #374151' : 'none' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 'bold', color: '#f3f4f6' }}>{asset.symbol}</span>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{asset.name}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                            <span style={{ fontWeight: 'bold', color: '#f3f4f6' }}>{asset.value.toLocaleString()}</span>
                            <span style={{ fontSize: '0.75rem', color: changeColor, fontWeight: 'bold' }}>
                              {asset.change >= 0 ? '+' : ''}{asset.change}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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