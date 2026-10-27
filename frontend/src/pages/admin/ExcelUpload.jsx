import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../services/api';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export default function ExcelUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an Excel file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    setError('');

    try {
      const res = await API.post('/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload Excel file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await API.get('/excel-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AI_Timetable_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error downloading template');
    }
  };

  return (
    <AdminLayout title="Upload Excel File">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Upload Excel File</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Import multi-sheet Excel workbook containing Students, Subjects, Faculty, Rooms, Groups, Time Slots, and Availability.
          </p>
        </div>
        <button onClick={handleDownloadTemplate} className="btn btn-secondary">
          <Download size={18} /> Download Excel Template
        </button>
      </div>

      <div className="card">
        <div style={{
          border: '2px dashed var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 24px',
          textAlign: 'center',
          background: 'var(--bg-sidebar)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <FileSpreadsheet size={54} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Drag and drop your Excel file here
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Supported formats: .xlsx (Excel Workbook)
          </p>

          <input
            type="file"
            id="fileInput"
            accept=".xlsx"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <label htmlFor="fileInput" className="btn btn-secondary">
            Browse File
          </label>
        </div>

        {selectedFile && (
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card-secondary)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileSpreadsheet size={24} color="var(--accent-secondary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{selectedFile.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            <button onClick={handleUpload} className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading & Validating...' : 'Validate & Save Excel'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '20px', background: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#F87171', padding: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {uploadResult && (
          <div style={{ marginTop: '24px', padding: '20px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              {uploadResult.validation.valid ? (
                <CheckCircle2 size={24} color="var(--status-success)" />
              ) : (
                <AlertTriangle size={24} color="var(--status-error)" />
              )}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: uploadResult.validation.valid ? 'var(--status-success)' : 'var(--status-error)' }}>
                  {uploadResult.validation.valid ? 'File Uploaded & Validated Successfully!' : 'Validation Failed with Errors'}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {uploadResult.validation.errors.length} Errors, {uploadResult.validation.warnings.length} Warnings
                </div>
              </div>
            </div>

            {uploadResult.validation.errors.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, color: 'var(--status-error)', fontSize: '13px', marginBottom: '6px' }}>Errors:</div>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-main)', fontSize: '13px' }}>
                  {uploadResult.validation.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {uploadResult.validation.warnings.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--status-warning)', fontSize: '13px', marginBottom: '6px' }}>Warnings:</div>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {uploadResult.validation.warnings.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
