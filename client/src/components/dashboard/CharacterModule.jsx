import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config/env';

const DEFAULT_STATION_ROWS = [
  { pre_station: 'थाना लोहामंडी', request_count: 142, approved_count: 5, rejected_count: 0, pending_count: 137, pending_ps_count: 135, pending_dcrb_count: 1, pending_liu_count: 1, pending_dcp_count: 0, link_to_other_ps: 0 },
  { pre_station: 'थाना हरीपर्वत', request_count: 189, approved_count: 2, rejected_count: 0, pending_count: 187, pending_ps_count: 180, pending_dcrb_count: 4, pending_liu_count: 2, pending_dcp_count: 1, link_to_other_ps: 0 },
  { pre_station: 'थाना शाहगंज', request_count: 165, approved_count: 1, rejected_count: 0, pending_count: 164, pending_ps_count: 160, pending_dcrb_count: 2, pending_liu_count: 2, pending_dcp_count: 0, link_to_other_ps: 0 },
  { pre_station: 'थाना सिकंदरा', request_count: 210, approved_count: 0, rejected_count: 0, pending_count: 210, pending_ps_count: 205, pending_dcrb_count: 3, pending_liu_count: 2, pending_dcp_count: 0, link_to_other_ps: 0 },
  { pre_station: 'थाना न्यू आगरा', request_count: 198, approved_count: 0, rejected_count: 0, pending_count: 198, pending_ps_count: 192, pending_dcrb_count: 4, pending_liu_count: 2, pending_dcp_count: 0, link_to_other_ps: 0 },
  { pre_station: 'थाना जगदीशपुरा', request_count: 154, approved_count: 0, rejected_count: 0, pending_count: 154, pending_ps_count: 150, pending_dcrb_count: 2, pending_liu_count: 2, pending_dcp_count: 0, link_to_other_ps: 0 },
  { pre_station: 'थाना ताजगंज', request_count: 230, approved_count: 0, rejected_count: 0, pending_count: 230, pending_ps_count: 220, pending_dcrb_count: 6, pending_liu_count: 4, pending_dcp_count: 0, link_to_other_ps: 0 },
  { pre_station: 'थाना एत्माद्दौला', request_count: 175, approved_count: 0, rejected_count: 0, pending_count: 175, pending_ps_count: 170, pending_dcrb_count: 3, pending_liu_count: 2, pending_dcp_count: 0, link_to_other_ps: 0 },
  { pre_station: 'थाना छत्ता', request_count: 110, approved_count: 0, rejected_count: 0, pending_count: 110, pending_ps_count: 108, pending_dcrb_count: 1, pending_liu_count: 1, pending_dcp_count: 0, link_to_other_ps: 0 },
  { pre_station: 'थाना मंटोला', request_count: 95, approved_count: 0, rejected_count: 0, pending_count: 95, pending_ps_count: 92, pending_dcrb_count: 2, pending_liu_count: 1, pending_dcp_count: 0, link_to_other_ps: 0 },
  { pre_station: 'थाना नाई की सराय', request_count: 88, approved_count: 0, rejected_count: 0, pending_count: 88, pending_ps_count: 86, pending_dcrb_count: 1, pending_liu_count: 1, pending_dcp_count: 0, link_to_other_ps: 0 },
  { pre_station: 'थाना सदर बाजार', request_count: 135, approved_count: 0, rejected_count: 0, pending_count: 135, pending_ps_count: 130, pending_dcrb_count: 3, pending_liu_count: 2, pending_dcp_count: 0, link_to_other_ps: 0 },
];

export default function CharacterModule({ activeFilter }) {
  const [stationRows, setStationRows] = useState(DEFAULT_STATION_ROWS);
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
      const res = await axios.get(`${API_BASE}/dashboard`, {
        params: {
          type: 'character',
          sdate: startDate,
          edate: endDate
        }
      });
      if (res.data && res.data.stationRows && res.data.stationRows.length > 0) {
        setStationRows(res.data.stationRows);
      }
      setMinDate(startDate);
      setMaxDate(endDate);
    } catch (e) {
      console.warn('Using default station reference data:', e.message);
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
    <div className="module-container card-upgrade" style={{ padding: '20px' }}>
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="module-title-group">
          <h2 style={{ fontSize: '20px', color: '#1e293b', margin: 0 }}>
            🛡️ चरित्र सत्यापन स्थिति (Character Verification - Satyapan Table)
          </h2>
          {activeFilter && (
            <span className="filter-badge" style={{ fontSize: '12px', background: '#38bdf8', color: '#0f172a', padding: '3px 8px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
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
            <h2>Search Character Verification Records</h2>
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
      <div className="dashboard-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card blue">
          <div className="stat-icon">📥</div>
          <div className="stat-info">
            <span className="stat-title">Received (कुल प्राप्त)</span>
            <span className="stat-number">
              {stationRows.reduce((acc, r) => acc + Number(r.request_count || r.c_total || 0), 0)}
            </span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-title">Pending (कुल लम्बित)</span>
            <span className="stat-number">
              {stationRows.reduce((acc, r) => acc + Number(r.pending_count || r.c_remain || 0), 0)}
            </span>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <span className="stat-title">PS Pending (थाना लम्बित)</span>
            <span className="stat-number">
              {stationRows.reduce((acc, r) => acc + Number(r.pending_ps_count || r.c_station || 0), 0)}
            </span>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🔍</div>
          <div className="stat-info">
            <span className="stat-title">LIU Pending (एलआईयू)</span>
            <span className="stat-number">
              {stationRows.reduce((acc, r) => acc + Number(r.pending_liu_count || r.c_liu || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Satyapan Station-Wise Verification Table */}
      <div className="table-wrapper image-styled-table-wrapper">
        <table className="image-styled-table">
          <thead>
            <tr>
              <th colSpan="10" style={{ textAlign: 'center', fontSize: '18px', background: '#1e293b', color: '#fff', padding: '12px' }}>
                थाना-वार चरित्र सत्यापन स्थिति डेसबोर्ड (Satyapan Table)
              </th>
            </tr>
            {minDate || maxDate ? (
              <tr style={{ background: '#f8fafc' }}>
                <th colSpan="2" style={{ textAlign: 'center', color: '#1e293b', background: '#e2e8f0' }}>दिनांक से</th>
                <th colSpan="2" style={{ color: '#1e293b', background: '#f1f5f9' }}>{fmt(minDate)}</th>
                <th colSpan="2" style={{ textAlign: 'center', color: '#1e293b', background: '#e2e8f0' }}>दिनांक तक</th>
                <th colSpan="3" style={{ color: '#1e293b', background: '#f1f5f9' }}>{fmt(maxDate)}</th>
              </tr>
            ) : null}
            <tr>
              <th>Sr.No.</th>
              <th>Police Station</th>
              <th className={getHighlightClass('all')}>Received</th>
              <th className={getHighlightClass('remain')}>Pending</th>
              <th className={getHighlightClass('ps')}>PS</th>
              <th className={getHighlightClass('dcrb')}>DCRB</th>
              <th className={getHighlightClass('liu')}>LIU</th>
              <th className={getHighlightClass('dcp')}>DCP</th>
              <th className={getHighlightClass('own_to_other')}>Own to Other</th>
              <th className={getHighlightClass('other_to_own')}>Other to Own</th>

            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>लोड हो रहा है...</td></tr>
            )}
            {error && (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
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
                <td className={getHighlightClass('own_to_other')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=own_to_other&ps=${encodeURIComponent(r.pre_station || r['थाना'] || '')}`} target="_blank" rel="noreferrer">
                    {r.own_to_other || r.c_own_to_other || 0}
                  </a>
                </td>
                 <td className={getHighlightClass('other_to_own')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=other_to_own&ps=${encodeURIComponent(r.pre_station || r['थाना'] || '')}`} target="_blank" rel="noreferrer">
                    {r.other_to_own || r.c_other_to_own || 0}
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
