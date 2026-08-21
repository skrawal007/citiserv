import React, { useState, useEffect }from 'react';
import axios from 'axios';
import { API_BASE } from '../../config/env';
import { Link } from 'react-router-dom';

export default function AgingSummaryTable() {
  
    const [stationRows, setStationRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
  const detailLink = (typeKey, daysRange) => {
    let url = `/characters?type=${typeKey}&loc=remain`;
    if (daysRange) {
      url += `&days=${daysRange}`;
    }
    return url;
  };


    useEffect(() => {
    loadStationData();
  }, []);

  async function loadStationData() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/PendingDurationSummary`);
     
      // console.log(res.data.data);
     
      if (res.data.result && res.data.result && res.data.result.length > 0) {
        setStationRows(res.data.result);
        // console.log("res.data.result ",res.data.result);
      }
    } catch (e) {
      console.warn('Using default station reference data:', e.message);
    } finally {
      setLoading(false);
    }
  }






  return (
    <div className="table-wrapper image-styled-table-wrapper card-upgrade">
      <div className="table-header-title">
        <h3>📊 आवेदन प्रकार समय-सीमा स्थिति (Aging Summary)</h3>
      </div>
      <table className="image-styled-table">
        <thead>
          <tr>
            <th className="th-sno">SNo.</th>
            <th className="th-app-type">Application Type</th>
            <th>Total Pending </th>
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
            <tr key={i} className={i % 2 === 1 ? 'alt-row' : ''}>
              <td className="td-sno">{r.sno || i + 1}</td>
              <td className="td-app-type">{r.ApplicationType}</td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey)} className="count-link">{r.Total}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey, '0-15')} className="count-link">{r.Within15Days}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey, '16-30')} className="count-link">{r.Between16To30Days}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey, '31-90')} className="count-link">{r.Between31To90Days}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey, '91-180')} className="count-link">{r.Between91To180Days}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey, '181-365')} className="count-link">{r.Between181To365Days}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey, '365+')} className="count-link">{r.Above01Year}</Link>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
