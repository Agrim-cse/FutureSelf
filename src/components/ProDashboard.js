import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import Navbar from './Navbar';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Filler, Legend);

const ProDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  const [activeTab, setActiveTab] = useState('actions');
  const [xp, setXp] = useState(0); 
  const [timeFilter, setTimeFilter] = useState('12months'); 

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('housing'); 
  const [assetClass, setAssetClass] = useState('equity'); 
  const [expenses, setExpenses] = useState({ housing: 0, food: 0, lifestyle: 0, health: 0 });
  const [portfolio, setPortfolio] = useState({ equity: 1500000, debt: 500000, gold: 200000 }); 

  const [liabilities, setLiabilities] = useState([
    { id: 1, name: 'Car Loan', principal: 800000, interest: 10, emi: 25000 }
  ]);
  const [newLib, setNewLib] = useState({ name: '', principal: '', interest: '', emi: '' });

  const [crisisLoss, setCrisisLoss] = useState('');
  const [crisisAlert, setCrisisAlert] = useState(null);

  // --- NEW: WHAT-IF TIME MACHINE STATE ---
  const [whatIfExtra, setWhatIfExtra] = useState(0);

  useEffect(() => {
    const data = location.state || JSON.parse(localStorage.getItem('finquest_user'));
    if (!data || data.profile.status !== 'earning') {
      navigate('/onboarding');
    } else {
      setUserData(data);
      setXp(data.xp || 0);
    }
  }, [location, navigate]);

  if (!userData) return <div className="dash-container">Loading Pro Engine...</div>;

  const { profile, archetype } = userData;
  const income = Number(profile.income);
  const yearsToRetire = Math.max(1, Number(profile.retireAge) - Number(profile.age));
  const totalEmi = liabilities.reduce((sum, lib) => sum + Number(lib.emi), 0);

  // --- NEW: REALITY CHECK ROASTER LOGIC ---
  const totalSpentNeeds = expenses.housing + expenses.food + expenses.health + totalEmi;
  const totalSpentWants = expenses.lifestyle;
  const idealNeeds = income * 0.50;
  const idealWants = income * 0.30;
  const idealInvest = income * 0.20;

  const getRealityCheck = () => {
    if (totalSpentNeeds > idealNeeds) return { text: "Bro, your 'Survival' spending is through the roof. Are you eating gold for breakfast? Cut back.", color: '#ef4444' };
    if (totalSpentWants > idealWants) return { text: "Lifestyle creep alert! You are spending too much on Wants. Your future self is judging you.", color: '#fbbf24' };
    return { text: "Optimizer mode engaged. Your allocations are flawless. Keep stacking that paper.", color: '#10b981' };
  };
  const realityCheck = getRealityCheck();

  const calculatePayoffMonths = (P, E, r_annual) => {
    const r = (r_annual / 100) / 12;
    if (E <= P * r) return "Never";
    return Math.ceil(Math.log(E / (E - P * r)) / Math.log(1 + r));
  };

  const handleLogTransaction = (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (val <= 0) return;

    if (['housing', 'food', 'lifestyle', 'health'].includes(category)) {
      setExpenses(prev => ({ ...prev, [category]: prev[category] + val }));
    } else if (category === 'invest') {
      setPortfolio(prev => ({ ...prev, [assetClass]: prev[assetClass] + val }));
      const newXp = xp + 150;
      setXp(newXp);
      const updatedData = { ...userData, xp: newXp };
      localStorage.setItem('finquest_user', JSON.stringify(updatedData));
      setUserData(updatedData);
    }
    setAmount('');
  };

  const handleAddLiability = (e) => {
    e.preventDefault();
    if (!newLib.name || !newLib.principal || !newLib.emi) return;
    setLiabilities([...liabilities, { ...newLib, id: Date.now() }]);
    setNewLib({ name: '', principal: '', interest: '', emi: '' });
  };

  const handleManualCrisis = (e) => {
    e.preventDefault();
    const loss = Number(crisisLoss);
    if (loss <= 0) return;
    setPortfolio(prev => {
      let newDebt = prev.debt - loss;
      let newEquity = prev.equity;
      if (newDebt < 0) { newEquity += newDebt; newDebt = 0; }
      return { ...prev, debt: newDebt, equity: Math.max(0, newEquity) };
    });
    setCrisisAlert(`🚨 Applied ₹${loss.toLocaleString()} loss. Portfolio adjusted!`);
    setCrisisLoss('');
    setTimeout(() => setCrisisAlert(null), 5000);
  };

  const getHistoricalData = () => {
    let labels = []; let spentData = []; let investData = [];
    let count = timeFilter === '7days' ? 7 : (timeFilter === '12weeks' ? 12 : (timeFilter === '12months' ? 12 : 5));
    let prefix = timeFilter === '7days' ? 'Day' : (timeFilter === '12weeks' ? 'Wk' : (timeFilter === '12months' ? 'Mo' : 'Yr'));
    let divider = timeFilter === '7days' ? 30 : (timeFilter === '12weeks' ? 4 : (timeFilter === '12months' ? 1 : 1/12));

    const periodIncome = income / divider;
    const currentSpentTotal = totalSpentNeeds + totalSpentWants;

    for(let i=1; i<=count; i++) {
      labels.push(`${prefix} ${i}`);
      if (i === count) {
        spentData.push(currentSpentTotal);
        investData.push(periodIncome * 0.2); 
      } else {
        let mockSpend = periodIncome * (0.5 + Math.random() * 0.3);
        spentData.push(mockSpend);
        investData.push(periodIncome - mockSpend);
      }
    }
    return { labels, datasets: [{ label: 'Outflow (Spent + Debt)', data: spentData, backgroundColor: '#ef4444', borderRadius: 4 }, { label: 'Capital Deployed', data: investData, backgroundColor: '#8b5cf6', borderRadius: 4 }] };
  };

  const getCorpusData = () => {
    let labels = []; let predicted = []; let whatIfData = [];
    let runEq = portfolio.equity; let runDebt = portfolio.debt; let runGold = portfolio.gold;
    
    // What if trajectory variables
    let runWhatIfEq = portfolio.equity; 
    let runWhatIfDebt = portfolio.debt; 
    let runWhatIfGold = portfolio.gold;

    const baseInvest = income * 0.20;

    for (let i = 0; i <= yearsToRetire; i++) {
      labels.push(`Age ${Number(profile.age) + i}`);
      
      // Standard Trajectory
      predicted.push((runEq + runDebt + runGold).toFixed(0));
      runEq = (runEq + (baseInvest * 0.6 * 12)) * 1.12;       
      runDebt = (runDebt + (baseInvest * 0.3 * 12)) * 1.07; 
      runGold = (runGold + (baseInvest * 0.1 * 12)) * 1.09; 

      // What-If Trajectory (Adding extra investment to Equity at 12%)
      if (whatIfExtra > 0) {
        whatIfData.push((runWhatIfEq + runWhatIfDebt + runWhatIfGold).toFixed(0));
        runWhatIfEq = (runWhatIfEq + ((baseInvest * 0.6) + Number(whatIfExtra)) * 12) * 1.12;
        runWhatIfDebt = (runWhatIfDebt + (baseInvest * 0.3 * 12)) * 1.07; 
        runWhatIfGold = (runWhatIfGold + (baseInvest * 0.1 * 12)) * 1.09; 
      }
    }

    const datasets = [{ label: 'Predicted Net Worth', data: predicted, borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, tension: 0.4 }];
    
    // Only show the third line if they use the slider
    if (whatIfExtra > 0) {
      datasets.push({ label: `What-If (+₹${whatIfExtra}/mo)`, data: whatIfData, borderColor: '#10b981', borderDash: [5, 5], fill: false, tension: 0.4 });
    }

    return { labels, datasets };
  };

  const dnutData = {
    labels: ['Equity', 'Debt', 'Gold'],
    datasets: [{ data: [Math.max(1, portfolio.equity), Math.max(1, portfolio.debt), Math.max(1, portfolio.gold)], backgroundColor: ['#8b5cf6', '#3b82f6', '#fbbf24'], borderWidth: 0 }]
  };

  return (
    <>
      <Navbar />
      <div className="dash-container">
        <header className="dash-header">
          <div>
            <div className="dash-logo"><span>Fin<span className="text-emerald" style={{color: '#8b5cf6'}}>Quest</span> | PRO</span></div>
            <div style={{ color: '#9ca3af', marginTop: '0.5rem', fontSize: '0.9rem' }}>FIRE Target: Age {profile.retireAge}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#111827', padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #374151' }}>
            <button onClick={() => setActiveTab('actions')} style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'actions' ? '#8b5cf6' : 'transparent', color: activeTab === 'actions' ? '#fff' : '#9ca3af' }}>
              Action Center
            </button>
            <button onClick={() => setActiveTab('visualizer')} style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'visualizer' ? '#8b5cf6' : 'transparent', color: activeTab === 'visualizer' ? '#fff' : '#9ca3af' }}>
              Data Visualizer
            </button>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Rank: {archetype.title}</div>
            <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>🔥 3 | {xp} XP</span>
          </div>
        </header>

        <main className="dash-main" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {activeTab === 'actions' && (
            <>
              <div className="dash-col" style={{ animation: 'fadeIn 0.3s' }}>
                
                {/* NEW: THE AI REALITY CHECK ROASTER */}
                <div style={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', padding: '1rem', borderRadius: '0.75rem', border: `1px solid ${realityCheck.color}`, borderLeft: `5px solid ${realityCheck.color}`, marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 'bold', color: realityCheck.color, fontSize: '0.85rem', textTransform: 'uppercase' }}>AI Coach Reality Check:</span>
                  <p style={{ color: '#d1d5db', fontSize: '0.95rem', marginTop: '0.25rem' }}>{realityCheck.text}</p>
                </div>

                <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #374151' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Log Activity</h3>
                  <form onSubmit={handleLogTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="number" placeholder="Enter Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', background: '#030712', border: '1px solid #374151', color: '#fff', fontSize: '1.1rem', boxSizing: 'border-box' }} />
                    <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '0.75rem', background: '#030712', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', outline: 'none' }}>
                      <option value="housing">Housing / Utilities</option>
                      <option value="food">Food / Groceries</option>
                      <option value="lifestyle">Lifestyle / Travel</option>
                      <option value="invest">Invest Capital</option>
                    </select>
                    {category === 'invest' && (
                      <select value={assetClass} onChange={(e) => setAssetClass(e.target.value)} style={{ padding: '0.5rem', background: '#030712', color: '#d1d5db', border: '1px solid #8b5cf6', borderRadius: '0.5rem', outline: 'none' }}>
                        <option value="equity">Equity (12% Avg)</option>
                        <option value="debt">Debt (7% Avg)</option>
                        <option value="gold">Gold (9% Avg)</option>
                      </select>
                    )}
                    <button type="submit" style={{ padding: '0.75rem', background: '#8b5cf6', color: '#fff', fontWeight: 'bold', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>Push to Ledger</button>
                  </form>
                </div>

                <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #ef4444' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '1rem' }}>⚠️ Manual Crisis Simulator</h3>
                  <form onSubmit={handleManualCrisis} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" placeholder="Loss Amount (₹)" value={crisisLoss} onChange={(e) => setCrisisLoss(e.target.value)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: '#030712', border: '1px solid #ef4444', color: '#fff' }} />
                    <button type="submit" style={{ padding: '0.75rem 1rem', background: '#ef4444', color: '#fff', fontWeight: 'bold', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>Apply Hit</button>
                  </form>
                  {crisisAlert && <div style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.85rem' }}>{crisisAlert}</div>}
                </div>
              </div>

              <div className="dash-col" style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Active Liabilities</h3>
                    <span style={{ color: '#ef4444', fontWeight: 'bold', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>-₹{totalEmi.toLocaleString()}/mo</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {liabilities.length === 0 ? <p style={{ color: '#9ca3af' }}>No active debt. You are free!</p> : null}
                    {liabilities.map(lib => (
                      <div key={lib.id} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#030712', padding: '1rem', borderRadius: '0.5rem', borderLeft: '4px solid #ef4444' }}>
                        <div>
                          <h4 style={{ fontWeight: 'bold', color: '#f3f4f6' }}>{lib.name}</h4>
                          <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Princ: ₹{Number(lib.principal).toLocaleString()} | {lib.interest}%</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold', color: '#ef4444' }}>₹{Number(lib.emi).toLocaleString()}<span style={{ fontSize: '0.7rem' }}>/mo</span></div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{calculatePayoffMonths(lib.principal, lib.emi, lib.interest)} Mos left</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px dashed #374151', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '1rem', textTransform: 'uppercase' }}>+ Add Liability</h4>
                    <form onSubmit={handleAddLiability} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <input type="text" placeholder="Name" value={newLib.name} onChange={e => setNewLib({...newLib, name: e.target.value})} style={{ gridColumn: 'span 2', padding: '0.75rem', background: '#030712', border: '1px solid #374151', color: '#fff', borderRadius: '0.5rem' }} />
                      <input type="number" placeholder="Principal (₹)" value={newLib.principal} onChange={e => setNewLib({...newLib, principal: e.target.value})} style={{ padding: '0.75rem', background: '#030712', border: '1px solid #374151', color: '#fff', borderRadius: '0.5rem' }} />
                      <input type="number" placeholder="EMI (₹)" value={newLib.emi} onChange={e => setNewLib({...newLib, emi: e.target.value})} style={{ padding: '0.75rem', background: '#030712', border: '1px solid #374151', color: '#fff', borderRadius: '0.5rem' }} />
                      <input type="number" placeholder="Interest %" value={newLib.interest} onChange={e => setNewLib({...newLib, interest: e.target.value})} style={{ gridColumn: 'span 2', padding: '0.75rem', background: '#030712', border: '1px solid #374151', color: '#fff', borderRadius: '0.5rem' }} />
                      <button type="submit" style={{ gridColumn: 'span 2', padding: '0.75rem', background: '#374151', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Add to Portfolio</button>
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
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Historical Cash Flow</h3>
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
                <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #374151', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dynamic Corpus Predictor</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '40px', height: '40px' }}><Doughnut data={dnutData} options={{ plugins: { legend: { display: false }, tooltip: { enabled: false } } }} /></div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Current Net Worth<br/><strong style={{color: '#fff', fontSize: '1rem'}}>₹{(portfolio.equity + portfolio.debt + portfolio.gold).toLocaleString()}</strong></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Age {profile.retireAge} Target:</p>
                      <strong style={{color: '#8b5cf6', fontSize: '1.25rem'}}>₹{(getCorpusData().datasets[0].data[yearsToRetire] / 10000000).toFixed(2)} Cr</strong>
                    </div>
                  </div>
                  
                  <div style={{ height: '230px' }}><Line data={getCorpusData()} options={{ responsive: true, maintainAspectRatio: false }} /></div>

                  {/* NEW: THE WHAT-IF TIME MACHINE SLIDER */}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #374151' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold' }}>🦋 The "What-If" Time Machine</span>
                      <span style={{ fontSize: '0.9rem', color: '#d1d5db' }}>+ ₹{whatIfExtra.toLocaleString()}/mo</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>Slide to see the impact of cutting "Wants" and investing the difference.</p>
                    <input 
                      type="range" min="0" max={income * 0.4} step="500" 
                      value={whatIfExtra} onChange={(e) => setWhatIfExtra(e.target.value)}
                      style={{ width: '100%', accentColor: '#10b981' }}
                    />
                  </div>

                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default ProDashboard;