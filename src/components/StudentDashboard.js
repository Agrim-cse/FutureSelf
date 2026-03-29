import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import Navbar from './Navbar'; 
// --- SURGICAL DATABASE IMPORTS ---
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend);

const StudentDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  // --- UI TABS & GAMIFICATION ---
  const [activeTab, setActiveTab] = useState('actions');
  const [xp, setXp] = useState(0); 
  const [timeFilter, setTimeFilter] = useState('7days'); 
  const [ledgerFilter, setLedgerFilter] = useState('daily');

  // --- LOGGING STATE ---
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('essentials');
  const [ledger, setLedger] = useState([]);
  const [currentPeriodData, setCurrentPeriodData] = useState({ essentials: 0, lifestyle: 0, academic: 0, save: 0 });

  // --- CONFIRMATION POPUP STATE ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  // --- MULTIPLE FORECAST LOANS MODULE ---
  const [loans, setLoans] = useState([]);
  const [newLoan, setNewLoan] = useState({ name: '', principal: '', interest: '', tenure: '' });

  // --- MANUAL CRISIS STATE ---
  const [crisisAmount, setCrisisAmount] = useState('');
  const [totalCrisisApplied, setTotalCrisisApplied] = useState(0);
  const [crisisAlert, setCrisisAlert] = useState(null);

  // --- STREAK TOOLTIP STATE ---
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);

  // 1. DATA INITIALIZATION HOOK
  useEffect(() => {
    const data = location.state || JSON.parse(localStorage.getItem('finquest_user'));
    if (!data || data.profile.status !== 'non-earning') {
      navigate('/auth'); // Updated to /auth for safety
    } else {
      setUserData(data);
      setXp(data.xp || 0); 

      // Load specific student DB state if it exists
      const savedDb = JSON.parse(localStorage.getItem(`db_student_${data.profile.name}`));
      if (savedDb) {
        setCurrentPeriodData(savedDb.currentPeriodData || { essentials: 0, lifestyle: 0, academic: 0, save: 0 });
        setLoans(savedDb.loans || []);
        setLedger(savedDb.ledger || []);
        setTotalCrisisApplied(savedDb.totalCrisisApplied || 0);

        // --- STREAK SYSTEM: Student 50-30-20 Rule (Weekly) ---
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        const weekStartStr = weekStart.toDateString();
        const lastStreakDate = data.lastStreakDate || weekStartStr;
        
        // Only calculate streak once per week (when week changes)
        if (lastStreakDate !== weekStartStr) {
          const entries = savedDb.ledger || [];
          
          // Filter for current week
          let weeklyEssentials = 0;
          let weeklyAcademic = 0;
          let weeklyLifestyle = 0;
          let weeklySave = 0;
          
          entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            if (entryDate >= weekStart && entryDate <= today) {
              if (entry.category === 'essentials') weeklyEssentials += entry.amount;
              if (entry.category === 'academic') weeklyAcademic += entry.amount;
              if (entry.category === 'lifestyle') weeklyLifestyle += entry.amount;
              if (entry.category === 'save') weeklySave += entry.amount;
            }
          });
          
          const weeklyTotal = weeklyEssentials + weeklyAcademic + weeklyLifestyle + weeklySave;
          
          let followsRule = false;
          if (weeklyTotal > 0) {
            const essentialsRatio = (weeklyEssentials + weeklyAcademic) / weeklyTotal;
            const lifestyleRatio = weeklyLifestyle / weeklyTotal;
            const saveRatio = weeklySave / weeklyTotal;
            
            // Check if within tolerance (±5%) of 50-30-20
            followsRule = 
              Math.abs(essentialsRatio - 0.5) <= 0.05 &&
              Math.abs(lifestyleRatio - 0.3) <= 0.05 &&
              Math.abs(saveRatio - 0.2) <= 0.05;
          }
          
          const newStreak = followsRule ? (data.streak || 1) + 1 : 1;
          const updatedData = { ...data, streak: newStreak, lastStreakDate: weekStartStr };
          localStorage.setItem('finquest_user', JSON.stringify(updatedData));
          setUserData(updatedData);
        }
      } else if (data.dashboardData) {
        // Fallback to Firestore initial state
        setCurrentPeriodData(data.dashboardData.currentPeriodData);
        setLoans(data.dashboardData.loans || []);
        setLedger(data.dashboardData.ledger || []);

        // --- STREAK SYSTEM: First time check ---
        const today = new Date().toDateString();
        const lastStreakDate = data.lastStreakDate || today;
        if (lastStreakDate !== today) {
          const newStreak = 1;
          const updatedData = { ...data, streak: newStreak, lastStreakDate: today };
          localStorage.setItem('finquest_user', JSON.stringify(updatedData));
          setUserData(updatedData);
        }
      }
    }
    // eslint-disable-next-line
  }, [location, navigate]);

  // 2. SURGICAL CLOUD SYNC HOOK (Correctly placed inside component)
  useEffect(() => {
    const syncToCloud = async () => {
      const user = auth.currentUser;
      if (user && userData) {
        const dbState = { currentPeriodData, loans, ledger, totalCrisisApplied };
        
        // Sync to LocalStorage for speed
        localStorage.setItem(`db_student_${userData.profile.name}`, JSON.stringify(dbState));
        
        // Sync to Cloud Firestore - include streak & date for daily refresh logic
        await setDoc(doc(db, "users", user.uid), {
          dashboardData: dbState,
          streak: userData.streak || 1,
          lastStreakDate: userData.lastStreakDate || new Date().toDateString(),
          lastUpdated: new Date().toISOString()
        }, { merge: true }).catch(err => console.error("Cloud Sync Error:", err));
      }
    };
    syncToCloud();
  }, [currentPeriodData, loans, ledger, totalCrisisApplied, userData]);

  const calculateEMI = (p, r, t) => {
    if (!p || !r || !t) return 0;
    const principal = Number(p);
    const ratePerMonth = (Number(r) / 100) / 12;
    const months = Number(t) * 12;
    const emi = (principal * ratePerMonth * Math.pow(1 + ratePerMonth, months)) / (Math.pow(1 + ratePerMonth, months) - 1);
    return emi.toFixed(0);
  };

  if (!userData) return <div className="dash-container">Loading Campus Engine...</div>;

  const { profile, archetype } = userData; 
  const income = Number(profile.income);
  
  const currentYear = new Date().getFullYear();
  const yearsToGrad = Math.max(1, Number(profile.gradYear) - currentYear);
  const monthsToGrad = yearsToGrad * 12;

  const currentStash = Math.max(0, Number(profile.savings) + currentPeriodData.save - totalCrisisApplied);

  const handleLogTransaction = (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (val <= 0) return;
    
    // Store pending transaction and show confirmation
    setPendingTransaction({ amount: val, category });
    setShowConfirm(true);
  };

  const confirmTransaction = () => {
    if (!pendingTransaction) return;

    const entry = {
      id: Date.now(),
      category: pendingTransaction.category,
      amount: pendingTransaction.amount,
      date: new Date().toLocaleDateString(),
      timestamp: new Date().toISOString()
    };

    setLedger([...ledger, entry]);
    setCurrentPeriodData(prev => ({ ...prev, [pendingTransaction.category]: prev[pendingTransaction.category] + pendingTransaction.amount }));
    
    if (pendingTransaction.category === 'save') {
      const newXp = xp + 50;
      setXp(newXp);
      const updatedData = { ...userData, xp: newXp };
      localStorage.setItem('finquest_user', JSON.stringify(updatedData));
      setUserData(updatedData);
    }

    setAmount('');
    setPendingTransaction(null);
    setShowConfirm(false);
  };

  const getFilteredLedger = () => {
    const now = new Date();
    return ledger.filter(entry => {
      const entryDate = new Date(entry.date);
      if (ledgerFilter === 'daily') {
        return entryDate.toDateString() === now.toDateString();
      } else if (ledgerFilter === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return entryDate >= weekAgo && entryDate <= now;
      } else if (ledgerFilter === 'monthly') {
        return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
      }
      return true;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const handleAddLoan = (e) => {
    e.preventDefault();
    if (!newLoan.name || !newLoan.principal || !newLoan.interest || !newLoan.tenure) return;
    const emi = calculateEMI(newLoan.principal, newLoan.interest, newLoan.tenure);
    setLoans([...loans, { ...newLoan, emi, id: Date.now() }]);
    setNewLoan({ name: '', principal: '', interest: '', tenure: '' });
  };

  const handleManualCrisis = (e) => {
    e.preventDefault();
    const val = Number(crisisAmount);
    if (val <= 0) return;
    setTotalCrisisApplied(prev => prev + val);
    setCrisisAlert(`🚨 Unexpected expense of ₹${val.toLocaleString()} absorbed from stash!`);
    setCrisisAmount('');
    setTimeout(() => setCrisisAlert(null), 5000);
  };

  const getHistoricalData = () => {
    let labels = []; let spentData = []; let savedData = [];
    let count = timeFilter === '7days' ? 7 : (timeFilter === '12weeks' ? 12 : (timeFilter === '12months' ? 12 : 5));
    let prefix = timeFilter === '7days' ? 'Day' : (timeFilter === '12weeks' ? 'Wk' : (timeFilter === '12months' ? 'Mo' : 'Yr'));

    for(let i=1; i<=count; i++) {
      labels.push(`${prefix} ${i}`);
      if (i === count) {
        // Only show REAL current period data
        spentData.push(currentPeriodData.essentials + currentPeriodData.lifestyle + currentPeriodData.academic);
        savedData.push(currentPeriodData.save);
      } else {
        // No historical data available - show zeros
        spentData.push(0);
        savedData.push(0);
      }
    }

    return {
      labels,
      datasets: [
        { label: 'Total Spent', data: spentData, backgroundColor: '#ef4444', borderRadius: 4 },
        { label: 'Saved/Invested', data: savedData, backgroundColor: '#10b981', borderRadius: 4 }
      ]
    };
  };

  const getGradData = () => {
    let labels = []; let predicted = []; let loanData = [];
    let runPred = currentStash;
    let runLoan = loans.reduce((sum, loan) => sum + Number(loan.principal), 0);
    const monthlyReturn = 0.06 / 12; 
    const avgInterest = loans.length > 0 ? loans.reduce((sum, l) => sum + Number(l.interest), 0) / loans.length : 0;
    const monthlyLoanInterest = (avgInterest / 100) / 12;
    const actualMonthlySave = currentPeriodData.save > 0 ? currentPeriodData.save : income * 0.2;

    for(let m=0; m<=monthsToGrad; m++) {
      if(m%3===0 || m===monthsToGrad) {
        labels.push(m===monthsToGrad ? 'Grad' : `M${m}`);
        predicted.push(runPred.toFixed(0));
        if (loans.length > 0) loanData.push(runLoan.toFixed(0));
      }
      runPred = (runPred + actualMonthlySave) * (1 + monthlyReturn);
      if (loans.length > 0) runLoan = runLoan * (1 + monthlyLoanInterest); 
    }

    return {
      labels,
      datasets: [
        { label: 'Projected Wealth', data: predicted, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.3 },
        ...(loans.length > 0 ? [{ label: 'Compounding Loan Burden', data: loanData, borderColor: '#ef4444', borderDash: [5,5], fill: false, tension: 0.3 }] : [])
      ]
    };
  };

  return (
    <>
      <Navbar /> 
      <div className="dash-container">
        <header className="dash-header">
          <div>
            <div className="dash-logo"><span>Fin<span className="text-emerald">Quest</span> | CAMPUS</span></div>
            <div style={{ color: '#9ca3af', marginTop: '0.5rem', fontSize: '0.9rem' }}>Class of {profile.gradYear}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#111827', padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #374151' }}>
            <button onClick={() => setActiveTab('actions')} style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'actions' ? '#3b82f6' : 'transparent', color: activeTab === 'actions' ? '#fff' : '#9ca3af' }}>
              Action Center
            </button>
            <button onClick={() => setActiveTab('visualizer')} style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'visualizer' ? '#3b82f6' : 'transparent', color: activeTab === 'visualizer' ? '#fff' : '#9ca3af' }}>
              Data Visualizer
            </button>
            <button onClick={() => setActiveTab('ledger')} style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'ledger' ? '#3b82f6' : 'transparent', color: activeTab === 'ledger' ? '#fff' : '#9ca3af' }}>
              Ledger
            </button>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Rank: {archetype.title}</div>
            <div 
              style={{ fontWeight: 'bold', color: '#3b82f6', cursor: 'pointer', position: 'relative', display: 'inline-block' }}
              onMouseEnter={() => setShowStreakTooltip(true)}
              onMouseLeave={() => setShowStreakTooltip(false)}
            >
              🔥 {userData?.streak || 0} | {xp} XP
              {showStreakTooltip && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                  backgroundColor: 'rgba(59, 130, 246, 1)', border: '1px solid #3b82f6', borderRadius: '0.5rem',
                  padding: '1rem', width: '300px', zIndex: 999,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  color: '#d1d5db', fontSize: '0.85rem', lineHeight: '1.6', textAlign: 'left'
                }}>
                  <p style={{ fontWeight: 'bold', color: '#fff', marginBottom: '0.75rem', fontSize: '0.95rem' }}>Streak Calculation</p>
                  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '0' }}>
                    <p style={{ color: '#fff', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}><strong>Every Sunday:</strong></p>
                    <ol style={{ marginLeft: '1.5rem', color: '#d1d5db', paddingLeft: '0', textAlign: 'left' }}>
                      <li style={{ marginBottom: '0.375rem' }}>Sum all transactions from Sunday → Today</li>
                      <li style={{ marginBottom: '0.375rem' }}>Calculate spending in each category</li>
                      <li style={{ marginBottom: '0.375rem' }}>Check if ratios match 50-30-20 (±5%)</li>
                      <li>Streak +1 if compliant, reset to 1 if not</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dash-main" style={{ gridTemplateColumns: '1fr 1fr' }}>
          
          {activeTab === 'actions' && (
            <>
              <div className="dash-col" style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #374151' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Log Activity</h3>
                  <form onSubmit={handleLogTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="number" placeholder="Enter Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', background: '#030712', border: '1px solid #374151', color: '#fff', fontSize: '1.1rem', boxSizing: 'border-box' }} />
                    <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '0.75rem', background: '#030712', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', outline: 'none' }}>
                      <option value="essentials">Essentials (Food, Rent, Transport)</option>
                      <option value="academic">Academic (Books, Fees, Courses)</option>
                      <option value="lifestyle">Lifestyle (Outings, Subs, Wants)</option>
                      <option value="save">Savings / Micro-Investments</option>
                    </select>
                    <button type="submit" style={{ padding: '0.75rem', background: '#10b981', color: '#030712', fontWeight: 'bold', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>Push to Ledger</button>
                  </form>
                </div>

                <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #ef4444' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '1rem' }}>⚠️ Manual Crisis Simulator</h3>
                  <form onSubmit={handleManualCrisis} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" placeholder="Unexpected Expense (₹)" value={crisisAmount} onChange={(e) => setCrisisAmount(e.target.value)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: '#030712', border: '1px solid #ef4444', color: '#fff' }} />
                    <button type="submit" style={{ padding: '0.75rem 1rem', background: '#ef4444', color: '#fff', fontWeight: 'bold', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>Deduct</button>
                  </form>
                  {crisisAlert && <div style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.85rem' }}>{crisisAlert}</div>}
                </div>
              </div>

              <div className="dash-col" style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24' }}>Forecast Student Loans</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {loans.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Add projected loans to forecast your post-grad EMI burden.</p> : null}
                    {loans.map(loan => (
                      <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#030712', padding: '1rem', borderRadius: '0.5rem', borderLeft: '4px solid #fbbf24' }}>
                        <div>
                          <h4 style={{ fontWeight: 'bold', color: '#f3f4f6' }}>{loan.name}</h4>
                          <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Princ: ₹{Number(loan.principal).toLocaleString()} | {loan.interest}%</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Forecasted EMI</div>
                          <div style={{ fontWeight: 'bold', color: '#ef4444' }}>₹{Number(loan.emi).toLocaleString()}<span style={{ fontSize: '0.7rem' }}>/mo</span></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px dashed #374151', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '1rem', textTransform: 'uppercase' }}>+ Add Loan Forecast</h4>
                    <form onSubmit={handleAddLoan} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <input type="text" placeholder="Loan Name" value={newLoan.name} onChange={e => setNewLoan({...newLoan, name: e.target.value})} style={{ gridColumn: 'span 2', padding: '0.75rem', background: '#030712', border: '1px solid #374151', color: '#fff', borderRadius: '0.5rem' }} />
                      <input type="number" placeholder="Principal (₹)" value={newLoan.principal} onChange={e => setNewLoan({...newLoan, principal: e.target.value})} style={{ gridColumn: 'span 2', padding: '0.75rem', background: '#030712', border: '1px solid #374151', color: '#fff', borderRadius: '0.5rem' }} />
                      <input type="number" placeholder="Interest %" value={newLoan.interest} onChange={e => setNewLoan({...newLoan, interest: e.target.value})} style={{ padding: '0.75rem', background: '#030712', border: '1px solid #374151', color: '#fff', borderRadius: '0.5rem' }} />
                      <input type="number" placeholder="Years" value={newLoan.tenure} onChange={e => setNewLoan({...newLoan, tenure: e.target.value})} style={{ padding: '0.75rem', background: '#030712', border: '1px solid #374151', color: '#fff', borderRadius: '0.5rem' }} />
                      <button type="submit" style={{ gridColumn: 'span 2', padding: '0.75rem', background: '#374151', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Add to Forecast</button>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'visualizer' && (
            <>
              <div className="dash-col" style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Historical Tracker</h3>
                    <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={{ background: '#030712', color: '#d1d5db', border: '1px solid #374151', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', outline: 'none' }}>
                      <option value="7days">Last 7 Days</option>
                      <option value="12weeks">Past 12 Weeks</option>
                      <option value="12months">Past 12 Months</option>
                      <option value="5years">Past 5 Years</option>
                    </select>
                  </div>
                  {currentPeriodData.essentials === 0 && currentPeriodData.lifestyle === 0 && currentPeriodData.academic === 0 && currentPeriodData.save === 0 ? (
                    <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.95rem' }}>
                      📊 No transaction history yet. Start logging to build your financial story!
                    </div>
                  ) : (
                    <div style={{ height: '350px' }}><Bar data={getHistoricalData()} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                  )}
                </div>
              </div>

              <div className="dash-col" style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #374151' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Graduation Trajectory</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Current Stash: <strong style={{color: '#10b981'}}>₹{currentStash.toLocaleString()}</strong></p>
                  </div>
                  <div style={{ height: '300px' }}><Line data={getGradData()} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* LEDGER TAB */}
        {activeTab === 'ledger' && (
          <main className="dash-main" style={{ display: 'block' }}>
            <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #374151' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Transaction Ledger</h3>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setLedgerFilter('daily')} style={{ padding: '0.5rem 1rem', backgroundColor: ledgerFilter === 'daily' ? '#3b82f6' : 'transparent', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  Today
                </button>
                <button onClick={() => setLedgerFilter('weekly')} style={{ padding: '0.5rem 1rem', backgroundColor: ledgerFilter === 'weekly' ? '#3b82f6' : 'transparent', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  This Week
                </button>
                <button onClick={() => setLedgerFilter('monthly')} style={{ padding: '0.5rem 1rem', backgroundColor: ledgerFilter === 'monthly' ? '#3b82f6' : 'transparent', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  This Month
                </button>
              </div>

              {getFilteredLedger().length === 0 ? (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>
                  📭 No transactions in this period
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {getFilteredLedger().map((entry) => (
                    <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#030712', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #1f2937' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#f3f4f6', textTransform: 'capitalize' }}>{entry.category}</div>
                        <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{entry.date}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#10b981' }}>₹{entry.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        )}

        {/* CONFIRMATION POPUP */}
        {showConfirm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '1rem', padding: '2rem',
              maxWidth: '400px', width: '90%'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Confirm Transaction</h3>
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                Add <strong style={{ color: '#fff' }}>₹{pendingTransaction?.amount?.toLocaleString()}</strong> to{' '}
                <strong style={{ color: '#3b82f6', textTransform: 'capitalize' }}>{pendingTransaction?.category}</strong>?
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => { setShowConfirm(false); setPendingTransaction(null); }} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancel
                </button>
                <button onClick={confirmTransaction} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10b981', color: '#030712', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentDashboard;