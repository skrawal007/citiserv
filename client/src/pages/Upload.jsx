import { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import LoadingOverlay from '../components/LoadingOverlay';
import { uploadExcel } from '../api';

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { alert('Please choose any file...'); return; }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toUpperCase();
    if (ext !== '.XLSX') { alert('Please select a valid Excel (.xlsx) file'); return; }

    setUploading(true);
    setMessage('');
    setError('');
    try {
      const result = await uploadExcel(file);
      setMessage(result.message || 'Upload successful');
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setError('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    if (fileRef.current) fileRef.current.value = '';
    setMessage('');
    setError('');
  }

  return (
    <>
      <Navbar />
      {uploading && <LoadingOverlay message="Uploading data, please wait..." />}

      <div className="home-container">
        <h1>Character File Upload</h1>

        <div className="input-container">
          <label htmlFor="excel_file">Select Characters Excel File</label>
          <input
            type="file"
            id="excel_file"
            accept=".xlsx"
            ref={fileRef}
          />
        </div>

        <div className="btn-container">
          <button id="convert_btn" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
          <button id="reset_btn" onClick={handleReset}>
            Reset File
          </button>
        </div>

        {message && (
          <p style={{ textAlign: 'center', color: '#28a745', padding: '10px', fontWeight: 'bold' }}>
            ✅ {message}
          </p>
        )}
        {error && (
          <p style={{ textAlign: 'center', color: '#e04857', padding: '10px', fontWeight: 'bold' }}>
            ❌ {error}
          </p>
        )}
      </div>
    </>
  );
}
