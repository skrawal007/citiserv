import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE } from '../../config/env';
import { useQueue } from '../../context/QueueContext';

// Keep the initial dashboard response for this browser page session. React
// Strict Mode may remount this component in development; a remount must not
// request a second, potentially different dashboard snapshot.
let initialDashboardRequest = null;

function fetchCombinedDashboard(sdate, edate) {
  const isInitialLoad = !sdate && !edate;

  if (isInitialLoad && initialDashboardRequest) {
    return initialDashboardRequest;
  }

  const request = axios.get(`${API_BASE}/combinedDashbaord`, {
    params: {
      type: 'combined',
      sdate: sdate,
      edate: edate,
    },
  });

  if (isInitialLoad) {
    initialDashboardRequest = request;
    request.catch(() => {
      initialDashboardRequest = null;
    });
  }

  return request;
}

export default function CombinedDashboardModule({ activeFilter, sdate, edate}) {
  const [stationRows, setStationRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Re-fetch whenever a queued job finishes
  const { dashboardRefreshKey } = useQueue();

  useEffect(() => {
    // On a queue-triggered refresh, invalidate the cache so fresh data arrives
    if (dashboardRefreshKey > 0) {
      initialDashboardRequest = null;
    }
    loadStationData(sdate, edate);
  }, [sdate, edate, dashboardRefreshKey]);

  async function loadStationData(sdate, edate) {
    setLoading(true);
    setError('');
    // console.log("activeFilter in charcter  filter ", activeFilter);
    try {
      const res = await fetchCombinedDashboard(sdate, edate);
      if (res.data && res.data.DashboardResult && res.data.DashboardResult.length > 0) {
        // console.log(' res.data.DashboardResult.length ', res.data.DashboardResult.length);
        // console.log(' res.data.DashboardResult ',res.data.DashboardResult);
        setStationRows(res.data?.DashboardResult || []);
      }
      // setMinDate(sdate);
      // setMaxDate(edate);
    } catch (e) {
      console.warn('Using default station reference data:', e.message);
    } finally {
      setLoading(false);
    }
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
      
      {/* Satyapan Station-Wise Verification Table */}
      <div className="table-wrapper image-styled-table-wrapper">
        <table className="image-styled-table">
          <thead>
            <tr>
              <th colSpan="10" style={{ textAlign: 'center', fontSize: '18px', background: '#1e293b', color: '#fff', padding: '12px' }}>
                 Verification Dashboard 
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
    <tr>
      <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>
        लोड हो रहा है...
      </td>
    </tr>
  )}

  {error && (
    <tr>
      <td colSpan="10" style={{ textAlign: 'center', color: 'red' }}>
        {error}
      </td>
    </tr>
  )}

  {!loading &&
    stationRows.map((r, i) => {
      const map = {
        Tenants: 'tenant',
        Employee: 'employee',
        Character: 'character',
        Domestic: 'domestic',
      };

      const linkType = map[r.verification_type] || 'character';
      const isTotal = r.verification_type === 'TOTAL';

      // If TOTAL, show plain text; otherwise show Link
      const renderValue = (value, loc) => {
        const displayValue = value || 0;

        if (isTotal) {
          return displayValue;
        }

        return (
          <Link
            to={`/characters?type=${linkType}&sdate=${sdate}&edate=${edate}&loc=${loc}`}
          >
            {displayValue}
          </Link>
        );
      };

      return (
        <tr key={i} className={i % 2 === 1 ? 'alt-row' : ''}>
          <td>{i + 1}</td>

          <td style={{ fontWeight: '600' }}>
            {r.verification_type}
          </td>

          <td className={getHighlightClass('all')}>
            {renderValue(r.request_count || r.c_total, 'all')}
          </td>

          <td className={getHighlightClass('remain')}>
            {renderValue(r.pending_count || r.c_remain, 'remain')}
          </td>

          <td className={getHighlightClass('ps')}>
            {renderValue(r.pending_ps_count || r.c_station, 'ps')}
          </td>

          <td className={getHighlightClass('dcrb')}>
            {renderValue(r.pending_dcrb_count || r.c_dcrb, 'dcrb')}
          </td>

          <td className={getHighlightClass('liu')}>
            {renderValue(r.pending_liu_count || r.c_liu, 'liu')}
          </td>

          <td className={getHighlightClass('dcp')}>
            {renderValue(r.pending_dcp_count || r.c_dcp, 'dcp')}
          </td>

          <td className={getHighlightClass('own_to_other')}>
            {renderValue(
              r.own_to_other || r.c_own_to_other,
              'own_to_other'
            )}
          </td>

          <td className={getHighlightClass('other_to_own')}>
            {renderValue(
              r.other_to_own || r.c_other_to_own,
              'other_to_own'
            )}
          </td>
        </tr>
      );
    })}
</tbody>
        </table>
      </div>
    </div>
  );
}
