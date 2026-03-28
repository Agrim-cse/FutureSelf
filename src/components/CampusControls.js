import React from 'react';

const CampusControls = ({ income, needs, setNeeds, wants, setWants }) => {
  // Auto-calculate what is left for investing
  const stash = income - needs - wants;

  const handleNeedsChange = (val) => {
    const newNeeds = Number(val);
    if (newNeeds + wants <= income) setNeeds(newNeeds);
  };

  const handleWantsChange = (val) => {
    const newWants = Number(val);
    if (needs + newWants <= income) setWants(newWants);
  };

  return (
    <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #1f2937' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Monthly Allocator</h3>
      
      {/* 1. Survival (Needs) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: '#d1d5db', fontWeight: '600' }}>Survival (Needs)</span>
          <span style={{ color: '#ef4444', fontFamily: 'monospace' }}>₹{needs}</span>
        </div>
        <input 
          type="range" min="0" max={income} step="100" 
          value={needs} onChange={(e) => handleNeedsChange(e.target.value)}
          style={{ width: '100%', accentColor: '#ef4444' }}
        />
      </div>

      {/* 2. Guilt-Free (Wants) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: '#d1d5db', fontWeight: '600' }}>Guilt-Free (Wants)</span>
          <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>₹{wants}</span>
        </div>
        <input 
          type="range" min="0" max={income} step="100" 
          value={wants} onChange={(e) => handleWantsChange(e.target.value)}
          style={{ width: '100%', accentColor: '#fbbf24' }}
        />
      </div>

      {/* 3. The Stash (Auto-calculated Investments) */}
      <div style={{ padding: '1rem', backgroundColor: '#030712', borderRadius: '0.5rem', border: '1px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ display: 'block', color: '#10b981', fontWeight: 'bold' }}>The Stash (Investments)</span>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>FDs, RDs, Liquid Funds</span>
          </div>
          <span style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>₹{stash}</span>
        </div>
      </div>
    </div>
  );
};

export default CampusControls;