import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AgingSummaryTable from '../components/dashboard/AgingSummaryTable';
import CharacterModule from '../components/dashboard/CharacterModule';
import CombinedDashboardModule from '../components/dashboard/CombinedDashboardModule';
import DomesticModule from '../components/dashboard/DomesticModule';
import TenantModule from '../components/dashboard/TenantModule';
import EmployeeModule from '../components/dashboard/EmployeeModule';
import getAuthConfig from "../functions/getAuthConfig";


// Reference Aging Dataset
const DEFAULT_AGING_DATA = [
  { sno: 1, typeKey: 'employee', label: 'कर्मचारी सत्यापन', d15: 32, d30: 0, d90: 0, d180: 2, d365: 0, dAbove1: 0 },
  { sno: 2, typeKey: 'domestic', label: 'घरेलू सहायता सत्यापन', d15: 9, d30: 4, d90: 2, d180: 0, d365: 0, dAbove1: 0 },
  { sno: 3, typeKey: 'character', label: 'चरित्र सत्यापन', d15: 1747, d30: 0, d90: 0, d180: 0, d365: 0, dAbove1: 0 },
  { sno: 4, typeKey: 'postmortem', label: 'पोस्टमार्टम रिपोर्ट अनुरोध', d15: 1, d30: 0, d90: 0, d180: 0, d365: 0, dAbove1: 0 },
  { sno: 5, typeKey: 'complaints', label: 'शिकायत', d15: 3, d30: 1, d90: 0, d180: 0, d365: 0, dAbove1: 0 },
];

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const locParam = searchParams.get('loc');

  // Handle active component states: null (Overview), 'character', 'domestic', 'tenant', 'employee'
  const [activeModule, setActiveModule] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  const [agingRows, setAgingRows] = useState(DEFAULT_AGING_DATA);
  const [showSearch, setShowSearch] = useState(false);
  const [sdate, setSdate] = useState('');
  const [edate, setEdate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Synchronize state with URL parameters
  useEffect(() => {
    if (typeParam && ['character', 'domestic', 'tenant', 'employee'].includes(typeParam)) {
      setActiveModule(typeParam);
      setActiveFilter(locParam || null);
    } else {
      setActiveModule(null);
      setActiveFilter(null);
    }

    console.log(" typeParam ", typeParam, "locParam ", locParam);
  }, [typeParam, locParam]);

  useEffect(() => {
    loadDashboardData();
  }, [typeParam]);

  async function loadDashboardData() {
    setLoading(true);
    setError('');
    try {
const res = await axios.get('/dashboard', {   params: { type: typeParam },   ...getAuthConfig(), });
      if (res.data && res.data.agingSummary && Array.isArray(res.data.agingSummary) && res.data.agingSummary.length > 0) {
        const merged = DEFAULT_AGING_DATA.map(def => {
          const found = res.data.agingSummary.find(r => r.app_type === def.label);
          if (found && (found.d15 > 0 || found.d30 > 0 || found.d90 > 0 || found.d180 > 0 || found.d365 > 0 || found.dAbove1 > 0)) {
            return {
              ...def,
              d15: found.d15,
              d30: found.d30,
              d90: found.d90,
              d180: found.d180,
              d365: found.d365,
              dAbove1: found.dAbove1,
            };
          }
          return def;
        });
        setAgingRows(merged);
      }
    } catch (e) {
      console.warn('Using default aging dataset:', e.message);
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
      const res = await axios.get('/dashboard', { params: { sdate, edate, type: typeParam } }, getAuthConfig());
      if (res.data?.agingSummary) setAgingRows(res.data.agingSummary);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectModule = (mod) => {
    if (mod === 'all' || !mod) {
      setActiveModule(null);
      setActiveFilter(null);
      setSearchParams({});
    } else {
      setActiveModule(mod);
      setSearchParams({ type: mod });
    }
  };

  // Calculate Aging Totals
  const agingTotals = agingRows.reduce(
    (acc, r) => ({
      d15: acc.d15 + Number(r.d15 || 0),
      d30: acc.d30 + Number(r.d30 || 0),
      d90: acc.d90 + Number(r.d90 || 0),
      d180: acc.d180 + Number(r.d180 || 0),
      d365: acc.d365 + Number(r.d365 || 0),
      dAbove1: acc.dAbove1 + Number(r.dAbove1 || 0),
    }),
    { d15: 0, d30: 0, d90: 0, d180: 0, d365: 0, dAbove1: 0 }
  );

  return (
    <>
      <Navbar />

      <div className="dashboard-container" style={{ padding: '20px 30px' }}>

        

        {/* Search Modal */}
        {showSearch && (
          <div className="search-modal-overlay">
            <form className="search-form" onSubmit={handleSearch}>
              <h2>दिनांक द्वारा रिकॉर्ड खोजें</h2>
              <div className="inputs">
                <label>आरम्भ दिनांक (From Date)</label>
                <input type="date" value={sdate} onChange={e => setSdate(e.target.value)} />
              </div>
              <div className="inputs">
                <label>अंतिम दिनांक (To Date) <span style={{ color: 'red' }}>*</span></label>
                <input type="date" value={edate} onChange={e => setEdate(e.target.value)} required />
              </div>
              <div className="btn-container">
                <button type="submit">SEARCH</button>
                <button type="button" onClick={() => setShowSearch(false)}>CLOSE</button>
              </div>
            </form>
          </div>
        )}

        {/* ── DYNAMIC SUB-COMPONENT DISPLAY AREA ── */}
        <div className="main-content-display-area" style={{ marginTop: '12px' }}>
          
          {/* Landing Overview: Shows Metric Summary Cards & Aging Summary Table */}
          {!activeModule && (
            <>
              {/* Stat Cards Grid */}
              <div className="dashboard-stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card blue">
                  <div className="stat-icon">📑</div>
                  <div className="stat-info">
                    <span className="stat-title">कुल प्राप्त आवेदन</span>
                    <span className="stat-number">1,791</span>
                  </div>
                </div>
                <div className="stat-card orange">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <span className="stat-title">लम्बित सत्यापन</span>
                    <span className="stat-number">1,788</span>
                  </div>
                </div>
                <div className="stat-card teal">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <span className="stat-title">सत्यापित एवं निस्तारित</span>
                    <span className="stat-number">3</span>
                  </div>
                </div>
                <div className="stat-card purple">
                  <div className="stat-icon">🏢</div>
                  <div className="stat-info">
                    <span className="stat-title">थाने स्तर पर लम्बित</span>
                    <span className="stat-number">1,747</span>
                  </div>
                </div>
              </div>

              {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#1e293b' }}>डेटा लोड हो रहा है...</div>}
              {error && <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>{error}</div>}
              
              {!loading && !error && (
       <>
       <AgingSummaryTable agingRows={agingRows} agingTotals={agingTotals} />
       
        <CombinedDashboardModule activeFilter={activeFilter} />
</>
)}
            </>
          )}

          {/* Module 1: Character (Contains the Satyapan Station Table) */}
          {activeModule === 'character' && (
            <CharacterModule activeFilter={activeFilter} />
          )}

          {/* Module 2: Domestic */}
          {activeModule === 'domestic' && (
            <DomesticModule activeFilter={activeFilter} />
          )}

          {/* Module 3: Tenant */}
          {activeModule === 'tenant' && (
            <TenantModule activeFilter={activeFilter} />
          )}

          {/* Module 4: Employee */}
          {activeModule === 'employee' && (
            <EmployeeModule activeFilter={activeFilter} />
          )}

        </div>

      </div>
    </>
  );
}
