import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../services/api';
import { Filter, Calendar, Grid, Table as TableIcon, RefreshCw } from 'lucide-react';

export default function CompleteTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Filters (Group filter removed as requested)
  const [section, setSection] = useState('All');
  const [subject, setSubject] = useState('All');
  const [faculty, setFaculty] = useState('All');
  const [room, setRoom] = useState('All');
  const [day, setDay] = useState('All');

  // Filter options lists
  const [subjectsList, setSubjectsList] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [section, subject, faculty, room, day]);

  const fetchFilterData = async () => {
    try {
      const [subRes, facRes, rmRes] = await Promise.all([
        API.get('/subjects'),
        API.get('/faculty'),
        API.get('/rooms')
      ]);
      setSubjectsList(subRes.data || []);
      setFacultyList(facRes.data || []);
      setRoomsList(rmRes.data || []);
    } catch (err) {
      console.error("Fetch filter options error:", err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      let params = {};
      if (section !== 'All') params.section = section;
      if (subject !== 'All') params.subject = subject;
      if (faculty !== 'All') params.faculty = faculty;
      if (room !== 'All') params.room = room;
      if (day !== 'All') params.day = day;

      const res = await API.get('/timetable', { params });
      setTimetable(res.data || []);
    } catch (err) {
      console.error("Fetch timetable error:", err);
    } finally {
      setLoading(false);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [1, 2, 3, 4, 5, 6];

  // Helper to find all entries for a given day and period cell
  const getCellEntries = (d, p) => {
    return timetable.filter(item => item.day === d && item.period === p);
  };

  const resetFilters = () => {
    setSection('All');
    setSubject('All');
    setFaculty('All');
    setRoom('All');
    setDay('All');
  };

  return (
    <AdminLayout title="Complete Timetable">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Complete Timetable View</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Master schedule view filterable by Section, Subject, Faculty, Room, and Day.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card-secondary)', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode('grid')}
            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            <Grid size={16} /> Grid Matrix
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            <TableIcon size={16} /> Table View
          </button>
        </div>
      </div>

      {/* Filter Bar (Group filter removed as requested) */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '14px' }}>
            <Filter size={18} /> Filters:
          </div>

          {/* Section Filter */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '6px', fontWeight: 600 }}>Section:</label>
            <select value={section} onChange={(e) => setSection(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px' }}>
              <option value="All">All Sections</option>
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
              <option value="Section C">Section C</option>
              <option value="Section D">Section D</option>
              <option value="Section E">Section E</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '6px', fontWeight: 600 }}>Subject:</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px' }}>
              <option value="All">All Subjects</option>
              {subjectsList.map(s => (
                <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
              ))}
            </select>
          </div>

          {/* Faculty Filter */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '6px', fontWeight: 600 }}>Faculty:</label>
            <select value={faculty} onChange={(e) => setFaculty(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px' }}>
              <option value="All">All Faculty</option>
              {facultyList.map(f => (
                <option key={f.faculty_id} value={f.faculty_id}>{f.faculty_name}</option>
              ))}
            </select>
          </div>

          {/* Room Filter */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '6px', fontWeight: 600 }}>Room:</label>
            <select value={room} onChange={(e) => setRoom(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px' }}>
              <option value="All">All Rooms</option>
              {roomsList.map(r => (
                <option key={r.room_id} value={r.room_id}>{r.room_name}</option>
              ))}
            </select>
          </div>

          {/* Day Filter */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '6px', fontWeight: 600 }}>Day:</label>
            <select value={day} onChange={(e) => setDay(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px' }}>
              <option value="All">All Days</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <button onClick={resetFilters} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', marginLeft: 'auto' }}>
            <RefreshCw size={14} /> Reset Filters
          </button>
        </div>
      </div>

      {/* Timetable View */}
      {viewMode === 'grid' ? (
        <div className="card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Filtering schedule...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '950px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(5, 1fr)', gap: '10px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <div>Period / Time</div>
                  {days.map(d => <div key={d}>{d}</div>)}
                </div>

                {periods.map(p => (
                  <div key={p} style={{ display: 'grid', gridTemplateColumns: '110px repeat(5, 1fr)', gap: '10px', marginTop: '10px', alignItems: 'stretch' }}>
                    <div style={{ background: 'var(--bg-card-secondary)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <strong>Period {p}</strong>
                      <span>{p === 1 ? '08:00 - 08:50' : p === 2 ? '09:00 - 09:50' : p === 3 ? '10:00 - 10:50' : p === 4 ? '11:00 - 11:50' : p === 5 ? '13:00 - 13:50' : '14:00 - 14:50'}</span>
                    </div>

                    {days.map(d => {
                      const entries = getCellEntries(d, p);
                      if (entries.length === 0) {
                        return (
                          <div key={d} style={{ background: 'var(--bg-sidebar)', borderRadius: '8px', border: '1px dashed var(--border-color)', padding: '12px', minHeight: '85px', opacity: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>- Free -</span>
                          </div>
                        );
                      }

                      return (
                        <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {entries.map((entry, eIdx) => {
                            const isClass = entry.status === 'Class';

                            return (
                              <div
                                key={eIdx}
                                style={{
                                  background: isClass ? 'var(--bg-card-secondary)' : 'rgba(124, 92, 252, 0.08)',
                                  borderLeft: `4px solid ${isClass ? 'var(--accent-secondary)' : 'var(--accent-primary)'}`,
                                  borderRadius: '8px',
                                  padding: '8px 10px',
                                  border: '1px solid var(--border-color)',
                                  minHeight: '80px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-main)' }}>
                                    {entry.subject_code}
                                  </span>
                                  <span className={`badge ${isClass ? 'badge-class' : 'badge-break'}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                                    {entry.status}
                                  </span>
                                </div>

                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
                                  {entry.subject_name}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--accent-secondary)', marginTop: '4px' }}>
                                  <span>{entry.faculty_name}</span>
                                  <span>{entry.room_name}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DAY</th>
                  <th>PERIOD</th>
                  <th>TIME</th>
                  <th>SECTION</th>
                  <th>GROUP</th>
                  <th>SUBJECT CODE</th>
                  <th>SUBJECT NAME</th>
                  <th>FACULTY</th>
                  <th>ROOM</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((row, idx) => (
                  <tr key={idx}>
                    <td><strong>{row.day}</strong></td>
                    <td>P{row.period}</td>
                    <td>{row.start_time} - {row.end_time}</td>
                    <td>{row.section}</td>
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
        </div>
      )}
    </AdminLayout>
  );
}
