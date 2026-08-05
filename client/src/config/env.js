const ip = process.env.REACT_APP_BACKEND_IP || 'http://localhost';
const port = process.env.REACT_APP_BACKEND_PORT || '9900';
const ext = process.env.REACT_APP_BACKEND_EXTENSION || '/api/website/enquiry/';

const formattedExt = ext.startsWith('/') ? ext : `/${ext}`;

export const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/$/, '')
  : `${ip.replace(/\/$/, '')}:${port}${formattedExt.replace(/\/$/, '')}`;

export const BACKEND_URL = `${ip.replace(/\/$/, '')}:${port}${formattedExt}`;
