import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../services/api';
import { Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function ExportTimetable() {
  const [exportType, setExportType] = useState('Complete Timetable');
  const [downloading, setDownloading] = useState(false);

  const options = [
    { id: 'Complete Timetable', title: 'Complete Timetable', desc: 'Master schedule across all entities' },
    { id: 'Section Timetable', title: 'Section Timetable', desc: 'Section cohort breakdown' },
    { id: 'Group Timetable', title: 'Group Timetable', desc: 'Group-wise timetable with breaks' },
    { id: 'Faculty Timetable', title: 'Faculty Timetable', desc: 'Individual teacher schedules' },
    { id: 'Room Timetable', title: 'Room Timetable', desc: 'Venue room allocation matrix' },
    { id: 'Conflict Report', title: 'Conflict Report', desc: 'Summary of active issues' }
  ];

  const handleExport = async () => {
    setDownloading(true);
    try {
      const response = await API.get('/export/excel', {
        params: { type: exportType },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AI_Timetable_${exportType.replace(/\s+/g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export timetable Excel file.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AdminLayout title="Export Timetable">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Export Timetable</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Download formatted Excel workbooks containing complete or filtered schedules.
        </p>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <h3 className="card-title" style={{ fontSize: '18px', marginBottom: '20px' }}>
          <FileSpreadsheet size={20} color="var(--accent-primary)" /> Select Export Type
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {options.map((opt) => (
            <div
              key={opt.id}
              onClick={() => setExportType(opt.id)}
              style={{
                background: exportType === opt.id ? 'var(--bg-card-secondary)' : 'var(--bg-sidebar)',
                border: `2px solid ${exportType === opt.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${exportType === opt.id ? 'var(--accent-primary)' : 'var(--text-secondary)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                {exportType === opt.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)' }} />}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{opt.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Format: <strong>Microsoft Excel (.xlsx)</strong>
          </div>

          <button onClick={handleExport} className="btn btn-primary" disabled={downloading}>
            <Download size={18} /> {downloading ? 'Preparing Excel File...' : 'Export Excel File'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
