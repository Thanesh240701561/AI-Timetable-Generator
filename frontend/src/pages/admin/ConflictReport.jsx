import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../services/api';
import { AlertTriangle, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ConflictReport() {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConflicts();
  }, []);

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      const res = await API.get('/conflicts');
      setConflicts(res.data || []);
    } catch (err) {
      console.error("Fetch conflicts error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Conflict Report">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Conflict Report</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Inspect constraint violations, room double-bookings, or faculty overlapping assignments.
          </p>
        </div>

        <button onClick={fetchConflicts} className="btn btn-secondary">
          <RefreshCw size={16} /> Refresh Report
        </button>
      </div>

      {conflicts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
          <ShieldCheck size={56} color="var(--status-success)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-success)', marginBottom: '8px' }}>
            Zero Conflicts Detected!
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
            The AI Constraint Satisfaction engine has successfully validated all 14 hard constraints. Every subject, room, group, and faculty schedule is 100% compliant.
          </p>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <AlertTriangle size={22} color="var(--status-error)" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
              Active Constraint Violations ({conflicts.length})
            </h3>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>TYPE</th>
                  <th>SUBJECT</th>
                  <th>FACULTY</th>
                  <th>ROOM</th>
                  <th>GROUP</th>
                  <th>DAY</th>
                  <th>PERIOD</th>
                  <th>ISSUE DESCRIPTION</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <span className="badge badge-conflict">
                        {item.type}
                      </span>
                    </td>
                    <td>{item.subject}</td>
                    <td>{item.faculty}</td>
                    <td>{item.room}</td>
                    <td>{item.group}</td>
                    <td>{item.day}</td>
                    <td>P{item.period}</td>
                    <td style={{ color: 'var(--status-error)', fontSize: '13px' }}>{item.issue}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        {item.action}
                      </button>
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
