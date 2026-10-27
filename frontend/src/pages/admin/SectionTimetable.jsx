import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../services/api';
import { Layers } from 'lucide-react';

export default function SectionTimetable() {
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSectionTimetable();
  }, [selectedSection]);

  const fetchSectionTimetable = async () => {
    setLoading(true);
    try {
      const res = await API.get('/timetable/section', { params: { section: selectedSection } });
      setEntries(res.data || []);
    } catch (err) {
      console.error("Fetch section timetable error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Section Timetable">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Section Timetable View</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Section-wise schedule breakdown across student cohorts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Section:</label>
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} style={{ padding: '8px 16px', fontSize: '14px' }}>
            <option value="Section A">Section A</option>
            <option value="Section B">Section B</option>
            <option value="Section C">Section C</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 className="card-title" style={{ fontSize: '18px' }}>
            <Layers size={20} color="var(--accent-secondary)" /> Timetable for {selectedSection}
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Showing {entries.length} scheduled periods
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading section schedule...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DAY</th>
                  <th>PERIOD</th>
                  <th>GROUP</th>
                  <th>SUBJECT CODE</th>
                  <th>SUBJECT NAME</th>
                  <th>FACULTY</th>
                  <th>ROOM</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row, idx) => (
                  <tr key={idx}>
                    <td><strong>{row.day}</strong></td>
                    <td>P{row.period}</td>
                    <td><span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{row.group_id}</span></td>
                    <td>{row.subject_code}</td>
                    <td>{row.subject_name}</td>
                    <td>{row.faculty_name}</td>
                    <td>{row.room_name}</td>
                    <td>
                      <span className={`badge ${row.status === 'Class' ? 'badge-class' : 'badge-break'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
