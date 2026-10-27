import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import { Calendar, Clock, BookOpen, User, CheckCircle2, ArrowRight } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);
  const [studentInfo, setStudentInfo] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentSchedule();
  }, []);

  const fetchStudentSchedule = async () => {
    setLoading(true);
    try {
      const res = await API.get('/timetable/student');
      setStudentInfo(res.data.student);
      setTimetable(res.data.timetable || []);
    } catch (err) {
      console.error("Fetch student schedule error:", err);
    } finally {
      setLoading(false);
    }
  };

  const todayClasses = timetable.filter(t => t.day === 'Monday'); // Demo default day
  const nextClass = todayClasses.find(t => t.status === 'Class');

  return (
    <StudentLayout title="Student Dashboard">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 700 }}>
          Welcome, {user?.name || studentInfo?.student_name || 'Student'}!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Student ID: <strong>{user?.user_id || studentInfo?.student_id}</strong> | Section: <strong>{user?.section || studentInfo?.section}</strong> | Group: <strong style={{ color: 'var(--accent-secondary)' }}>{user?.group_id || studentInfo?.group_id}</strong>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Today's Classes Summary */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="card-title" style={{ fontSize: '18px' }}>
              <Clock size={20} color="var(--accent-secondary)" /> Today's Classes (Monday)
            </h3>
            <button onClick={() => navigate('/student/my-timetable')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
              View Full Timetable <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading schedule...</div>
          ) : todayClasses.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No classes scheduled for today.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayClasses.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: item.status === 'Class' ? 'var(--bg-card-secondary)' : 'rgba(124, 92, 252, 0.08)',
                    borderLeft: `4px solid ${item.status === 'Class' ? 'var(--status-success)' : 'var(--accent-primary)'}`,
                    borderRadius: '8px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{item.subject_name} ({item.subject_code})</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Faculty: {item.faculty_name} | Room: {item.room_name}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${item.status === 'Class' ? 'badge-class' : 'badge-break'}`}>
                      {item.status}
                    </span>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {item.start_time} - {item.end_time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Info Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Next Class Box */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card-secondary), var(--bg-card))', borderColor: 'var(--accent-primary)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: '12px' }}>
              Next Upcoming Class
            </h4>
            {nextClass ? (
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>{nextClass.subject_name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Room {nextClass.room_name} • {nextClass.faculty_name}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--status-success)' }}>
                  Time: {nextClass.start_time} - {nextClass.end_time}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No more classes today. Enjoy your break!</div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="card">
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>My Quick Info</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-sidebar)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)' }}>{user?.section || 'Sec A'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Section</div>
              </div>
              <div style={{ background: 'var(--bg-sidebar)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-secondary)' }}>{user?.group_id || 'G1'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Group ID</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
