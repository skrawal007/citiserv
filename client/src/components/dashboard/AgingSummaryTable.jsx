import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config/env';
import { Link } from 'react-router-dom';
import { useQueue } from '../../context/QueueContext';

export default function AgingSummaryTable({ setSdate, setEdate }) {
  const [stationRows, setStationRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Re-fetch whenever a queued job finishes
  const { dashboardRefreshKey } = useQueue();

  const detailLink = (typeKey, daysRange) => {
    let url = `/characters?type=${typeKey}&loc=remain`;

    if (daysRange) {
      url += `&days=${daysRange}`;
    }

    return url;
  };

  useEffect(() => {
    loadStationData();
  }, [dashboardRefreshKey]);

  async function loadStationData() {
    setLoading(true);
    setError('');

    try {
      const res = await axios.get(
        `${API_BASE}/PendingDurationSummary`
      );

      if (res.data.result && res.data.result.length > 0) {
        setStationRows(res.data.result);
      }
    } catch (e) {
      console.warn(
        'Unable to load aging summary data:',
        e.message
      );

      setError('Unable to load aging summary data.');
    } finally {
      setLoading(false);
    }
  }

  const handleRangeClick = (typeKey, daysRange) => {
    console.log('Clicked typeKey:', typeKey);
    console.log('Clicked daysRange:', daysRange);

    const { sdate, edate } = getDateRangeFromDays(daysRange);

    console.log('sdate:', sdate);
    console.log('edate:', edate);

    setSdate(sdate);
    setEdate(edate);
  };

  const getDateRangeFromDays = (daysRange) => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    // Above 1 year
    if (daysRange === '365+') {
      const edate = new Date(today);

      edate.setDate(edate.getDate() - 365);

      return {
        sdate: null,
        edate: formatDate(edate),
      };
    }

    // Example:
    // 0-15
    // 16-30
    // 31-90
    // 91-180
    // 181-365

    const [minDays, maxDays] = daysRange
      .split('-')
      .map(Number);

    const sdate = new Date(today);
    sdate.setDate(sdate.getDate() - maxDays);

    const edate = new Date(today);
    edate.setDate(edate.getDate() - minDays);

    return {
      sdate: formatDate(sdate),
      edate: formatDate(edate),
    };
  };

  return (
    <div className="table-wrapper image-styled-table-wrapper card-upgrade">
      <div className="table-header-title">
        <h3>
          📊 Aging Summary
        </h3>
      </div>

      <table className="image-styled-table">
        <thead>
          <tr>
            <th className="th-sno">SNo.</th>
            <th className="th-app-type">Application Type</th>
            <th>Total Pending</th>
            <th>Within 15 days</th>
            <th>Between 16 to 30 days</th>
            <th>Between 31 to 90 days</th>
            <th>Between 91 to 180 days</th>
            <th>Between 181 to 365 days</th>
            <th>Above 01 year</th>
          </tr>
        </thead>

        <tbody>
          {stationRows.map((r, i) => (
            <tr
              key={i}
              className={i % 2 === 1 ? 'alt-row' : ''}
            >
              <td className="td-sno">
                {r.sno || i + 1}
              </td>

              <td className="td-app-type">
                {r.ApplicationType}
              </td>

              {/* Total */}
              <td className="td-count">
                <Link
                  to={detailLink(r.typeKey)}
                  className="count-link"
                >
                  {r.Total}
                </Link>
              </td>

              {/* 0 - 15 */}
              <td className="td-count">
                <Link
                  to={detailLink(r.typeKey, '0-15')}
                  onClick={() =>
                    handleRangeClick(r.typeKey, '0-15')
                  }
                  className="count-link"
                >
                  {r.Within15Days}
                </Link>
              </td>

              {/* 16 - 30 */}
              <td className="td-count">
                <Link
                  to={detailLink(r.typeKey, '16-30')}
                  onClick={() =>
                    handleRangeClick(r.typeKey, '16-30')
                  }
                  className="count-link"
                >
                  {r.Between16To30Days}
                </Link>
              </td>

              {/* 31 - 90 */}
              <td className="td-count">
                <Link
                  to={detailLink(r.typeKey, '31-90')}
                  onClick={() =>
                    handleRangeClick(r.typeKey, '31-90')
                  }
                  className="count-link"
                >
                  {r.Between31To90Days}
                </Link>
              </td>

              {/* 91 - 180 */}
              <td className="td-count">
                <Link
                  to={detailLink(r.typeKey, '91-180')}
                  onClick={() =>
                    handleRangeClick(r.typeKey, '91-180')
                  }
                  className="count-link"
                >
                  {r.Between91To180Days}
                </Link>
              </td>

              {/* 181 - 365 */}
              <td className="td-count">
                <Link
                  to={detailLink(r.typeKey, '181-365')}
                  onClick={() =>
                    handleRangeClick(r.typeKey, '181-365')
                  }
                  className="count-link"
                >
                  {r.Between181To365Days}
                </Link>
              </td>

              {/* 365+ */}
              <td className="td-count">
                <Link
                  to={detailLink(r.typeKey, '365+')}
                  onClick={() =>
                    handleRangeClick(r.typeKey, '365+')
                  }
                  className="count-link"
                >
                  {r.Above01Year}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}