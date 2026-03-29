import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // <-- NEW: Added auth import

const Onboarding = () => {
  const navigate = useNavigate();
  
  // Phase 0: Personal Stats, Phase 1: Quiz, Phase 2: Reveal
  const [phase, setPhase] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  
  // Base Stats (Added specific fields for Students vs Pros)
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    status: '', // 'non-earning' or 'earning'
    income: '',
    savings: '',
    academicYear: '', // Student only
    gradYear: '',     // Student only
    retireAge: ''     // Pro only
  });

  // Track the traits: Option A = YOLO, Option B = Survivor, Option C = Optimizer
  const [traits, setTraits] = useState({ yolo: 0, survivor: 0, optimizer: 0 });
  const [archetype, setArchetype] = useState(null);

  // --- THE NON-EARNING (STUDENT/ALLOWANCE) QUESTIONS ---
  const nonEarningQuestions = [
    {
      title: "The Month-End Squeeze",
      subtitle: "It’s the 25th of the month and you only have ₹800 left. What’s the play?",
      options: [
        { text: "Order Zomato tonight. I'll figure out how to survive later.", trait: "yolo" },
        { text: "Freeze all spending. Eat whatever is in the hostel/house until the 1st.", trait: "survivor" },
        { text: "Pull from my emergency buffer. That's why I built it.", trait: "optimizer" }
      ]
    },
    {
      title: "The Windfall",
      subtitle: "Relatives give you ₹5,000 for a festival. Honest reaction?",
      options: [
        { text: "Finally, I can buy those sneakers I wanted.", trait: "yolo" },
        { text: "Put half in the bank, use half for the weekend.", trait: "survivor" },
        { text: "Straight into an FD or mutual fund. Let it grow.", trait: "optimizer" }
      ]
    },
    {
      title: "The Broken Tech",
      subtitle: "Your phone screen shatters. It costs ₹4,000 to fix.",
      options: [
        { text: "Beg parents for cash or borrow from a friend.", trait: "yolo" },
        { text: "Drain my entire bank account to fix it.", trait: "survivor" },
        { text: "Use my savings stash, that's what it's there for.", trait: "optimizer" }
      ]
    },
    {
      title: "The FOMO Trip",
      subtitle: "Friends are planning a Goa trip, but you're broke.",
      options: [
        { text: "Borrow money. You only live once, right?", trait: "yolo" },
        { text: "Go, but aggressively budget and eat instant noodles the whole time.", trait: "survivor" },
        { text: "Skip it. My financial peace is more important right now.", trait: "optimizer" }
      ]
    },
    {
      title: "The Leftovers",
      subtitle: "It's the end of the month and you actually have ₹2,000 left over.",
      options: [
        { text: "Treat myself to a nice dinner. I earned it.", trait: "yolo" },
        { text: "Leave it in my checking account for next month.", trait: "survivor" },
        { text: "Move it immediately to a separate savings/investment account.", trait: "optimizer" }
      ]
    },
    {
      title: "Subscription Audit",
      subtitle: "How do you handle Netflix, Spotify, Amazon Prime, etc?",
      options: [
        { text: "I pay for all of them. I need my entertainment.", trait: "yolo" },
        { text: "I share passwords with 5 different people to split costs.", trait: "survivor" },
        { text: "I only subscribe to one at a time and rotate them.", trait: "optimizer" }
      ]
    },
    {
      title: "The Horizon",
      subtitle: "When you hear the word 'Retirement' or 'Investing', you think...",
      options: [
        { text: "Bro, I’m just trying to pass my exams right now.", trait: "yolo" },
        { text: "I’ll start thinking about that when I get a real salary.", trait: "survivor" },
        { text: "Compound interest starts now. Time is my biggest asset.", trait: "optimizer" }
      ]
    }
  ];

  // --- THE EARNING (PRO/SALARY) QUESTIONS ---
  const earningQuestions = [
    {
      title: "The Salary Hike",
      subtitle: "You just got a solid 20% salary bump. Immediate move?",
      options: [
        { text: "Upgrade time! Better apartment, new phone, better lifestyle.", trait: "yolo" },
        { text: "Keep living the same, let the extra cash sit in my savings account.", trait: "survivor" },
        { text: "Automate the extra 20% directly into my investments.", trait: "optimizer" }
      ]
    },
    {
      title: "The Market Drop",
      subtitle: "The stock market drops 10% in a week. Your portfolio is bleeding red.",
      options: [
        { text: "Panic sell everything before it goes to zero.", trait: "yolo" },
        { text: "Pause my SIPs (investments) until the market recovers.", trait: "survivor" },
        { text: "Do nothing, or buy more on a discount. I'm here for the long game.", trait: "optimizer" }
      ]
    },
    {
      title: "The Big Purchase",
      subtitle: "Your laptop dies and a replacement costs ₹60,000.",
      options: [
        { text: "Swipe the credit card and just pay the minimums for now.", trait: "yolo" },
        { text: "Take a No-Cost EMI so my bank balance doesn't drop to zero.", trait: "survivor" },
        { text: "Pay for it outright using my emergency fund.", trait: "optimizer" }
      ]
    },
    {
      title: "Tax Season Squeeze",
      subtitle: "It's March. How are you handling tax saving (80C, etc.)?",
      options: [
        { text: "I don't. Taxes are too confusing, let them just deduct it.", trait: "yolo" },
        { text: "Scramble at the last minute to dump money into a PPF.", trait: "survivor" },
        { text: "It's already done. My tax-saving SIPs run automatically all year.", trait: "optimizer" }
      ]
    },
    {
      title: "The Peer Pressure Dinner",
      subtitle: "Colleagues want to split a ₹10,000 dinner bill evenly, but you only ate a ₹500 salad.",
      options: [
        { text: "Just pay my share to avoid looking cheap.", trait: "yolo" },
        { text: "Awkwardly ask to only pay for what I ate.", trait: "survivor" },
        { text: "Suggest a more affordable place beforehand, or budget for networking.", trait: "optimizer" }
      ]
    },
    {
      title: "The Bonus Check",
      subtitle: "You get a ₹50,000 year-end performance bonus.",
      options: [
        { text: "Downpayment on a car or an international trip.", trait: "yolo" },
        { text: "Put it towards paying off a loan or credit card debt.", trait: "survivor" },
        { text: "Max out my investment accounts for the year.", trait: "optimizer" }
      ]
    },
    {
      title: "The Endgame",
      subtitle: "What is your ultimate financial goal?",
      options: [
        { text: "Make enough to buy everything I want right now.", trait: "yolo" },
        { text: "Save enough so I can retire at 60 without stressing.", trait: "survivor" },
        { text: "Achieve Financial Independence (FIRE) so working becomes optional.", trait: "optimizer" }
      ]
    }
  ];

  const currentQuestions = profile.status === 'non-earning' ? nonEarningQuestions : earningQuestions;

  // --- LOGIC HANDLERS ---
  
  const isProfileComplete = () => {
    if (!profile.name || !profile.age || !profile.status || !profile.income || !profile.savings) return false;
    if (profile.status === 'non-earning' && (!profile.academicYear || !profile.gradYear)) return false;
    if (profile.status === 'earning' && !profile.retireAge) return false;
    return true;
  };

  const handleProfileSubmit = () => {
    setPhase(1); 
  };

  const handleAnswer = (selectedTrait) => {
    const updatedTraits = { ...traits, [selectedTrait]: traits[selectedTrait] + 1 };
    setTraits(updatedTraits);

    if (quizStep < currentQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      determineArchetype(updatedTraits);
    }
  };

  const determineArchetype = (finalTraits) => {
    const dominantTrait = Object.keys(finalTraits).reduce((a, b) => finalTraits[a] > finalTraits[b] ? a : b);
    const incomeNum = Number(profile.income);
    
    let result = { title: "", description: "", analysis: [], incomeTier: "" };

    if (profile.status === 'non-earning') {
      result.incomeTier = incomeNum > 15000 ? "High Allowance" : "Standard Allowance";
      
      if (dominantTrait === 'yolo') {
        result.title = "The Thrill Seeker";
        result.description = "You are living for today, but your future self is entirely unprotected.";
        result.analysis = [
          "⚠️ High impulse spending, low emergency preparedness.",
          "⚠️ You rely heavily on others (parents/friends) when things go wrong.",
          "✅ Fix: Build a 1-month emergency buffer immediately so you can afford your lifestyle safely."
        ];
      } else if (dominantTrait === 'survivor') {
        result.title = "The Grinder";
        result.description = "You have iron discipline, but you are playing completely on defense.";
        result.analysis = [
          "⚠️ Excellent at surviving on a budget, but terrified of spending.",
          "⚠️ Leaving cash idle means inflation is slowly eating your purchasing power.",
          "✅ Fix: Transition from hoarding cash to making your first low-risk investment."
        ];
      } else {
        result.title = "The Prodigy";
        result.description = "Your financial habits are flawless. You understand the math.";
        result.analysis = [
          "✅ Optimized spending and an eye for compounding.",
          "⚠️ Over-optimizing small amounts of money instead of focusing on increasing your income.",
          "✅ Fix: Maintain the system, automate the habits, and prepare for when your income scales."
        ];
      }
    } else {
      result.incomeTier = incomeNum > 60000 ? "High Earner" : "Scaling Earner";
      
      if (dominantTrait === 'yolo') {
        result.title = "The HENRY (High Earner, Not Rich Yet)";
        result.description = "You make real adult money, but lifestyle creep is eating every rupee.";
        result.analysis = [
          "⚠️ Your spending rises exactly as fast as your income.",
          "⚠️ You look rich, but you are one medical emergency away from debt.",
          "✅ Fix: Cap your 'Fun Money' and automate 20% of your income into investments before you see it."
        ];
      } else if (dominantTrait === 'survivor') {
        result.title = "The Safety Netter";
        result.description = "You save diligently, but you are afraid to let your money work for you.";
        result.analysis = [
          "⚠️ High cash reserves, low market participation.",
          "⚠️ You are losing 6% of your wealth every year to inflation.",
          "✅ Fix: Deploy your idle cash into a diversified 'Engine' portfolio to outpace inflation."
        ];
      } else {
        result.title = "The Architect";
        result.description = "Cold, calculating, and fully optimized. Welcome to the command center.";
        result.analysis = [
          "✅ You understand asset allocation and long-term compounding.",
          "⚠️ Emotional panic during sudden market crashes.",
          "✅ Fix: Use FinQuest to stress-test your portfolio against historical crises."
        ];
      }
    }

    setArchetype(result);
    setPhase(2); 
  };

  // --- NEW: FULLY AUTHENTICATED FIREBASE PUSH ---
  const finishOnboarding = async () => {
    // 1. Get current Authenticated User
    const user = auth.currentUser;
    // Fallback ID just in case they refreshed the page before Firebase Auth fully loaded
    const secureId = user ? user.uid : profile.name.replace(/\s+/g, '_'); 
    const actualEmail = user ? user.email : "guest@finquest.app";

    const actualSavings = Number(profile.savings) || 0;
    
    // 2. Build the core profile object
    const userData = {
      uid: secureId,
      email: actualEmail,
      profile, 
      archetype,
      xp: 0,
      streak: 1,
      lastActive: new Date().toDateString(),
      completedQuests: [],
      claimedAchievements: []
    };

    // 3. Build a REALISTIC starting database based on their actual inputs
    let realisticDbState = {};
    if (profile.status === 'earning') {
      realisticDbState = {
        expenses: { housing: 0, food: 0, lifestyle: 0, health: 0 },
        portfolio: { equity: actualSavings * 0.6, debt: actualSavings * 0.3, gold: actualSavings * 0.1 },
        liabilities: [],
        ledger: []
      };
    } else {
      realisticDbState = {
        currentPeriodData: { essentials: 0, lifestyle: 0, academic: 0, save: 0 },
        loans: [],
        ledger: [],
        manualStashAdj: 0
      };
    }

    // 4. Save to Local Storage (keeps app lightning fast)
    localStorage.setItem('finquest_user', JSON.stringify(userData));
    const dbKey = profile.status === 'earning' ? `db_${profile.name}` : `db_student_${profile.name}`;
    localStorage.setItem(dbKey, JSON.stringify(realisticDbState));

    // 5. Secure Cloud Backup to Firebase using their UID
    try {
      await setDoc(doc(db, "users", secureId), {
        ...userData,
        dashboardData: realisticDbState,
        createdAt: new Date().toISOString()
      });
      console.log("Secure Profile & DB successfully pushed to Firebase!");
    } catch (e) {
      console.error("Error saving to Firebase: ", e);
    }
    
    // 6. Navigate
    if (profile.status === 'non-earning') {
      navigate('/student-dashboard', { state: userData });
    } else {
      navigate('/pro-dashboard', { state: userData });
    }
  };
  
  const progressPercentage = ((quizStep + 1) / currentQuestions.length) * 100;

  return (
    <div className="ob-container">
      <div className="ob-card">

        {/* PHASE 0: PERSONAL QUESTIONS */}
        {phase === 0 && (
          <>
            <div className="ob-header">
              <h2 className="ob-title">Establish Your Baseline</h2>
              <p className="ob-subtitle">Let's set up your personal financial profile.</p>
            </div>
            
            <div className="ob-stats-grid">
              
              <div className="ob-input-group">
                <label className="ob-label">Player Name</label>
                <input type="text" className="ob-input" placeholder="e.g., Rohan" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
              </div>

              <div className="ob-input-group">
                <label className="ob-label">Current Level (Age)</label>
                <input type="number" className="ob-input" placeholder="e.g., 20" value={profile.age} onChange={(e) => setProfile({...profile, age: e.target.value})} />
              </div>

              {/* The Split: This choice defines the rest of the form */}
              <div className="ob-input-group">
                <label className="ob-label">What is your current grind?</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    className={`ob-option-btn ${profile.status === 'non-earning' ? 'selected' : ''}`} 
                    style={{ flex: 1, textAlign: 'center', transition: 'all 0.3s' }} 
                    onClick={() => setProfile({...profile, status: 'non-earning'})}
                  >
                    Student / Allowance
                  </button>
                  <button 
                    className={`ob-option-btn ${profile.status === 'earning' ? 'selected' : ''}`} 
                    style={{ flex: 1, textAlign: 'center', transition: 'all 0.3s' }} 
                    onClick={() => setProfile({...profile, status: 'earning'})}
                  >
                    Working / Salary
                  </button>
                </div>
              </div>

              {/* --- DYNAMIC RENDER: STUDENT FIELDS --- */}
              {profile.status === 'non-earning' && (
                <div style={{ animation: 'fadeIn 0.4s ease-in-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="ob-input-group">
                    <label className="ob-label">Academic Year</label>
                    <input type="text" className="ob-input" placeholder="e.g., 2nd Year" value={profile.academicYear} onChange={(e) => setProfile({...profile, academicYear: e.target.value})} />
                  </div>
                  <div className="ob-input-group">
                    <label className="ob-label">Expected Graduation Year</label>
                    <input type="number" className="ob-input" placeholder="e.g., 2026" value={profile.gradYear} onChange={(e) => setProfile({...profile, gradYear: e.target.value})} />
                  </div>
                  <div className="ob-input-group">
                    <label className="ob-label">Monthly Allowance (₹)</label>
                    <input type="number" className="ob-input" placeholder="e.g., 5000" value={profile.income} onChange={(e) => setProfile({...profile, income: e.target.value})} />
                  </div>
                </div>
              )}

              {/* --- DYNAMIC RENDER: EARNING FIELDS --- */}
              {profile.status === 'earning' && (
                <div style={{ animation: 'fadeIn 0.4s ease-in-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="ob-input-group">
                    <label className="ob-label">Target Retirement Age</label>
                    <input type="number" className="ob-input" placeholder="e.g., 50" value={profile.retireAge} onChange={(e) => setProfile({...profile, retireAge: e.target.value})} />
                  </div>
                  <div className="ob-input-group">
                    <label className="ob-label">Monthly Salary (₹)</label>
                    <input type="number" className="ob-input" placeholder="e.g., 50000" value={profile.income} onChange={(e) => setProfile({...profile, income: e.target.value})} />
                  </div>
                </div>
              )}

              {/* Only show Savings once they pick a path */}
              {profile.status && (
                <div className="ob-input-group" style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
                  <label className="ob-label">Total Current Savings / Investments (₹)</label>
                  <input type="number" className="ob-input" placeholder="e.g., 15000" value={profile.savings} onChange={(e) => setProfile({...profile, savings: e.target.value})} />
                </div>
              )}

            </div>

            <button 
              className="ob-btn-primary" 
              onClick={handleProfileSubmit} 
              disabled={!isProfileComplete()}
            >
              Continue to Vibe Check
            </button>
          </>
        )}

        {/* PHASE 1: THE FINANCE QUIZ */}
        {phase === 1 && (
          <>
            <div className="ob-progress-bar">
              <div className="ob-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
            </div>

            <div className="ob-header">
              <h2 className="ob-title">{currentQuestions[quizStep].title}</h2>
              <p className="ob-subtitle">{currentQuestions[quizStep].subtitle}</p>
            </div>
            
            <div className="ob-options">
              {currentQuestions[quizStep].options.map((option, index) => (
                <button key={index} className="ob-option-btn" onClick={() => handleAnswer(option.trait)}>
                  {option.text}
                </button>
              ))}
            </div>
          </>
        )}

        {/* PHASE 2: MINDSET REVEAL */}
        {phase === 2 && archetype && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease-in-out' }}>
            <h2 style={{ color: '#10b981', fontSize: '1rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Mindset Decoded
            </h2>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800' }}>
              {archetype.title}
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem', lineHeight: '1.6', margin: '0 auto 1.5rem auto', maxWidth: '400px' }}>
              {archetype.description}
            </p>

            {/* THE NEW ANALYSIS RENDER */}
            <div style={{ backgroundColor: '#030712', border: '1px solid #374151', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1rem', color: '#d1d5db', marginBottom: '1rem' }}>Deep Dive Analysis:</h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {archetype.analysis.map((point, i) => (
                  <li key={i} style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            
            <button className="ob-btn-primary" onClick={finishOnboarding}>
              Enter Your Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;