import React, { useState } from 'react';

export default function TenantModule({ activeFilter }) {
  const [sdate, setSdate] = useState('');
  const [edate, setEdate] = useState('');
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setMinDate(sdate);
    setMaxDate(edate);
    setShowSearch(false);
  }

  return (
    <div className="module-container card-upgrade">
      <div className="module-header">
        <div className="module-title-group">
          <h2>🏠 किरायेदार सत्यापन मॉड्यूल (Tenant Verification)</h2>
          {activeFilter && (
            <span className="filter-badge">
              सक्रिय फ़िल्टर: {activeFilter.toUpperCase().replace('TOTAL', '')}
            </span>
          )}
        </div>
        <button className="search-trigger-btn" onClick={() => setShowSearch(true)}>
          🔍 दिनांक द्वारा खोजें
        </button>
      </div>

      {showSearch && (
        <div className="search-modal-overlay">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <h2>Search Tenant Records</h2>
            <div className="inputs">
              <label>From Date</label>
              <input type="date" value={sdate} onChange={e => setSdate(e.target.value)} />
            </div>
            <div className="inputs">
              <label>To Date <span style={{ color: 'red' }}>*</span></label>
              <input type="date" value={edate} onChange={e => setEdate(e.target.value)} required />
            </div>
            <div className="btn-container">
              <button type="submit">SEARCH</button>
              <button type="button" onClick={() => setShowSearch(false)}>CLOSE</button>
            </div>
          </form>
        </div>
      )}

      {/* Simulated Stats */}
      <div className="dashboard-stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📥</div>
          <div className="stat-info">
            <span className="stat-title">कुल किरायेदार पंजीकृत (Total Tenants)</span>
            <span className="stat-number">412</span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-title">लम्बित सत्यापन (Pending Verification)</span>
            <span className="stat-number">48</span>
          </div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-title">सत्यापन पूर्ण (Completed)</span>
            <span className="stat-number">358</span>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <span className="stat-title">थाने स्तर पर लम्बित (At PS level)</span>
            <span className="stat-number">32</span>
          </div>
        </div>
      </div>

      <div className="premium-placeholder-info">
        <div className="placeholder-alert">
          📋 आगरा क्षेत्र में सुरक्षा की दृष्टि से समस्त <strong>किरायेदार सत्यापन</strong> अनिवार्य है। भू-स्वामी निम्नलिखित विवरणी का अवलोकन कर सकते हैं।
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginTop: '20px' }}>
          <div className="card-upgrade" style={{ padding: '15px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>सत्यापन का प्रकार विश्लेषण (Tenant Origin Analysis)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>📦 उत्तर प्रदेश के भीतर से (Within UP) - 65%</div>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{ width: '65%', height: '100%', background: '#6366f1', borderRadius: '4px' }}></div>
              </div>
              <div>🌍 अन्य राज्यों से (Outside State) - 35%</div>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{ width: '35%', height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>

          <div className="card-upgrade" style={{ padding: '15px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>सत्यापन स्थिति (Verification Rates)</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', flexDirection: 'column' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>86.8%</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>सफलतापूर्वक सत्यापित दर</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
