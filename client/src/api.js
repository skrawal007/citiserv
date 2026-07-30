const API_BASE = 'http://localhost:5000/api';

// Generic fetch wrapper
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
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
  apiFetch(`/characters/remain?ps=${encodeURIComponent(ps)}&sdate=${sdate}&edate=${edate}`);

export const uploadExcel = (file) => {
  const formData = new FormData();
  formData.append('excel_file', file);
  return apiFetch('/characters/upload', { method: 'POST', body: formData });
};
