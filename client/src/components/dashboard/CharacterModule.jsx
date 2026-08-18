import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE } from '../../config/env';
export default function CharacterModule({ activeFilter,activeModule, sdate, edate }) {
  const [stationRows, setStationRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadStationData();
  }, [activeModule,sdate]);

  async function loadStationData() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/dashboard`, {
        params: {
          type: activeModule,
          sdate: sdate,
          edate: edate
        }
      });
      if (res.data && res.data.stationRows && res.data.stationRows.length > 0) {
        setStationRows(res.data.stationRows);
        // console.log("res.data.stationRows ",res.data.stationRows);
      }
    } catch (e) {
      console.warn('Using default station reference data:', e.message);
    } finally {
      setLoading(false);
    }
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
      {/* Satyapan Station-Wise Verification Table */}
      <div className="table-wrapper image-styled-table-wrapper">
        <table className="image-styled-table">
          <thead>
            <tr>
              <th colSpan="10" style={{ textAlign: 'center', fontSize: '18px', background: '#1e293b', color: '#fff', padding: '12px' }}>
                {activeModule?.charAt(0).toUpperCase() + activeModule?.slice(1)} Dashboard 
              </th>
            </tr>
           
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
                <td style={{ fontWeight: '600' }}>{r.pre_station_name }</td>
                <td className={getHighlightClass('all')}>
                  <Link to={`/characters?type=${activeModule}&sdate=${sdate}&edate=${edate}&loc=all&ps=${encodeURIComponent(r.pre_station_code || r.pre_station_name || '')}`}>
                    {r.request_count || r.c_total || 0}
                  </Link>
                </td>
                <td className={getHighlightClass('remain')}>
                  <Link to={`/characters?type=${activeModule}&sdate=${sdate}&edate=${edate}&loc=remain&ps=${encodeURIComponent(r.pre_station_code || r.pre_station_name || '')}`}>
                    {r.pending_count || r.c_remain || 0}
                  </Link>
                </td>
                <td className={getHighlightClass('ps')}>
                  <Link to={`/characters?type=${activeModule}&sdate=${sdate}&edate=${edate}&loc=ps&ps=${encodeURIComponent(r.pre_station_code || r.pre_station_name || '')}`}>
                    {r.pending_ps_count || r.c_station || 0}
                  </Link>
                </td>
                <td className={getHighlightClass('dcrb')}>
                  <Link to={`/characters?type=${activeModule}&sdate=${sdate}&edate=${edate}&loc=dcrb&ps=${encodeURIComponent(r.pre_station_code || r.pre_station_name || '')}`}>
                    {r.pending_dcrb_count || r.c_dcrb || 0}
                  </Link>
                </td>
                <td className={getHighlightClass('liu')}>
                  <Link to={`/characters?type=${activeModule}&sdate=${sdate}&edate=${edate}&loc=liu&ps=${encodeURIComponent(r.pre_station_code || r.pre_station_name || '')}`}>
                    {r.pending_liu_count || r.c_liu || 0}
                  </Link>
                </td>
                <td className={getHighlightClass('dcp')}>
                  <Link to={`/characters?type=${activeModule}&sdate=${sdate}&edate=${edate}&loc=dcp&ps=${encodeURIComponent(r.pre_station_code || r.pre_station_name || '')}`}>
                    {r.pending_dcp_count || r.c_dcp || 0}
                  </Link>
                </td>
                <td className={getHighlightClass('own_to_other')}>
                  <Link to={`/characters?type=${activeModule}&sdate=${sdate}&edate=${edate}&loc=own_to_other&ps=${encodeURIComponent(r.pre_station_code || r.pre_station_name || '')}`}>
                    {r.own_to_other || r.c_own_to_other || 0}
                  </Link>
                </td>
                 <td className={getHighlightClass('other_to_own')}>
                  <Link to={`/characters?type=${activeModule}&sdate=${sdate}&edate=${edate}&loc=other_to_own&ps=${encodeURIComponent(r.pre_station_code || r.pre_station_name || '')}`}>
                    {r.other_to_own || r.c_other_to_own || 0}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
