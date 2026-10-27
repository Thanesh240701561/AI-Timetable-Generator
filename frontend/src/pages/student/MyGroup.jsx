import React, { useContext } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import { AuthContext } from '../../context/AuthContext';
import { Boxes } from 'lucide-react';

export default function MyGroup() {
  const { user } = useContext(AuthContext);

  return (
    <StudentLayout title="My Group">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>My Assigned Group</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Details regarding your group allocation for class scheduling.
        </p>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'rgba(124, 92, 252, 0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Boxes size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Group {user?.group_id || 'G1'}</h3>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Assigned Section: <strong>{user?.section || 'Section A'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-sidebar)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Primary Teacher</div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent-secondary)' }}>Dr. Smith</div>
          </div>
          <div style={{ background: 'var(--bg-sidebar)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Assigned Venue Room</div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--status-success)' }}>Hall A202 (R101)</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-sidebar)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Welcome to Group <strong>{user?.group_id || 'G1'}</strong>. Your personalized class schedule is automatically synchronized with your assigned section and classroom venue.
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
