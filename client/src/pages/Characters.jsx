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
  complaint: 'शिकायत निवारण',
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

const LIST_ENDPOINTS = {
  character: '/characterList',
  employee: '/employeeList',
  tenant: '/tenantList',
  domestic: '/domesticList',
  complaint : '/complaintList',
  postmortem : '/postmortemList'

};

 
const hideStatus = (loc) => ['totaldcp','totalliu','totaldcrb','totalps','totalremain'].includes(loc);
const hidePraAdd = (loc) => ['totaldcp','totalliu','totaldcrb','totalps','totalremain'].includes(loc);
const hidePreAdd = (type) =>['complaint', 'postmortem'].includes(type);

function fmt(d) { return d ? d.split('-').reverse().join('-') : ''; }

export default function Characters() {
  const [searchParams] = useSearchParams();
  const loc = searchParams.get('loc');
  const type = searchParams.get('type');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tableRef = useRef(null);

useEffect(() => {
  const fetchData = async () => {
    try { 
      setLoading(true);
      setError("");
      setRows([]);

      const endpoint = LIST_ENDPOINTS[type];
      if (!endpoint) {
        throw new Error('Unsupported verification type');
      }
      const res = await axios.get(endpoint, {
        params: { loc },
        ...getAuthConfig(),
      });

      setRows(res.data || []);
      console.log(" res.data ", res.data);

    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };
console.log("hidePreAdd " , hidePreAdd(type));


  fetchData();
}, [loc, type]);


  const moduleName = MODULE_NAMES[type] || MODULE_NAMES.character;
  const locHeading = LOC_HEADINGS[loc] || '';
  const heading = `${locHeading} ${moduleName}`.trim();
  const hideStatusCol = hideStatus(loc);
  const hidePraAddCol = hidePraAdd(loc);
  const hidePreAddCol = hidePreAdd(type);

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
               {!hidePreAddCol && <th>PRESENT ADDRESS</th>}
              {!hidePreAddCol ?  <th> PRESENT ADD STATUS</th> :  <th> STATUS</th> }
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
                <td>{r['थाना'] || r.pre_station_name}</td>
                <td>{r['अनुरोध_संख्या'] || r.request_number}</td>
                <td>{formatDate(r['अनुरोध_दिनांक'] || r.request_date)}</td>
                <td>{r['आवेदक_का_नाम'] || r.applicant_name}</td>
                {!hidePreAddCol && <td>{r.present_address}</td>}
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
