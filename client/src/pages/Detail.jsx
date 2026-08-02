import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const LOC_HEADINGS = {
  liu: 'एलआईयू पर लम्बित चरित्र प्रमाण पत्र',
  ps: 'थाने पर लम्बित चरित्र प्रमाण पत्र',
  dcrb: 'डीसीआरबी पर लम्बित चरित्र प्रमाण पत्र',
  dcp: 'डीसीपी पर लम्बित चरित्र प्रमाण पत्र',
  remain: 'कुल लम्बित चरित्र प्रमाण पत्र',
  all: 'कुल चरित्र प्रमाण पत्र',
  totaldcp: 'कुल डीसीपी पर लम्बित चरित्र प्रमाण पत्र',
  totalliu: 'कुल एलआईयू पर लम्बित चरित्र प्रमाण पत्र',
  totaldcrb: 'कुल डीसीआरबी पर लम्बित चरित्र प्रमाण पत्र',
  totalps: 'कुल थानों पर लम्बित चरित्र प्रमाण पत्र',
  totalremain: 'समस्त पश्चिमी जोन पर लम्बित चरित्र प्रमाण पत्र',
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

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tableRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    axios.get('/details', {
      params: { loc, ps, sdate, edate, cug }
    })
      .then(res => setRows(res.data || []))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [loc, ps, sdate, edate, cug]);

  const hideStatus = ['liu', 'ps', 'dcrb', 'dcp', 'totaldcp', 'totalliu', 'totaldcrb', 'totalps'].includes(loc);
  const hidePs = ['liu', 'ps', 'dcrb', 'dcp', 'remain', 'all'].includes(loc);
  const heading = LOC_HEADINGS[loc] || '';

  return (
    <>
      <Navbar />

      <div className="table-wrapper">
        <table id="printable" ref={tableRef}>
          <thead>
            {heading && (
              <tr><th colSpan="8" style={{ textAlign: 'center' }}>{heading}</th></tr>
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
                {!hidePs && <td>{r['थाना']}</td>}
                <td>{r['अनुरोध_संख्या']}</td>
                <td>{fmt(r['अनुरोध_दिनांक'])}</td>
                <td>{r['आवेदक_का_नाम']}</td>
                <td colSpan="2">{shortAddr(r['वर्तमान_पता'])}</td>
                {!hideStatus && <td>{STATUS_MAP[r['अनुरोध_की_स्थिति']] || r['अनुरोध_की_स्थिति']}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
