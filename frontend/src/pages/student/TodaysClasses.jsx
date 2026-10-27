import React, { useState, useEffect } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import API from '../../services/api';
import { Clock, Calendar } from 'lucide-react';

export default function TodaysClasses() {
  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayClasses();
  }, []);

  const fetchTodayClasses = async () => {
    setLoading(true);
    try {
      const res = await API.get('/timetable/student');
      const all = res.data.timetable || [];
      const monday = all.filter(t => t.day === 'Monday');
      setTodayClasses(monday);
    } catch (err) {
      console.error("Today classes error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout title="Today's Classes">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Today's Schedule</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Monday, Active Academic Semester
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <h3 className="card-title" style={{ fontSize: '18px', marginBottom: '20px' }}>
          <Clock size={20} color="var(--accent-secondary)" /> Class Timeline
        </h3>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading today's classes...</div>
        ) : todayClasses.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No classes scheduled for today.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {todayClasses.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: item.status === 'Class' ? 'var(--bg-card-secondary)' : 'rgba(124, 92, 252, 0.08)',
                  borderLeft: `4px solid ${item.status === 'Class' ? 'var(--status-success)' : 'var(--accent-primary)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-secondary)', width: '110px' }}>
                    {item.start_time} - {item.end_time}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-main)' }}>
                      {item.subject_name} ({item.subject_code})
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Faculty: {item.faculty_name} | Room: {item.room_name}
                    </div>
                  </div>
                </div>

                <div>
                  <span className={`badge ${item.status === 'Class' ? 'badge-class' : 'badge-break'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
