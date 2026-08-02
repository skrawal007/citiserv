import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const LOC_HEADINGS = {
  totaldcp:     'कुल डीसीपी पर लम्बित चरित्र प्रमाण पत्र',
  totalliu:     'कुल एलआईयू पर लम्बित चरित्र प्रमाण पत्र',
  totaldcrb:    'कुल डीसीआरबी पर लम्बित चरित्र प्रमाण पत्र',
  totalps:      'कुल थानों पर लम्बित चरित्र प्रमाण पत्र',
  totalremain:  'समस्त पश्चिमी जोन पर लम्बित चरित्र प्रमाण पत्र',
  totaldiff:    'अन्य थानों से सम्बन्धित लम्बित चरित्र प्रमाण पत्र',
};

// Status map: long Hindi string → short code
const STATUS_MAP = {
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / स्वीकृत डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/LIU/DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/LIU/DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/LIU/DCP',
  'वर्तमान पता :- (पुलिस स्टेशन द्वारा सत्यापन पूर्ण किया गया / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'DCRB/DCP',
  'वर्तमान पता :- (पुलिस स्टेशन द्वारा सत्यापन पूर्ण किया गया / स्वीकृत डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/DCP',
};

const hideStatus = (loc) => ['totaldcp','totalliu','totaldcrb','totalps'].includes(loc);
const hidePraAdd = (loc) => ['totaldcp','totalliu','totaldcrb','totalps','totalremain'].includes(loc);

function fmt(d) { return d ? d.split('-').reverse().join('-') : ''; }
function shortAddr(addr) { return (addr || '').replace('पश्चिमी (कमिश्नरेट आगरा) उत्तर प्रदेश', ''); }

export default function Characters() {
  const [searchParams] = useSearchParams();
  const loc = searchParams.get('loc') || 'totalremain';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tableRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    setRows([]);
    axios.get('/pending', { params: { loc } })
      .then(res => setRows(res.data || []))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [loc]);

  function printTable() {
    if (!tableRef.current) return;
    const w = window.open('', 'Print-Window');
    w.document.open();
    w.document.write(`<html><head><style>
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ccc;padding:8px;font-size:14px}
      th{background:#3498db;color:#fff}
    </style></head><body onload="window.print()">${tableRef.current.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.close(), 10);
  }

  const heading = LOC_HEADINGS[loc] || '';
  const hideStatusCol = hideStatus(loc);
  const hidePraAddCol = hidePraAdd(loc);

  return (
    <>
      <Navbar />

      <div className="print-page" id="print-btn">
        <a href="#" onClick={e => { e.preventDefault(); printTable(); }}>
          <img src="/img/printer.png" alt="Print" />
        </a>
      </div>

      <div className="table-wrapper">
        <table id="printable" ref={tableRef}>
          <thead>
            {heading && (
              <tr><th colSpan="8" style={{ textAlign: 'center' }}>{heading}</th></tr>
            )}
            <tr>
              <th>क्र0सं0</th>
              <th>थाना</th>
              <th>अनुरोध संख्या</th>
              <th>अनुरोध_दिनांक</th>
              <th>आवेदक का नाम</th>
              <th>वर्तमान पता</th>
              {!hidePraAddCol && <th>स्थायी पता</th>}
              {!hideStatusCol && <th>स्थिति</th>}
              <th>स्थिति (पूर्ण)</th>
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
                <td>{r['थाना']}</td>
                <td>{r['अनुरोध_संख्या']}</td>
                <td>{fmt(r['अनुरोध_दिनांक'])}</td>
                <td>{r['आवेदक_का_नाम']}</td>
                <td>{shortAddr(r['वर्तमान_पता'])}</td>
                {!hidePraAddCol && <td>{r['स्थायी_पता']}</td>}
                {!hideStatusCol && <td>{STATUS_MAP[r['अनुरोध_की_स्थिति']] || r['अनुरोध_की_स्थिति']}</td>}
                <td>{r['अनुरोध_की_स्थिति']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
