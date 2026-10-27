import React, { useState, useEffect, useContext } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import { Calendar, Clock, Layers } from 'lucide-react';

export default function MyTimetable() {
  const { user } = useContext(AuthContext);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentTimetable();
  }, []);

  const fetchStudentTimetable = async () => {
    setLoading(true);
    try {
      const res = await API.get('/timetable/student');
      setTimetable(res.data.timetable || []);
    } catch (err) {
      console.error("Student timetable error:", err);
    } finally {
      setLoading(false);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  // Map entries into lookup matrix by day and start_time
  const getCellForSlot = (day, timeStr) => {
    return timetable.find(t => t.day === day && t.start_time.startsWith(timeStr));
  };

  // Color borders for subject cards
  const colorBorders = ['#22D3EE', '#34D399', '#FBBF24', '#7C5CFC', '#F87171', '#38BDF8'];

  return (
    <StudentLayout title="My Timetable">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.5px' }}>My timetable</h1>
        <div style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>
          {timetable.length} sessions scheduled this semester
        </div>
      </div>

      {/* Schedule Banner Card matching Image 1 */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #171F35, #11182B)', border: '1px solid #2D3955', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(124, 92, 252, 0.2)', color: '#7C5CFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>This semester's schedule</h3>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Your confirmed weekly timetable — room and faculty details included.
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(124, 92, 252, 0.2)', color: '#7C5CFC', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
            {timetable.length} sessions
          </div>
        </div>
      </div>

      {/* Weekly Matrix Schedule Grid */}
      <div className="card" style={{ background: '#11182B', border: '1px solid #2D3955', padding: '20px' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading schedule matrix...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '950px' }}>
              {/* Header Days Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '90px repeat(6, 1fr)', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #2D3955' }}>
                <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>Time</div>
                {days.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Time Slot Rows */}
              {timeSlots.map((tStr, tIdx) => (
                <div key={tStr} style={{ display: 'grid', gridTemplateColumns: '90px repeat(6, 1fr)', gap: '12px', marginTop: '12px', alignItems: 'stretch' }}>
                  {/* Time Label */}
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'flex-start', paddingTop: '8px' }}>
                    {tStr}
                  </div>

                  {/* Days Cells */}
                  {days.map((day, dIdx) => {
                    const entry = getCellForSlot(day, tStr);

                    if (!entry) {
                      return (
                        <div
                          key={day}
                          style={{
                            background: 'transparent',
                            minHeight: '75px'
                          }}
                        />
                      );
                    }

                    const isClass = entry.status === 'Class';
                    const accentColor = colorBorders[(tIdx + dIdx) % colorBorders.length];

                    return (
                      <div
                        key={day}
                        style={{
                          background: isClass ? '#171F35' : 'rgba(124, 92, 252, 0.06)',
                          border: '1px solid #2D3955',
                          borderLeft: `4px solid ${isClass ? accentColor : 'var(--accent-primary)'}`,
                          borderRadius: '10px',
                          padding: '10px 12px',
                          minHeight: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#F8FAFC' }}>
                              {entry.subject_code}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              {entry.room_name}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>
                            {entry.subject_name}
                          </div>
                        </div>

                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {entry.start_time} - {entry.end_time}
                          </span>
                          <span style={{ fontSize: '10px', color: isClass ? accentColor : 'var(--accent-primary)', fontWeight: 700 }}>
                            {isClass ? entry.faculty_name : 'Break'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
