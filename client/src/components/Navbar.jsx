import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <div className="nav">
      {/* ── Header Bar ── */}
      <div className="wrapper-navbar">
        <a href="https://uppolice.gov.in/" target="_blank" rel="noreferrer">
          <img src="/img/UPPOLICE_LOGO.png" alt="UP POLICE LOGO" />
        </a>
        <div className="wrapper-heading">
          <label className="heading">CCTNS AGRA</label>
          <br />
          <label>CCTNS WEST ZONE,AGRA</label>
        </div>
        <a href="https://agrapolice.in/" target="_blank" rel="noreferrer">
          <img src="/img/agra-logo.png" alt="AGRA POLICE LOGO" />
        </a>
      </div>

      {/* ── Navigation Menu ── */}
      <ul className="menu">
        <li>
          <a href="#">dashboard</a>
          <ul>
            <li><Link to="/dashboard">Character</Link></li>
            <li><a href="#">Employee</a></li>
            <li><a href="#">Tenat</a></li>
            <li><a href="#">Domestic</a></li>
            <li><a href="#">Complaints</a></li>
          </ul>
        </li>

        <li>
          <Link to="/characters?loc=totalremain">Character</Link>
          <ul>
            <li><Link to="/characters?loc=totalps">STATION</Link></li>
            <li><Link to="/characters?loc=totalliu">LIU</Link></li>
            <li><Link to="/characters?loc=totaldcrb">DCRB</Link></li>
            <li><Link to="/characters?loc=totaldcp">DCP</Link></li>
            <li><Link to="/characters?loc=totaldiff">Diffrent Add</Link></li>
          </ul>
        </li>

        <li>
          <a href="#">Employee</a>
          <ul>
            <li><a href="#">STATION</a></li>
            <li><a href="#">LIU</a></li>
            <li><a href="#">DCRB</a></li>
            <li><a href="#">DCP</a></li>
          </ul>
        </li>

        <li>
          <a href="#">Tenant</a>
          <ul>
            <li><a href="#">STATION</a></li>
            <li><a href="#">LIU</a></li>
            <li><a href="#">DCRB</a></li>
            <li><a href="#">DCP</a></li>
          </ul>
        </li>

        <li>
          <a href="#">Domastic</a>
          <ul>
            <li><a href="#">STATION</a></li>
            <li><a href="#">LIU</a></li>
            <li><a href="#">DCRB</a></li>
            <li><a href="#">DCP</a></li>
          </ul>
        </li>

        <li>
          <a href="#">Uploads</a>
          <ul>
            <li><Link to="/upload">Character</Link></li>
            <li><a href="#">Employee</a></li>
            <li><a href="#">Tenat</a></li>
            <li><a href="#">Domestic</a></li>
            <li><a href="#">Complaints</a></li>
          </ul>
        </li>
      </ul>
    </div>
  );
}
