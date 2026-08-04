import { Link, useLocation, useSearchParams } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentPath = location.pathname;
  const currentType = searchParams.get('type') || '';
  const currentLoc = searchParams.get('loc') || '';

  const isDashboardActive = currentPath === '/dashboard';
  const isUploadActive = currentPath === '/upload';
  const isCharacterActive = currentPath === '/characters' && (currentType === 'character' || !currentType);
  const isEmployeeActive = currentPath === '/characters' && currentType === 'employee';
  const isTenantActive = currentPath === '/characters' && currentType === 'tenant';
  const isDomesticActive = currentPath === '/characters' && currentType === 'domestic';

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
          <a href="https://agrapolice.in/" target="_blank" rel="noreferrer">
            <img src="/img/agra-logo.png" alt="AGRA POLICE LOGO" className="glow-logo" />
          </a>
        </div>
      </div>

      {/* ── Navigation Menu ── */}
      <nav className="navbar-menu-container">
        <ul className="menu">
          <li className={isDashboardActive ? 'active-menu' : ''}>
            <Link to="/dashboard?type=all" className="menu-title">🖥️ Dashboard</Link>
            <ul>
              <li className={isDashboardActive && currentType === 'character' ? 'active-sub' : ''}>
                <Link to="/dashboard?type=character">🛡️ Character (चरित्र)</Link>
              </li>
              <li className={isDashboardActive && currentType === 'employee' ? 'active-sub' : ''}>
                <Link to="/dashboard?type=employee">💼 Employee (कर्मचारी)</Link>
              </li>
              <li className={isDashboardActive && currentType === 'tenant' ? 'active-sub' : ''}>
                <Link to="/dashboard?type=tenant">🏠 Tenant (किरायेदार)</Link>
              </li>
              <li className={isDashboardActive && currentType === 'domestic' ? 'active-sub' : ''}>
                <Link to="/dashboard?type=domestic">🧹 Domestic (घरेलू)</Link>
              </li>
              <li className={isDashboardActive && currentType === 'complaints' ? 'active-sub' : ''}>
                <Link to="/dashboard?type=complaints">📢 Complaints (शिकायत)</Link>
              </li>
            </ul>
          </li>

          <li className={isCharacterActive ? 'active-menu' : ''}>
            <Link to="/characters?type=character&loc=totalremain" className="menu-title">🛡️ Character</Link>
            <ul>
              <li className={isCharacterActive && currentLoc === 'totalps' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=totalps">STATION (थाना)</Link>
              </li>
              <li className={isCharacterActive && currentLoc === 'totalliu' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=totalliu">LIU (एलआईयू)</Link>
              </li>
              <li className={isCharacterActive && currentLoc === 'totaldcrb' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=totaldcrb">DCRB (डीसीआरबी)</Link>
              </li>
              <li className={isCharacterActive && currentLoc === 'totaldcp' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=totaldcp">DCP (डीसीपी)</Link>
              </li>
              <li className={isCharacterActive && currentLoc === 'totaldiff' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=totaldiff">Own PS → Other PS</Link>
              </li>
               <li className={isCharacterActive && currentLoc === 'OTHER_TO_OWN_PS' ? 'active-sub' : ''}>
                <Link to="/characters?type=character&loc=OTHER_TO_OWN_PS">Other PS → Own PS</Link>
              </li>
            </ul>
          </li>

          <li className={isEmployeeActive ? 'active-menu' : ''}>
            <Link to="/characters?type=employee&loc=totalremain" className="menu-title">💼 Employee</Link>
            <ul>
              <li className={isEmployeeActive && currentLoc === 'totalps' ? 'active-sub' : ''}>
                <Link to="/characters?type=employee&loc=totalps">STATION (थाना)</Link>
              </li>
              <li className={isEmployeeActive && currentLoc === 'totalliu' ? 'active-sub' : ''}>
                <Link to="/characters?type=employee&loc=totalliu">LIU (एलआईयू)</Link>
              </li>
              <li className={isEmployeeActive && currentLoc === 'totaldcrb' ? 'active-sub' : ''}>
                <Link to="/characters?type=employee&loc=totaldcrb">DCRB (डीसीआरबी)</Link>
              </li>
              <li className={isEmployeeActive && currentLoc === 'totaldcp' ? 'active-sub' : ''}>
                <Link to="/characters?type=employee&loc=totaldcp">DCP (डीसीपी)</Link>
              </li>
            </ul>
          </li>

          <li className={isTenantActive ? 'active-menu' : ''}>
            <Link to="/characters?type=tenant&loc=totalremain" className="menu-title">🏠 Tenant</Link>
            <ul>
              <li className={isTenantActive && currentLoc === 'totalps' ? 'active-sub' : ''}>
                <Link to="/characters?type=tenant&loc=totalps">STATION (थाना)</Link>
              </li>
              <li className={isTenantActive && currentLoc === 'totalliu' ? 'active-sub' : ''}>
                <Link to="/characters?type=tenant&loc=totalliu">LIU (एलआईयू)</Link>
              </li>
              <li className={isTenantActive && currentLoc === 'totaldcrb' ? 'active-sub' : ''}>
                <Link to="/characters?type=tenant&loc=totaldcrb">DCRB (डीसीआरबी)</Link>
              </li>
              <li className={isTenantActive && currentLoc === 'totaldcp' ? 'active-sub' : ''}>
                <Link to="/characters?type=tenant&loc=totaldcp">DCP (डीसीपी)</Link>
              </li>
            </ul>
          </li>

          <li className={isDomesticActive ? 'active-menu' : ''}>
            <Link to="/characters?type=domestic&loc=totalremain" className="menu-title">🧹 Domestic</Link>
            <ul>
              <li className={isDomesticActive && currentLoc === 'totalps' ? 'active-sub' : ''}>
                <Link to="/characters?type=domestic&loc=totalps">STATION (थाना)</Link>
              </li>
              <li className={isDomesticActive && currentLoc === 'totalliu' ? 'active-sub' : ''}>
                <Link to="/characters?type=domestic&loc=totalliu">LIU (एलआईयू)</Link>
              </li>
              <li className={isDomesticActive && currentLoc === 'totaldcrb' ? 'active-sub' : ''}>
                <Link to="/characters?type=domestic&loc=totaldcrb">DCRB (डीसीआरबी)</Link>
              </li>
              <li className={isDomesticActive && currentLoc === 'totaldcp' ? 'active-sub' : ''}>
                <Link to="/characters?type=domestic&loc=totaldcp">DCP (डीसीपी)</Link>
              </li>
            </ul>
          </li>

          <li className={isUploadActive ? 'active-menu' : ''}>
            <Link to="/upload" className="menu-title">📤 Uploads</Link>
            <ul>
              <li className={isUploadActive && currentType === 'character' ? 'active-sub' : ''}>
                <Link to="/upload?type=character">🛡️ Character</Link>
              </li>
              <li className={isUploadActive && currentType === 'employee' ? 'active-sub' : ''}>
                <Link to="/upload?type=employee">💼 Employee</Link>
              </li>
              <li className={isUploadActive && currentType === 'tenant' ? 'active-sub' : ''}>
                <Link to="/upload?type=tenant">🏠 Tenant</Link>
              </li>
              <li className={isUploadActive && currentType === 'domestic' ? 'active-sub' : ''}>
                <Link to="/upload?type=domestic">🧹 Domestic</Link>
              </li>
              <li className={isUploadActive && currentType === 'complaints' ? 'active-sub' : ''}>
                <Link to="/upload?type=complaints">📢 Complaints</Link>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
