import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config/env';

export default function CombinedDashboardModule({ activeFilter }) {
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
    console.log("activeFilter in charcter  filter ", activeFilter);
    try {
      const res = await axios.get(`${API_BASE}/combinedDashbaord`, {
        params: {
          type: 'combined',
          sdate: startDate,
          edate: endDate
        }
      });
      if (res.data && res.data.DashboardResult && res.data.DashboardResult.length > 0) {
        console.log(' res.data.DashboardResult.length ', res.data.DashboardResult.length);
        console.log(' res.data.DashboardResult ',res.data.DashboardResult);

      setStationRows(res.data?.DashboardResult || []);
      }
      // setMinDate(startDate);
      // setMaxDate(endDate);
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

      

      {/* Satyapan Station-Wise Verification Table */}
      <div className="table-wrapper image-styled-table-wrapper">
        <table className="image-styled-table">
          <thead>
            <tr>
              <th colSpan="10" style={{ textAlign: 'center', fontSize: '18px', background: '#1e293b', color: '#fff', padding: '12px' }}>
                 Verification Dashboard 
                <br />
                 <p  style={{ fontSize: '12px', }}  >FROM 01.07.2026 TO 31.07.2026</p> 
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
              <th>Verification Type</th>
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
                <td style={{ fontWeight: '600' }}>{r.verification_type }</td>
                <td className={getHighlightClass('all')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=all&ps=${encodeURIComponent(r.pre_station  || '')}`} target="_blank" rel="noreferrer">
                    {r.request_count || r.c_total || 0}
                  </a>
                </td>
                <td className={getHighlightClass('remain')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=remain&ps=${encodeURIComponent(r.pre_station  || '')}`} target="_blank" rel="noreferrer">
                    {r.pending_count || r.c_remain || 0}
                  </a>
                </td>
                <td className={getHighlightClass('ps')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=ps&ps=${encodeURIComponent(r.pre_station  || '')}`} target="_blank" rel="noreferrer">
                    {r.pending_ps_count || r.c_station || 0}
                  </a>
                </td>
                <td className={getHighlightClass('dcrb')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=dcrb&ps=${encodeURIComponent(r.pre_station  || '')}`} target="_blank" rel="noreferrer">
                    {r.pending_dcrb_count || r.c_dcrb || 0}
                  </a>
                </td>
                <td className={getHighlightClass('liu')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=liu&ps=${encodeURIComponent(r.pre_station  || '')}`} target="_blank" rel="noreferrer">
                    {r.pending_liu_count || r.c_liu || 0}
                  </a>
                </td>
                <td className={getHighlightClass('dcp')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=dcp&ps=${encodeURIComponent(r.pre_station  || '')}`} target="_blank" rel="noreferrer">
                    {r.pending_dcp_count || r.c_dcp || 0}
                  </a>
                </td>
                <td className={getHighlightClass('own_to_other')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=own_to_other&ps=${encodeURIComponent(r.pre_station  || '')}`} target="_blank" rel="noreferrer">
                    {r.own_to_other || r.c_own_to_other || 0}
                  </a>
                </td>
                 <td className={getHighlightClass('other_to_own')}>
                  <a href={`/detail?type=character&CUG=${encodeURIComponent(r.CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=other_to_own&ps=${encodeURIComponent(r.pre_station  || '')}`} target="_blank" rel="noreferrer">
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
