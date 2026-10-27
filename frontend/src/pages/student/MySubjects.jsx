import React, { useState, useEffect } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import API from '../../services/api';
import { BookOpen } from 'lucide-react';

export default function MySubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await API.get('/subjects');
      setSubjects(res.data || []);
    } catch (err) {
      console.error("Fetch subjects error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout title="My Subjects">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>My Enrolled Subjects</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Overview of courses and weekly period quotas for this semester.
        </p>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ fontSize: '18px', marginBottom: '20px' }}>
          <BookOpen size={20} color="var(--accent-primary)" /> Enrolled Course List
        </h3>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading subjects...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SUBJECT CODE</th>
                  <th>SUBJECT NAME</th>
                  <th>TYPE</th>
                  <th>WEEKLY PERIODS</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub.subject_id}>
                    <td><strong style={{ color: 'var(--accent-secondary)' }}>{sub.subject_code}</strong></td>
                    <td>{sub.subject_name}</td>
                    <td>
                      <span className={`badge ${sub.subject_type === 'Lab' ? 'badge-break' : 'badge-class'}`}>
                        {sub.subject_type}
                      </span>
                    </td>
                    <td><strong>{sub.periods_per_week} periods / week</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
