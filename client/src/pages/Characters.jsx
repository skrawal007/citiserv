import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import {formatDate} from '../utils/dataConvertor';
import getAuthConfig from "../functions/getAuthConfig";
import DateSearchHeader from "../components/dashboard/DateSearchHeader";
import UpdateButton from "../components/UpdateButton";
import useQueueStatus from "../hooks/useQueueStatus";
import { useQueue } from "../context/QueueContext";

// Toast is now global (GlobalToast in App.jsx) — no local import needed.

// const MODULE_NAMES = {
//   character: 'चरित्र प्रमाण पत्र',
//   tenant: 'किरायेदार सत्यापन',
//   domestic: 'घरेलू सहायक सत्यापन',
//   employee: 'कर्मचारी सत्यापन',
//   complaint: 'शिकायत निवारण',
//   all: 'सत्यापन',
// };

const MODULE_NAMES = {
  character: 'Character Certificate',
  tenant: 'Tenant Verification',
  domestic: 'Domestic Help Verification',
  employee: 'Employee Verification',
  complaint: 'Complaint Redressal',
  all: 'Verification',
};

// const LOC_HEADINGS = {
//   // Long names
//   totaldcp:     'कुल डीसीपी पर लम्बित',
//   totalliu:     'कुल एलआईयू पर लम्बित',
//   totaldcrb:    'कुल डीसीआरबी पर लम्बित',
//   totalps:      'कुल थानों पर लम्बित',
//   totalremain:  'समस्त लम्बित',
//   totaldiff:    'अन्य थानों से सम्बन्धित लम्बित',
//   OTHER_TO_OWN_PS: 'अन्य थानों से सम्बन्धित लम्बित',
  
//   // Short names
//   all:          'कुल प्राप्त',
//   remain:       'कुल लम्बित',
//   ps:           'थानों पर लम्बित',
//   dcrb:         'डीसीआरबी पर लम्बित',
//   liu:          'एलआईयू पर लम्बित',
//   dcp:          'डीसीपी पर लम्बित',
//   own_to_other: 'अन्य थानों से सम्बन्धित लम्बित',
//   other_to_own: 'अन्य थानों से सम्बन्धित लम्बित',
// };


const LOC_HEADINGS = {

  // Long names

  totaldcp:     'Total Pending at DCP',

  totalliu:     'Total Pending at LIU',

  totaldcrb:    'Total Pending at DCRB',

  totalps:      'Total Pending at Police Stations',

  totalremain:  'Total Pending',

  totaldiff:    'Pending Related to Other Police Stations',

  OTHER_TO_OWN_PS: 'Pending Related to Other Police Stations',

  // Short names

  all:          'Total Received',

  remain:       'Total Pending',

  ps:           'Pending at Police Stations',

  dcrb:         'Pending at DCRB',

  liu:          'Pending at LIU',

  dcp:          'Pending at DCP',

  own_to_other: 'Pending Related to Other Police Stations',

  other_to_own: 'Pending Related to Other Police Stations',

};

const LIST_ENDPOINTS = {
  character: '/characterList',
  employee: '/employeeList',
  tenant: '/tenantList',
  domestic: '/domesticList',
  complaint : '/complaintList',
  postmortem : '/postmortemList'
};

const hideStatus = (loc) => ['totaldcp','totalliu','totaldcrb','totalps','totalremain','dcp','liu','dcrb','ps','remain'].includes(loc);
const hidePraAdd = (loc) => ['totaldcp','totalliu','totaldcrb','totalps','totalremain','dcp','liu','dcrb','ps','remain'].includes(loc);
const hidePreAdd = (type) =>['complaint', 'postmortem'].includes(type);

function fmt(d) { return d ? d.split('-').reverse().join('-') : ''; }

export default function Characters({
  showSearch,
  setShowSearch,
  sdate,
  setSdate,
  edate,
  setEdate
}) {
  const [searchParams] = useSearchParams();
  const loc = searchParams.get('loc') || '';
  const type = searchParams.get('type') || '';
  const days = searchParams.get('days') || '';
  const stationParam = searchParams.get('ps') || searchParams.get('station') || '';

  const urlSdate = searchParams.get('sdate');
  const urlEdate = searchParams.get('edate');

  useEffect(() => {
    if (urlSdate) setSdate(urlSdate);
    if (urlEdate) setEdate(urlEdate);
  }, [urlSdate, urlEdate, setSdate, setEdate]);

  const [selectedPoliceStation, setSelectedPoliceStation] = useState(stationParam);

  useEffect(() => {
    setSelectedPoliceStation(stationParam);
  }, [stationParam]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [policeStations, setPoliceStations] = useState([]);
  const tableRef = useRef(null);

  // ── Real-time queue status (button states: PENDING / PROCESSING) ──────────
  const { queueStatuses } = useQueueStatus();

  // ── Row-update subscription ───────────────────────────────────────────────
  // When queue:completed fires for a request that belongs to this table,
  // patch the row's status columns in-place — no full-table reload needed.
  // Toast is handled globally by GlobalToast in App.jsx.
  const { subscribeCompleted } = useQueue();
  const rowUpdateRef = useRef(null);

  // Always points to the latest setRows closure (updated every render)
  rowUpdateRef.current = (data) => {
    const reqNum      = String(data.request_number || '');
    const preStatus   = data.pre_Current_Status || null;
    const perStatus   = data.per_Current_Status || null;
    const activeStatus = data.active_status || null;

    setRows((prevRows) =>
      prevRows.map((row) => {
        if (String(row.request_number || '') !== reqNum) return row;
        return {
          ...row,
          ...(preStatus    !== null ? { pre_Current_Status: preStatus    } : {}),
          ...(perStatus    !== null ? { per_Current_Status: perStatus    } : {}),
          ...(activeStatus !== null ? { Current_Status:     activeStatus } : {}),
        };
      })
    );
  };

  // Subscribe once on mount — stable wrapper ensures no subscribe/unsubscribe gap
  useEffect(() => {
    const onCompleted = (data) => rowUpdateRef.current?.(data);
    return subscribeCompleted(onCompleted);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — subscribe once for the component lifetime
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Callback from UpdateButton after the HTTP POST completes.
   * Merges any status fields returned immediately by the server.
   */
  const handleRowStatusUpdate = (request_number, apiResponse) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        const rowReqNum = row.request_number;
        if (String(rowReqNum) !== String(request_number)) return row;
        return {
          ...row,
          ...(apiResponse.pre_Current_Status !== undefined
            ? { pre_Current_Status: apiResponse.pre_Current_Status }
            : {}),
          ...(apiResponse.per_Current_Status !== undefined
            ? { per_Current_Status: apiResponse.per_Current_Status }
            : {}),
        };
      })
    );
  };

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
          params: { loc, sdate, edate, ps: selectedPoliceStation, days },
          ...getAuthConfig(),
        });

        const records = Array.isArray(res.data) ? res.data : [];
        const stationEntries = records
          .map((record) => {
            const label = record['थाना'] || record.pre_station_name || record.station_name;
            const value = record.pre_station_code || record.station_code || label;

            return label ? [value, { value, label }] : null;
          })
          .filter(Boolean);
        const stations = [...new Map(stationEntries).values()];

        setRows(records);
        setPoliceStations((prev) => {
          if (prev.length > 0 && selectedPoliceStation) return prev;
          return stations.length > 0 ? stations : prev;
        });

      } catch (e) {
        setError(e.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loc, type, sdate, edate, selectedPoliceStation, days]);


  const moduleName = MODULE_NAMES[type] || MODULE_NAMES.character;
  const locHeading = LOC_HEADINGS[loc] || '';
  const heading = `${locHeading} ${moduleName}`.trim();
  const hideStatusCol = hideStatus(loc);
  const hidePraAddCol = hidePraAdd(loc);
  const hidePreAddCol = hidePreAdd(type);

  return (
    <>
      <Navbar />

      <DateSearchHeader
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        sdate={sdate}
        setSdate={setSdate}
        edate={edate}
        setEdate={setEdate}
        policeStations={policeStations}
        selectedPoliceStation={selectedPoliceStation}
        setSelectedPoliceStation={setSelectedPoliceStation}
      />
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
              <th>Status Update</th>
            </tr>
          </thead>
          <tbody id="pending_Details">
            {loading && (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>लोड हो रहा है...</td></tr>
            )}
            {error && (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
            )}
            {!loading && rows.map((r, i) => {
              const reqNum = r.request_number;
              const isInQueue = !!queueStatuses[String(reqNum)];
              return (
                <tr key={i} className={isInQueue ? 'row--in-queue' : ''}>
                  <td>{i + 1}</td>
                  <td>{r.pre_station_name}</td>
                  <td>{reqNum}</td>
                  <td>{formatDate(r.request_date)}</td>
                  <td>{r.applicant_name}</td>
                  {!hidePreAddCol && <td>{r.present_address}</td>}
                  <td> {r.pre_Current_Status}
                  </td>
                  {!hidePraAddCol && <td>{r.permanent_address}</td>}
                  {!hideStatusCol && (
                    <td>{r.per_Current_Status}
                    </td>
                  )}
                  <td>
                    <UpdateButton
                      type={type}
                      request_number={reqNum}
                      queueStatus={queueStatuses[String(reqNum)]}
                      onStatusUpdate={handleRowStatusUpdate}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
