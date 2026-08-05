import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import {formatDate} from '../utils/dataConvertor';
import getAuthConfig from "../functions/getAuthConfig";



const MODULE_NAMES = {
  character: 'चरित्र प्रमाण पत्र',
  tenant: 'किरायेदार सत्यापन',
  domestic: 'घरेलू सहायक सत्यापन',
  employee: 'कर्मचारी सत्यापन',
  complaints: 'शिकायत निवारण',
  all: 'सत्यापन',
};

const LOC_HEADINGS = {
  totaldcp:     'कुल डीसीपी पर लम्बित',
  totalliu:     'कुल एलआईयू पर लम्बित',
  totaldcrb:    'कुल डीसीआरबी पर लम्बित',
  totalps:      'कुल थानों पर लम्बित',
  totalremain:  'समस्त पश्चिमी जोन पर लम्बित',
  totaldiff:    'अन्य थानों से सम्बन्धित लम्बित',
};

 
const hideStatus = (loc) => ['totaldcp','totalliu','totaldcrb','totalps','totalremain'].includes(loc);
const hidePraAdd = (loc) => ['totaldcp','totalliu','totaldcrb','totalps','totalremain'].includes(loc);

function fmt(d) { return d ? d.split('-').reverse().join('-') : ''; }

export default function Characters() {
  const [searchParams] = useSearchParams();
  const loc = searchParams.get('loc') || 'totalremain';
  const type = searchParams.get('type') || 'character';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tableRef = useRef(null);

useEffect(() => {
  console.log("called charcters.jsx useEffect", loc, type);
  console.log("called charcters.jsx useEffect", getAuthConfig());
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      setRows([]);

      //  ...getAuthConfig()
      // const res = await axios.get("/characterList",getAuthConfig());

      const res = await axios.get(`/characterList?loc=${loc}&type=${type}`, getAuthConfig());

      setRows(res.data || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [loc, type]);


  const moduleName = MODULE_NAMES[type] || MODULE_NAMES.character;
  const locHeading = LOC_HEADINGS[loc] || '';
  const heading = `${locHeading} ${moduleName}`.trim();
  const hideStatusCol = hideStatus(loc);
  const hidePraAddCol = hidePraAdd(loc);

  return (
    <>
      <Navbar />


      <div className="table-wrapper">
        <table id="printable" ref={tableRef}>
          <thead>
            {heading && (
              <tr><th colSpan="9" style={{ textAlign: 'center', fontSize: '18px' }}>{heading}</th></tr>
            )}
            <tr>
              <th>Sr.No.</th>
              <th>POLICE STATION</th>
              <th>REQUEST NUMBER</th>
              <th>REQUEST DATE</th>
              <th>APPLICANT NAME</th>
              <th>PRESENT ADDRESS</th>
              <th> PRESENT ADD STATUS</th>
              {!hidePraAddCol && <th>PERMANENT ADDRESS</th>}
              {!hideStatusCol && <th> PERMANENT ADD STATUS</th>}
            </tr>
          </thead>
          <tbody id="pending_Details">
            {loading && (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>लोड हो रहा है...</td></tr>
            )}
            {error && (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
            )}
            {!loading && rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{r['थाना'] || r.pre_station}</td>
                <td>{r['अनुरोध_संख्या'] || r.request_number}</td>
                <td>{formatDate(r['अनुरोध_दिनांक'] || r.request_date)}</td>
                <td>{r['आवेदक_का_नाम'] || r.applicant_name}</td>
                <td>{r.present_address}</td>
                <td>{r.pre_Current_Status}</td>

                {!hidePraAddCol && <td>{ r.permanent_address}</td>}
                {!hideStatusCol && <td>{ r.per_Current_Status}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

