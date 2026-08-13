import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const MODULE_NAMES = {
  character: 'चरित्र प्रमाण पत्र',
  tenant: 'किरायेदार सत्यापन',
  domestic: 'घरेलू सहायक सत्यापन',
  employee: 'कर्मचारी सत्यापन',
  complaint: 'शिकायत निवारण',
  all: 'सत्यापन',
};

const LOC_HEADINGS = {
  liu: 'एलआईयू पर लम्बित',
  ps: 'थाने पर लम्बित',
  dcrb: 'डीसीआरबी पर लम्बित',
  dcp: 'डीसीपी पर लम्बित',
  remain: 'कुल लम्बित',
  all: 'कुल',
  totaldcp: 'कुल डीसीपी पर लम्बित',
  totalliu: 'कुल एलआईयू पर लम्बित',
  totaldcrb: 'कुल डीसीआरबी पर लम्बित',
  totalps: 'कुल थानों पर लम्बित',
  totalremain: 'समस्त पश्चिमी जोन पर लम्बित',
};

const STATUS_MAP = {
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / स्वीकृत डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/LIU/DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/LIU/DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/LIU/DCP',
  'वर्तमान पता :- (पुलिस स्टेशन द्वारा सत्यापन पूर्ण किया गया / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'DCRB/DCP',
  'वर्तमान पता :- (पुलिस स्टेशन द्वारा सत्यापन पूर्ण किया गया / स्वीकृत डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/DCP',
};

function fmt(d) { return d ? d.split('-').reverse().join('-') : ''; }
function shortAddr(addr) { return (addr || '').replace('पश्चिमी (कमिश्नरेट आगरा) उत्तर प्रदेश', ''); }

export default function Detail() {
  const [searchParams] = useSearchParams();
  const loc = searchParams.get('loc') || '';
  const ps = searchParams.get('ps') || '';
  const sdate = searchParams.get('sdate') || '';
  const edate = searchParams.get('edate') || '';
  const cug = searchParams.get('CUG') || searchParams.get('cug') || '';
  const type = searchParams.get('type') || 'character';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tableRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    axios.get('/details', {
      params: { loc, ps, sdate, edate, cug, type }
    })
      .then(res => {setRows(res.data || []); console.log(res.data)})
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [loc, ps, sdate, edate, cug, type]);

  const hideStatus = ['liu', 'ps', 'dcrb', 'dcp', 'totaldcp', 'totalliu', 'totaldcrb', 'totalps'].includes(loc);
  const hidePs = ['liu', 'ps', 'dcrb', 'dcp', 'remain', 'all'].includes(loc);
  
  const moduleName = MODULE_NAMES[type] || MODULE_NAMES.character;
  const locHeading = LOC_HEADINGS[loc] || '';
  const heading = `${locHeading} ${moduleName}`.trim();

  return (
    <>
      <Navbar />

      <div className="table-wrapper">
        <table id="printable" ref={tableRef}>
          <thead>
            {heading && (
              <tr><th colSpan="8" style={{ textAlign: 'center', fontSize: '18px' }}>{heading}</th></tr>
            )}
            <tr>
              {!hidePs && <th>थाना</th>}
              <th>{ps}</th>
              <th>दिनांक से</th>
              <th>{fmt(sdate)}</th>
              <th>दिनांक तक</th>
              <th colSpan={hidePs ? 3 : 2}>{fmt(edate)}</th>
            </tr>
            <tr>
              <th>क्र0सं0</th>
              {!hidePs && <th>थाना</th>}
              <th>अनुरोध संख्या</th>
              <th>अनुरोध_दिनांक</th>
              <th>आवेदक का नाम</th>
              <th colSpan="2">वर्तमान पता</th>
              {!hideStatus && <th>स्थिति</th>}
            </tr>
          </thead>
          <tbody id="pending_Details">
            {loading && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>लोड हो रहा है...</td></tr>
            )}
            {error && (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
            )}
            {!loading && rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {!hidePs && <td>{r['थाना'] || r.station_name}</td>}
                <td>{r['अनुरोध_संख्या'] || r.request_number}</td>
                <td>{fmt(r['अनुरोध_दिनांक'] || r.request_date)}</td>
                <td>{r['आवेदक_का_नाम'] || r.applicant_name}</td>
                <td colSpan="2">{shortAddr(r['वर्तमान_पता'] || r.present_address)}</td>
                {!hideStatus && <td>{STATUS_MAP[r['अनुरोध_की_स्थिति'] || r.current_status] || r['अनुरोध_की_स्थिति'] || r.current_status}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

