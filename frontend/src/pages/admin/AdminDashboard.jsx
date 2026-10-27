import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../services/api';
import {
  Users, BookOpen, UserCheck, DoorClosed, Boxes, Clock,
  AlertTriangle, CheckCircle2, Upload, FileCheck, RefreshCw,
  Calendar, Download, Play, ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    students: 0,
    subjects: 0,
    faculty: 0,
    rooms: 0,
    groups: 0,
    timeslots: 0
  });
  const [genStatus, setGenStatus] = useState({
    status: 'Not Generated',
    last_generation_time: '-',
    stats: { total_tasks: 0, conflict_count: 0, unassigned_count: 0 }
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [stuRes, subRes, facRes, rmRes, grpRes, tsRes, statusRes] = await Promise.all([
        API.get('/students'),
        API.get('/subjects'),
        API.get('/faculty'),
        API.get('/rooms'),
        API.get('/groups'),
        API.get('/timeslots'),
        API.get('/generation-status')
      ]);

      setCounts({
        students: stuRes.data.length,
        subjects: subRes.data.length,
        faculty: facRes.data.length,
        rooms: rmRes.data.length,
        groups: grpRes.data.length,
        timeslots: tsRes.data.length
      });

      setGenStatus(statusRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Dashboard">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 700 }}>Welcome back, Admin!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Overview of system entity metrics, active schedule status, and Quick Actions.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="dashboard-grid">
        <div className="stat-card" onClick={() => navigate('/admin/students')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Users size={24} /></div>
          <div>
            <div className="stat-value">{counts.students}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/subjects')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><BookOpen size={24} /></div>
          <div>
            <div className="stat-value">{counts.subjects}</div>
            <div className="stat-label">Total Subjects</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/faculty')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><UserCheck size={24} /></div>
          <div>
            <div className="stat-value">{counts.faculty}</div>
            <div className="stat-label">Total Faculty</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/rooms')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><DoorClosed size={24} /></div>
          <div>
            <div className="stat-value">{counts.rooms}</div>
            <div className="stat-label">Total Rooms</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/groups')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Boxes size={24} /></div>
          <div>
            <div className="stat-value">{counts.groups}</div>
            <div className="stat-label">Total Groups</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/timeslots')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Clock size={24} /></div>
          <div>
            <div className="stat-value">{counts.timeslots}</div>
            <div className="stat-label">Total Time Slots</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: genStatus.stats.conflict_count > 0 ? 'var(--status-error)' : 'var(--border-color)' }}>
          <div className="stat-icon" style={{ background: 'rgba(248, 113, 113, 0.15)', color: 'var(--status-error)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: genStatus.stats.conflict_count > 0 ? 'var(--status-error)' : 'var(--text-main)' }}>
              {genStatus.stats.conflict_count}
            </div>
            <div className="stat-label">Conflicts Detected</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--status-success)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: '18px' }}>
              <span className={`badge ${genStatus.status === 'Generated' ? 'badge-class' : 'badge-warning'}`}>
                {genStatus.status}
              </span>
            </div>
            <div className="stat-label">Timetable Status</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Last generated: {genStatus.last_generation_time}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <button onClick={() => navigate('/admin/upload-excel')} className="btn btn-secondary" style={{ padding: '16px', justifyContent: 'flex-start' }}>
            <Upload size={20} color="var(--accent-primary)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Upload Excel</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Import sheet data</div>
            </div>
          </button>

          <button onClick={() => navigate('/admin/excel-preview')} className="btn btn-secondary" style={{ padding: '16px', justifyContent: 'flex-start' }}>
            <FileCheck size={20} color="var(--accent-secondary)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Validate Data</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Check schema integrity</div>
            </div>
          </button>

          <button onClick={() => navigate('/admin/generate')} className="btn btn-primary" style={{ padding: '16px', justifyContent: 'flex-start' }}>
            <Play size={20} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Generate Timetable</div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>Run AI CSP Solver</div>
            </div>
          </button>

          <button onClick={() => navigate('/admin/timetable/complete')} className="btn btn-secondary" style={{ padding: '16px', justifyContent: 'flex-start' }}>
            <Calendar size={20} color="var(--status-success)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>View Timetable</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Full matrix schedule</div>
            </div>
          </button>

          <button onClick={() => navigate('/admin/export')} className="btn btn-secondary" style={{ padding: '16px', justifyContent: 'flex-start' }}>
            <Download size={20} color="var(--status-warning)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Export Timetable</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Download .xlsx files</div>
            </div>
          </button>

          <button onClick={() => navigate('/admin/conflicts')} className="btn btn-secondary" style={{ padding: '16px', justifyContent: 'flex-start' }}>
            <AlertTriangle size={20} color="var(--status-error)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Conflict Report</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Inspect & resolve</div>
            </div>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
