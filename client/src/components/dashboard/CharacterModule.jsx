import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CharacterModule({ activeFilter }) {
  const [stationRows, setStationRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sdate, setSdate] = useState('');
  const [edate, setEdate] = useState('');
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadStationData();
  }, []);

  async function loadStationData(startDate = '', endDate = '') {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/dashboard', {
        params: {
          type: 'character',
          sdate: startDate,
          edate: endDate
        }
      });
      if (res.data) {
        if (res.data.stationRows) {
          setStationRows(res.data.stationRows);
        } else if (Array.isArray(res.data)) {
          setStationRows(res.data);
        }
      }
      setMinDate(startDate);
      setMaxDate(endDate);
    } catch (e) {
      setError('सत्यापन डेटा लोड करने में विफल: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (!sdate || !edate) {
      alert('कृपया दोनों दिनांक भरें');
      return;
    }
    loadStationData(sdate, edate);
    setShowSearch(false);
  }

  function fmt(dateStr) {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('-');
  }

  // Highlight classes based on selected dropdown options (activeFilter)
  const getHighlightClass = (colName) => {
    if (!activeFilter) return '';
    const nameMap = {
      totalps: 'ps',
      totalliu: 'liu',
      totaldcrb: 'dcrb',
      totaldcp: 'dcp',
    };
    return nameMap[activeFilter] === colName ? 'highlight-column' : '';
  };

  return (
    <div className="module-container card-upgrade">
      <div className="module-header">
        <div className="module-title-group">
          <h2>🛡️ चरित्र सत्यापन मॉड्यूल (Character Verification)</h2>
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
            <h2>Search Character Records</h2>
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

      {/* Metric Cards inside Character Module */}
      <div className="dashboard-stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📥</div>
          <div className="stat-info">
            <span className="stat-title">Received</span>
            <span className="stat-number">
              {stationRows.reduce((acc, r) => acc + Number(r.request_count || r.c_total || 0), 0)}
            </span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-title">Pending</span>
            <span className="stat-number">
              {stationRows.reduce((acc, r) => acc + Number(r.pending_count || r.c_remain || 0), 0)}
            </span>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <span className="stat-title">PS Pending</span>
            <span className="stat-number">
              {stationRows.reduce((acc, r) => acc + Number(r.pending_ps_count || r.c_station || 0), 0)}
            </span>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🔍</div>
          <div className="stat-info">
            <span className="stat-title">LIU Pending</span>
            <span className="stat-number">
              {stationRows.reduce((acc, r) => acc + Number(r.pending_liu_count || r.c_liu || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="table-wrapper image-styled-table-wrapper">
        <table className="image-styled-table">
          <thead>
            <tr>
              <th colSpan="9" style={{ textAlign: 'center', fontSize: '18px', background: '#1e293b' }}>
                थाना-वार चरित्र सत्यापन स्थिति डेसबोर्ड
              </th>
            </tr>
            {minDate || maxDate ? (
              <tr style={{ background: '#f8fafc' }}>
                <th colSpan="2" style={{ textAlign: 'center', color: '#1e293b', background: '#e2e8f0' }}>दिनांक से</th>
                <th colSpan="2" style={{ color: '#1e293b', background: '#f1f5f9' }}>{fmt(minDate)}</th>
                <th colSpan="2" style={{ textAlign: 'center', color: '#1e293b', background: '#e2e8f0' }}>दिनांक तक</th>
                <th colSpan="2" style={{ color: '#1e293b', background: '#f1f5f9' }}>{fmt(maxDate)}</th>
              </tr>
            ) : null}
            <tr>
              <th>Sr.No.</th>
              <th>Police Station</th>
              <th className={getHighlightClass('all')}>Recieved</th>
              <th className={getHighlightClass('remain')}>Pending</th>
              <th className={getHighlightClass('ps')}>PS</th>
              <th className={getHighlightClass('dcrb')}>DCRB</th>
              <th className={getHighlightClass('liu')}>LIU</th>
              <th className={getHighlightClass('dcp')}>DCP</th>
              <th className={getHighlightClass('link_to_other_ps')}>Link to Other PS</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>लोड हो रहा है...</td></tr>
            )}
            {error && (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
            )}
            {!loading && stationRows.map((r, i) => (
              <tr key={i} className={i % 2 === 1 ? 'alt-row' : ''}>
                <td>{i + 1}</td>
                <td style={{ fontWeight: '600' }}>{r.pre_station || r['थाना']}</td>
                <td className={getHighlightClass('all')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=all&ps=${encodeURIComponent(r.pre_station || r['थाना'] || '')}`} target="_blank" rel="noreferrer">
                    {r.request_count || r.c_total || 0}
                  </a>
                </td>
                <td className={getHighlightClass('remain')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=remain&ps=${encodeURIComponent(r.pre_station || r['थाना'] || '')}`} target="_blank" rel="noreferrer">
                    {r.pending_count || r.c_remain || 0}
                  </a>
                </td>
                <td className={getHighlightClass('ps')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=ps&ps=${encodeURIComponent(r.pre_station || r['थाना'] || '')}`} target="_blank" rel="noreferrer">
                    {r.pending_ps_count || r.c_station || 0}
                  </a>
                </td>
                <td className={getHighlightClass('dcrb')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=dcrb&ps=${encodeURIComponent(r.pre_station || r['थाना'] || '')}`} target="_blank" rel="noreferrer">
                    {r.pending_dcrb_count || r.c_dcrb || 0}
                  </a>
                </td>
                <td className={getHighlightClass('liu')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=liu&ps=${encodeURIComponent(r.pre_station || r['थाना'] || '')}`} target="_blank" rel="noreferrer">
                    {r.pending_liu_count || r.c_liu || 0}
                  </a>
                </td>
                <td className={getHighlightClass('dcp')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=dcp&ps=${encodeURIComponent(r.pre_station || r['थाना'] || '')}`} target="_blank" rel="noreferrer">
                    {r.pending_dcp_count || r.c_dcp || 0}
                  </a>
                </td>
                <td className={getHighlightClass('link_to_other_ps')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=link_to_other_ps&ps=${encodeURIComponent(r.pre_station || r['थाना'] || '')}`} target="_blank" rel="noreferrer">
                    {r.link_to_other_ps || r.c_link_to_other_ps || 0}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
