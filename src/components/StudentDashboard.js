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

  // --- LOGGING STATE ---
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('essentials'); 
  const [currentPeriodData, setCurrentPeriodData] = useState({ essentials: 0, lifestyle: 0, academic: 0, save: 0 });

  // --- MULTIPLE FORECAST LOANS MODULE ---
  const [loans, setLoans] = useState([]);
  const [newLoan, setNewLoan] = useState({ name: '', principal: '', interest: '', tenure: '' });

  // --- MANUAL CRISIS STATE ---
  const [crisisAmount, setCrisisAmount] = useState('');
  const [totalCrisisApplied, setTotalCrisisApplied] = useState(0);
  const [crisisAlert, setCrisisAlert] = useState(null);

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
        setTotalCrisisApplied(savedDb.totalCrisisApplied || 0);
      } else if (data.dashboardData) {
        // Fallback to Firestore initial state
        setCurrentPeriodData(data.dashboardData.currentPeriodData);
        setLoans(data.dashboardData.loans || []);
      }
    }
    // eslint-disable-next-line
  }, [location, navigate]);

  // 2. SURGICAL CLOUD SYNC HOOK (Correctly placed inside component)
  useEffect(() => {
    const syncToCloud = async () => {
      const user = auth.currentUser;
      if (user && userData) {
        const dbState = { currentPeriodData, loans, totalCrisisApplied };
        
        // Sync to LocalStorage for speed
        localStorage.setItem(`db_student_${userData.profile.name}`, JSON.stringify(dbState));
        
        // Sync to Cloud Firestore
        await setDoc(doc(db, "users", user.uid), {
          dashboardData: dbState,
          lastUpdated: new Date().toISOString()
        }, { merge: true }).catch(err => console.error("Cloud Sync Error:", err));
      }
    };
    syncToCloud();
  }, [currentPeriodData, loans, totalCrisisApplied, userData]);

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
    
    setCurrentPeriodData(prev => ({ ...prev, [category]: prev[category] + val }));
    
    if (category === 'save') {
      const newXp = xp + 50;
      setXp(newXp);
      const updatedData = { ...userData, xp: newXp };
      localStorage.setItem('finquest_user', JSON.stringify(updatedData));
      setUserData(updatedData);
    }
    setAmount('');
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
    let divider = timeFilter === '7days' ? 30 : (timeFilter === '12weeks' ? 4 : (timeFilter === '12months' ? 1 : 1/12));

    const periodIncome = income / divider;

    for(let i=1; i<=count; i++) {
      labels.push(`${prefix} ${i}`);
      if (i === count) {
        spentData.push(currentPeriodData.essentials + currentPeriodData.lifestyle + currentPeriodData.academic);
        savedData.push(currentPeriodData.save);
      } else {
        let mockSpend = periodIncome * (0.6 + Math.random() * 0.3);
        spentData.push(mockSpend);
        savedData.push(periodIncome - mockSpend);
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
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Rank: {archetype.title}</div>
            <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{xp} XP</span>
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
                  <div style={{ height: '350px' }}><Bar data={getHistoricalData()} options={{ responsive: true, maintainAspectRatio: false }} /></div>
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
      </div>
    </>
  );
};

export default StudentDashboard;