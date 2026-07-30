import { API_BASE } from '../config/env';

/**
 * Generic API fetch handler with standard error extraction
 */
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${path}:`, err.message);
    throw err;
  }
}

// ── Characters API ────────────────────────────────────────────────────────────

export const getMinDate = () => apiFetch('/characters/mindate');
export const getMaxDate = () => apiFetch('/characters/maxdate');

export const getDashboard = () => apiFetch('/characters/dashboard');

export const getDashboardByDate = (sdate, edate) =>
  apiFetch('/characters/dashboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sdate, edate }),
  });

export const getPendingChars = (loc) =>
  apiFetch(`/characters/pending?loc=${encodeURIComponent(loc)}`);

export const getDetails = ({ loc, ps, sdate, edate, cug }) => {
  const params = new URLSearchParams();
  if (loc) params.set('loc', loc);
  if (ps) params.set('ps', ps);
  if (sdate) params.set('sdate', sdate);
  if (edate) params.set('edate', edate);
  if (cug) params.set('cug', cug);
  return apiFetch(`/characters/details?${params.toString()}`);
};

export const getRemain = ({ ps, sdate, edate }) =>
  apiFetch(`/characters/remain?ps=${encodeURIComponent(ps)}&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`);

export const uploadExcel = (file) => {
  const formData = new FormData();
  formData.append('excel_file', file);
  return apiFetch('/characters/upload', { method: 'POST', body: formData });
};

export default apiFetch;
