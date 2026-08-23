import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate(); 
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const currentPath = location.pathname;
  const currentType = searchParams.get('type') || '';
  const currentLoc = searchParams.get('loc') || '';

  // Normalise short dashboard loc aliases → long navbar loc aliases so
  // `active-sub` highlighting works for both manually-chosen nav links
  // and dashboard drill-down links.
  const LOC_ALIAS = {
    ps:           'totalps',
    liu:          'totalliu',
    dcrb:         'totaldcrb',
    dcp:          'totaldcp',
    remain:       'totalremain',
    own_to_other: 'totaldiff',
    other_to_own: 'OTHER_TO_OWN_PS',
  };
  const normLoc = LOC_ALIAS[currentLoc] || currentLoc;

  const isDashboardActive = currentPath === '/dashboard';
  const isUploadActive = currentPath === '/upload';
  const isCharacterActive = currentPath === '/characters' && (currentType === 'character' || !currentType);
  const isEmployeeActive = currentPath === '/characters' && currentType === 'employee';
  const isTenantActive = currentPath === '/characters' && currentType === 'tenant';
  const isDomesticActive = currentPath === '/characters' && currentType === 'domestic';
  const isComplaintsActive = currentPath === '/characters' && currentType === 'complaint';
  const isPostmortemActive = currentPath === '/characters' && currentType === 'postmortem';

 

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="nav-wrapper-main">
      {/* ── Header Bar ── */}
      <div className="wrapper-navbar">
        <div className="navbar-logo-left">
          <a href="https://uppolice.gov.in/" target="_blank" rel="noreferrer">
            <img src="/img/UPPOLICE_LOGO.png" alt="UP POLICE LOGO" className="glow-logo" />
          </a>
        </div>
        
        <div className="wrapper-heading">
          <span className="heading-main">CCTNS AGRA</span>
          <span className="heading-sub">WEST ZONE, AGRA POLICE PORTAL</span>
        </div>

        <div className="navbar-logo-right">
          {user && (
            <div className="navbar-user-section">
              <span className="user-badge" title="Logged in user">
                👤 User: <strong>{user.username}</strong>
              </span>
              <button onClick={handleLogout} className="logout-btn" title="Log out of system">
                🚪 Logout
              </button>
            </div>
          )}
          <a href="https://agrapolice.in/" target="_blank" rel="noreferrer">
            <img src="/img/agra-logo.png" alt="AGRA POLICE LOGO" className="glow-logo" />
          </a>
        </div>
      </div>

      {/* ── Navigation Menu ── */}
      <nav className="navbar-menu-container">
        <ul className="menu">
          <li className={isDashboardActive ? 'active-menu' : ''}>
            <Link to="/dashboard" className="menu-title">🖥️ Dashboard</Link>
            <ul>
              <li className={isDashboardActive && currentType === 'character' ? 'active-sub' : ''}>
                <Link to="/dashboard?type=character">🛡️ Character (चरित्र)</Link>
              </li>
                 <li className={isDashboardActive && currentType === 'domestic' ? 'active-sub' : ''}>
                <Link to="/dashboard?type=domestic">🧹 Domestic (घरेलू)</Link>
              </li>
              <li className={isDashboardActive && currentType === 'employee' ? 'active-sub' : ''}>
                <Link to="/dashboard?type=employee">💼 Employee (कर्मचारी)</Link>
              </li>
              <li className={isDashboardActive && currentType === 'tenant' ? 'active-sub' : ''}>
                <Link to="/dashboard?type=tenant">🏠 Tenant (किरायेदार)</Link>
              </li>
           
              <li className={isDashboardActive && currentType === 'complaint' ? 'active-sub' : ''}>
                <Link to="/dashboard?type=complaint">📢 Complaint (शिकायत)</Link>
              </li>
            </ul>
          </li>

          <li className={isCharacterActive ? 'active-menu' : ''}>
            <Link to="/characters?type=character&loc=totalremain" className="menu-title">🛡️ Character</Link>
            <ul>
              <li className={isCharacterActive && normLoc === 'totalps' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=totalps">STATION (थाना)</Link>
              </li>
              <li className={isCharacterActive && normLoc === 'totalliu' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=totalliu">LIU (एलआईयू)</Link>
              </li>
              <li className={isCharacterActive && normLoc === 'totaldcrb' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=totaldcrb">DCRB (डीसीआरबी)</Link>
              </li>
              <li className={isCharacterActive && normLoc === 'totaldcp' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=totaldcp">DCP (डीसीपी)</Link>
              </li>
              <li className={isCharacterActive && normLoc === 'totaldiff' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=totaldiff">Own PS → Other PS</Link>
              </li>
               <li className={isCharacterActive && normLoc === 'OTHER_TO_OWN_PS' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=OTHER_TO_OWN_PS">Other PS → Own PS</Link>
              </li>
            </ul>
          </li>

          <li className={isEmployeeActive ? 'active-menu' : ''}>
            <Link to="/characters?type=employee&loc=totalremain" className="menu-title">💼 Employee</Link>
            <ul>
              <li className={isEmployeeActive && normLoc === 'totalps' ? 'active-sub' : ''}>
                <Link to="/characters?type=employee&loc=totalps">STATION (थाना)</Link>
              </li>
              <li className={isEmployeeActive && normLoc === 'totalliu' ? 'active-sub' : ''}>
                <Link to="/characters?type=employee&loc=totalliu">LIU (एलआईयू)</Link>
              </li>
              <li className={isEmployeeActive && normLoc === 'totaldcrb' ? 'active-sub' : ''}>
                <Link to="/characters?type=employee&loc=totaldcrb">DCRB (डीसीआरबी)</Link>
              </li>
              <li className={isEmployeeActive && normLoc === 'totaldcp' ? 'active-sub' : ''}>
                <Link to="/characters?type=employee&loc=totaldcp">DCP (डीसीपी)</Link>
              </li>
              <li className={isEmployeeActive && normLoc === 'totaldiff' ? 'active-sub' : ''}>
                <Link to="/characters?type=employee&loc=totaldiff">Own PS → Other PS</Link>
              </li>
               <li className={isEmployeeActive && normLoc === 'OTHER_TO_OWN_PS' ? 'active-sub' : ''}>
                <Link to="/characters?type=employee&loc=OTHER_TO_OWN_PS">Other PS → Own PS</Link>
              </li>
            </ul>
          </li>

          <li className={isTenantActive ? 'active-menu' : ''}>
            <Link to="/characters?type=tenant&loc=totalremain" className="menu-title">🏠 Tenant</Link>
            <ul>
              <li className={isTenantActive && normLoc === 'totalps' ? 'active-sub' : ''}>
                <Link to="/characters?type=tenant&loc=totalps">STATION (थाना)</Link>
              </li>
              <li className={isTenantActive && normLoc === 'totalliu' ? 'active-sub' : ''}>
                <Link to="/characters?type=tenant&loc=totalliu">LIU (एलआईयू)</Link>
              </li>
              <li className={isTenantActive && normLoc === 'totaldcrb' ? 'active-sub' : ''}>
                <Link to="/characters?type=tenant&loc=totaldcrb">DCRB (डीसीआरबी)</Link>
              </li>
              <li className={isTenantActive && normLoc === 'totaldcp' ? 'active-sub' : ''}>
                <Link to="/characters?type=tenant&loc=totaldcp">DCP (डीसीपी)</Link>
              </li>
                <li className={isTenantActive && normLoc === 'totaldiff' ? 'active-sub' : ''}>
                <Link to="/characters?type=tenant&loc=totaldiff">Own PS → Other PS</Link>
              </li>
               <li className={isTenantActive && normLoc === 'OTHER_TO_OWN_PS' ? 'active-sub' : ''}>
                <Link to="/characters?type=tenant&loc=OTHER_TO_OWN_PS">Other PS → Own PS</Link>
              </li>
            </ul>
          </li>

          <li className={isDomesticActive ? 'active-menu' : ''}>
            <Link to="/characters?type=domestic&loc=totalremain" className="menu-title">🧹 Domestic</Link>
            <ul>
              <li className={isDomesticActive && normLoc === 'totalps' ? 'active-sub' : ''}>
                <Link to="/characters?type=domestic&loc=totalps">STATION (थाना)</Link>
              </li>
              <li className={isDomesticActive && normLoc === 'totalliu' ? 'active-sub' : ''}>
                <Link to="/characters?type=domestic&loc=totalliu">LIU (एलआईयू)</Link>
              </li>
              <li className={isDomesticActive && normLoc === 'totaldcrb' ? 'active-sub' : ''}>
                <Link to="/characters?type=domestic&loc=totaldcrb">DCRB (डीसीआरबी)</Link>
              </li>
              <li className={isDomesticActive && normLoc === 'totaldcp' ? 'active-sub' : ''}>
                <Link to="/characters?type=domestic&loc=totaldcp">DCP (डीसीपी)</Link>
              </li>
              <li className={isDomesticActive && normLoc === 'totaldiff' ? 'active-sub' : ''}>
                <Link to="/characters?type=domestic&&loc=totaldiff">Own PS → Other PS</Link>
              </li>
               <li className={isDomesticActive && normLoc === 'OTHER_TO_OWN_PS' ? 'active-sub' : ''}>
                <Link to="/characters?type=domestic&&loc=OTHER_TO_OWN_PS">Other PS → Own PS</Link>
              </li>
              
            </ul>
          </li>
          {/* Complaint Navbar */}

                <li className={isComplaintsActive ? 'active-menu' : ''}>
            <Link to="/characters?type=complaint&loc=totalremain" className="menu-title">🧹 Complaints</Link>
            <ul>
              {/* <li className={isComplaintsActive && currentLoc === 'totalps' ? 'active-sub' : ''}>
                <Link to="/characters?type=complaint&loc=totalps">STATION (थाना)</Link>
              </li> */}
              
              
            </ul>
          </li>

          {/* POSTMORTEM Navbar */}

                <li className={isPostmortemActive ? 'active-menu' : ''}>
            <Link to="/characters?type=postmortem&loc=totalremain" className="menu-title">🧹 Postmortem</Link>
            <ul>
              {/* <li className={isPostmortemActive && currentLoc === 'totalps' ? 'active-sub' : ''}>
                <Link to="/characters?type=postmortem&loc=totalps">STATION (थाना)</Link>
              </li>
              <li className={isPostmortemActive && currentLoc === 'totaldcp' ? 'active-sub' : ''}>
                <Link to="/characters?type=postmortem&loc=totaldcp">DCP (डीसीपी)</Link>
              </li> */}
              
              
            </ul>
          </li>

          {/* Upload files for view admin only (usertype 5) */}
          {user?.usertype === 5 && (
          <li className={isUploadActive ? 'active-menu' : ''}>
            <Link to="/upload" className="menu-title">📤 Uploads</Link>
            <ul>
              <li className={isUploadActive && currentType === 'character' ? 'active-sub' : ''}>
                <Link to="/upload?type=character">🛡️ Character</Link>
              </li>
            </ul>
          </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
