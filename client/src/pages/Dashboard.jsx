import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getDashboard, getDashboardByDate, getMinDate, getMaxDate } from '../api';

// Format date from YYYY-MM-DD to DD-MM-YYYY (matching PHP display)
function fmt(dateStr) {
  if (!dateStr) return '';
  return dateStr.split('-').reverse().join('-');
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sdate, setSdate] = useState('');
  const [edate, setEdate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDefault();
  }, []);

  async function loadDefault() {
    setLoading(true);
    setError('');
    try {
      const [data, minD, maxD] = await Promise.all([
        getDashboard(),
        getMinDate(),
        getMaxDate(),
      ]);
      setRows(data);
      setMinDate(minD.minDate || '');
      setMaxDate(maxD.maxDate || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!sdate || !edate) { alert('कृपया दोनों दिनांक भरें'); return; }
    setLoading(true);
    setShowSearch(false);
    try {
      const data = await getDashboardByDate(sdate, edate);
      setRows(data);
      setMinDate(sdate);
      setMaxDate(edate);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Totals
  const totals = rows.reduce(
    (acc, r) => ({
      total:   acc.total   + (r.c_total   || 0),
      remain:  acc.remain  + (r.c_remain  || 0),
      station: acc.station + (r.c_station || 0),
      dcrb:    acc.dcrb    + (r.c_dcrb    || 0),
      liu:     acc.liu     + (r.c_liu     || 0),
      dcp:     acc.dcp     + (r.c_dcp     || 0),
    }),
    { total: 0, remain: 0, station: 0, dcrb: 0, liu: 0, dcp: 0 }
  );

  const detailLink = (CUG, loc, ps) =>
    `/detail?CUG=${encodeURIComponent(CUG || '')}&sdate=${minDate}&edate=${maxDate}&loc=${loc}&ps=${encodeURIComponent(ps || '')}`;

  return (
    <>
      <Navbar />

      {/* Search Modal */}
      {showSearch && (
        <div className="search-modal-overlay">
          <form className="search-form" onSubmit={handleSearch}>
            <h2>Search Characters</h2>
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

      {/* Search Trigger Button */}
      <div className="search-btn-container">
        <button onClick={() => setShowSearch(true)}>SEARCH</button>
      </div>

      {/* Dashboard Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th colSpan="8" style={{ textAlign: 'center' }}>चरित्र प्रमाण पत्र डेसबोर्ड</th>
            </tr>
            <tr>
              <th colSpan="2" style={{ textAlign: 'center' }}>दिनांक से</th>
              <th colSpan="3">{fmt(minDate)}</th>
              <th colSpan="1" style={{ textAlign: 'center' }}>दिनांक तक</th>
              <th colSpan="2">{fmt(maxDate)}</th>
            </tr>
            <tr>
              <th>क्र0सं0</th>
              <th>नाम थाना</th>
              <th>प्राप्त</th>
              <th>लम्बित</th>
              <th>थाने</th>
              <th>डीसीआरबी</th>
              <th>एलआईयू</th>
              <th>डीसीपी</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>लोड हो रहा है...</td></tr>
            )}
            {error && (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
            )}
            {!loading && rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{r['थाना']}</td>
                <td><a href={detailLink(r.CUG, 'all', r['थाना'])} target="_blank" rel="noreferrer">{r.c_total || 0}</a></td>
                <td><a href={detailLink(r.CUG, 'remain', r['थाना'])} target="_blank" rel="noreferrer">{r.c_remain || 0}</a></td>
                <td><a href={detailLink(r.CUG, 'ps', r['थाना'])} target="_blank" rel="noreferrer">{r.c_station || 0}</a></td>
                <td><a href={detailLink(r.CUG, 'dcrb', r['थाना'])} target="_blank" rel="noreferrer">{r.c_dcrb || 0}</a></td>
                <td><a href={detailLink(r.CUG, 'liu', r['थाना'])} target="_blank" rel="noreferrer">{r.c_liu || 0}</a></td>
                <td><a href={detailLink(r.CUG, 'dcp', r['थाना'])} target="_blank" rel="noreferrer">{r.c_dcp || 0}</a></td>
              </tr>
            ))}
          </tbody>

          {/* Totals row */}
          {!loading && rows.length > 0 && (
            <tfoot>
              <tr>
                <th colSpan="2">कुल योग</th>
                <th>{totals.total}</th>
                <th><a href={`/detail?loc=totalremain&sdate=${minDate}&edate=${maxDate}`} target="_blank" rel="noreferrer">{totals.remain}</a></th>
                <th><a href={`/detail?loc=totalps&sdate=${minDate}&edate=${maxDate}`} target="_blank" rel="noreferrer">{totals.station}</a></th>
                <th><a href={`/detail?loc=totaldcrb&sdate=${minDate}&edate=${maxDate}`} target="_blank" rel="noreferrer">{totals.dcrb}</a></th>
                <th><a href={`/detail?loc=totalliu&sdate=${minDate}&edate=${maxDate}`} target="_blank" rel="noreferrer">{totals.liu}</a></th>
                <th><a href={`/detail?loc=totaldcp&sdate=${minDate}&edate=${maxDate}`} target="_blank" rel="noreferrer">{totals.dcp}</a></th>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}
