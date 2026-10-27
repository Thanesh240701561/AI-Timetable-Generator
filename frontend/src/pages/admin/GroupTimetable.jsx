import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../services/api';
import { Boxes, Filter } from 'lucide-react';

export default function GroupTimetable() {
  const [selectedGroup, setSelectedGroup] = useState('G1');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupTimetable();
  }, [selectedGroup]);

  const fetchGroupTimetable = async () => {
    setLoading(true);
    try {
      const res = await API.get('/timetable/group', { params: { group_id: selectedGroup } });
      setEntries(res.data || []);
    } catch (err) {
      console.error("Fetch group timetable error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Group Timetable">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Group Timetable View</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Group-wise parallel scheduling display with automatic breaks for inactive slots.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Group:</label>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} style={{ padding: '8px 16px', fontSize: '14px' }}>
            <option value="G1">Group G1 (Data Structures - Smith)</option>
            <option value="G2">Group G2 (DBMS - Kumar)</option>
            <option value="G3">Group G3 (OS - Lee)</option>
            <option value="G4">Group G4 (AI - Patel)</option>
            <option value="G5">Group G5 (DS Lab - Wilson)</option>
            <option value="G6">Group G6 (DBMS Lab - Davis)</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 className="card-title" style={{ fontSize: '18px' }}>
            <Boxes size={20} color="var(--accent-primary)" /> Schedule for Teacher Group {selectedGroup}
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Showing {entries.length} scheduled periods (including automatic breaks)
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading group schedule...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DAY</th>
                  <th>PERIOD</th>
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
                    <td>P{row.period} ({row.start_time} - {row.end_time})</td>
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
