import React, { useState } from 'react';

export default function EmployeeModule({ activeFilter }) {
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
          <h2>💼 कर्मचारी सत्यापन मॉड्यूल (Employee Verification)</h2>
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
            <h2>Search Employee Records</h2>
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
            <span className="stat-title">प्राप्त कर्मचारी आवेदन (Received)</span>
            <span className="stat-number">520</span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-title">लम्बित आवेदन (Pending)</span>
            <span className="stat-number">34</span>
          </div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-title">सत्यापित कर्मचारी (Verified)</span>
            <span className="stat-number">486</span>
          </div>
        </div>
        <div className="stat-card indigo">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <span className="stat-title">सत्यापन दर (Verification Rate)</span>
            <span className="stat-number">93.4%</span>
          </div>
        </div>
      </div>

      <div className="premium-placeholder-info">
        <div className="placeholder-alert">
          💼 <strong>कर्मचारी सत्यापन</strong> सेवा के अंतर्गत विभिन्न निजी सुरक्षा एजेंसियों, सरकारी विभागों एवं व्यापारिक प्रतिष्ठानों के कर्मचारियों की पृष्ठभूमि की जाँच की जाती है।
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div className="card-upgrade" style={{ padding: '15px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>प्रतिष्ठान वार विवरण (Sector Share)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>🏢 निजी कंपनियां (Private Sector) - 58%</div>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{ width: '58%', height: '100%', background: '#3b82f6', borderRadius: '4px' }}></div>
              </div>
              <div>👮 सुरक्षा एजेंसियां (Security Guard Agency) - 27%</div>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{ width: '27%', height: '100%', background: '#a855f7', borderRadius: '4px' }}></div>
              </div>
              <div>🏫 स्कूल/कॉलेज कर्मचारी (Academic Staff) - 15%</div>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{ width: '15%', height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>

          <div className="card-upgrade" style={{ padding: '15px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>समय-सीमा विवरण (Aging Analysis)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>0-15 दिवस:</span>
                <span style={{ fontWeight: '600', color: '#10b981' }}>32 लम्बित</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>16-30 दिवस:</span>
                <span style={{ fontWeight: '600', color: '#f59e0b' }}>0 लम्बित</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>31-90 दिवस:</span>
                <span style={{ fontWeight: '600', color: '#f59e0b' }}>0 लम्बित</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>91-180 दिवस:</span>
                <span style={{ fontWeight: '600', color: '#ef4444' }}>2 लम्बित</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
