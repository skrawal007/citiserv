import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import LoadingOverlay from '../components/LoadingOverlay';

const MODULE_NAMES = {
  character: 'Character Verification',
  tenant: 'Tenant Verification',
  domestic: 'Domestic Help Verification',
  employee: 'Employee Verification',
  complaint: 'Complaints Data',
  all: 'Verification Data',
};

export default function Upload() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'character';
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const moduleTitle = MODULE_NAMES[type] || MODULE_NAMES.character;

  function validateFile(file) {
    if (!file) return false;
    const name = file.name || '';
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      setError('Invalid file format. Only Excel spreadsheets (.xls or .xlsx) are allowed.');
      return false;
    }
    setError('');
    return true;
  }

  function handleFileSelect(file) {
    setSummary(null);
    if (validateFile(file)) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (fileRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileRef.current.files = dataTransfer.files;
      }
      handleFileSelect(file);
    }
  }

  async function handleUpload() {
    const file = selectedFile || fileRef.current?.files?.[0];
    if (!file) {
      setError('Please select an Excel file (.xls or .xlsx) to upload');
      return;
    }

    if (!validateFile(file)) return;

    setUploading(true);
    setError('');
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append('excel_file', file);
      formData.append('type', type);

      const res = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSummary(res.data);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      const serverMsg = e.response?.data?.error || e.message;
      setError('Upload failed: ' + serverMsg);
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    if (fileRef.current) fileRef.current.value = '';
    setSelectedFile(null);
    setSummary(null);
    setError('');
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const getFileExtensionTag = (filename) => {
    if (!filename) return 'EXCEL';
    const ext = filename.substring(filename.lastIndexOf('.')).toUpperCase();
    return ext.replace('.', '');
  };

  return (
    <>
      <Navbar />
      {uploading && <LoadingOverlay message="Processing & importing Excel data, please wait..." />}

      <div className="upload-page-container">
        <div className="upload-card">
          <div className="upload-card-header">
            <h2>{moduleTitle} Data Import</h2>
            <p>Upload Excel file (<b>.XLS</b> or <b>.XLSX</b> format)</p>
          </div>

          {/* ── Dropzone Area ── */}
          <div
            className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              type="file"
              id="excel_file"
              accept=".xlsx, .xls, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              ref={fileRef}
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            <div className="dropzone-content">
              <div className="upload-icon">📊</div>
              <h3>Drag & drop Excel file here</h3>
              <p>or click to browse your computer</p>
              <div className="supported-formats">
                <span className="format-badge xlsx-badge">.XLSX</span>
                <span className="format-badge xls-badge">.XLS</span>
              </div>
            </div>
          </div>

          {/* ── Selected File Metadata Badge ── */}
          {selectedFile && (
            <div className="file-preview-card">
              <div className="file-info">
                <span className={`file-badge ${getFileExtensionTag(selectedFile.name) === 'XLS' ? 'xls-tag' : 'xlsx-tag'}`}>
                  .{getFileExtensionTag(selectedFile.name)}
                </span>
                <div className="file-details">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{formatBytes(selectedFile.size)}</div>
                </div>
              </div>
              <button type="button" className="remove-file-btn" onClick={handleReset} title="Remove file">
                ✕
              </button>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div className="upload-actions">
            <button
              id="convert_btn"
              className="btn-upload"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
            >
              {uploading ? 'Processing...' : `Upload & Import ${moduleTitle}`}
            </button>
            <button id="reset_btn" className="btn-reset" onClick={handleReset}>
              Reset
            </button>
          </div>

          {/* ── Error Notification ── */}
          {error && (
            <div className="alert-box alert-error">
              <span>❌ {error}</span>
            </div>
          )}

          {/* ── Success Summary Cards ── */}
          {summary && (
            <div className="summary-section">
              <div className="alert-box alert-success">
                <span>✅ {summary.message}</span>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{summary.totalRecords}</div>
                  <div className="stat-label">Total Records</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{summary.addressCounts || 0}</div>
                  <div className="stat-label">Agra District Matches</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{summary.differentAddressCountPER || 0}</div>
                  <div className="stat-label">Diff. Permanent Addr.</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{summary.differentAddressCountPRE || 0}</div>
                  <div className="stat-label">Diff. Present Addr.</div>
                </div>
              </div>

              {summary.fileName && (
                <div className="upload-meta">
                  File: <b>{summary.fileName}</b> ({summary.fileType}) • Size: {formatBytes(summary.fileSize)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

