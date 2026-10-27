import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../services/api';
import { Play, RefreshCw, CheckCircle2, AlertTriangle, Layers, Clock, Cpu, FileSpreadsheet } from 'lucide-react';

export default function GenerateTimetable() {
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const steps = [
    "Read Excel Data",
    "Create Teacher Groups",
    "Assign Rooms & Faculty",
    "Apply Hard Constraints",
    "Check Conflicts",
    "Generate Timetable"
  ];

  const handleGenerate = async (isRegenerate = false) => {
    setGenerating(true);
    setCurrentStep(0);
    setError('');
    setResult(null);

    // Simulate progress animation step by step
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i + 1);
      await new Promise(r => setTimeout(r, 250));
    }

    try {
      const endpoint = isRegenerate ? '/regenerate-timetable' : '/generate-timetable';
      const res = await API.post(endpoint);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate timetable.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AdminLayout title="Generate Timetable">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Generate Timetable</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Run the Artificial Intelligence Constraint Satisfaction Solver to schedule group-wise parallel classes.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Action & Step Progress */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(124, 92, 252, 0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>AI Scheduling Engine</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>CSP Solver with Heuristics & Backtracking</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleGenerate(false)}
                className="btn btn-primary"
                disabled={generating}
              >
                {generating ? <RefreshCw size={18} className="spin" /> : <Play size={18} />}
                {generating ? 'Generating...' : 'Generate Timetable'}
              </button>

              <button
                onClick={() => handleGenerate(true)}
                className="btn btn-secondary"
                disabled={generating}
              >
                <RefreshCw size={18} /> Regenerate
              </button>
            </div>
          </div>

          {/* Progress Steps Visualizer */}
          <div style={{ marginTop: '30px', padding: '20px', background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-secondary)' }}>
              Generation Progress Flow
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {steps.map((stepLabel, idx) => {
                const stepNum = idx + 1;
                const isDone = currentStep > stepNum || (result && !generating);
                const isCurrent = currentStep === stepNum && generating;

                return (
                  <div key={idx} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      margin: '0 auto 8px auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: isDone ? 'var(--status-success)' : isCurrent ? 'var(--accent-primary)' : 'var(--bg-card-secondary)',
                      color: isDone || isCurrent ? '#fff' : 'var(--text-secondary)',
                      boxShadow: isCurrent ? 'var(--shadow-glow)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      {isDone ? <CheckCircle2 size={20} /> : stepNum}
                    </div>
                    <div style={{ fontSize: '11px', color: isDone || isCurrent ? 'var(--text-main)' : 'var(--text-secondary)', fontWeight: isCurrent ? 700 : 400 }}>
                      {stepLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {result && (
            <div style={{ marginTop: '24px', padding: '20px', background: result.success ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)', border: `1px solid ${result.success ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`, borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                {result.success ? <CheckCircle2 size={28} color="var(--status-success)" /> : <AlertTriangle size={28} color="var(--status-error)" />}
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: result.success ? 'var(--status-success)' : 'var(--status-error)' }}>
                    {result.message}
                  </h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Generated {result.stats.total_entries} total timetable records ({result.stats.assigned_classes} Classes, {result.stats.total_entries - result.stats.assigned_classes} Automatic Breaks).
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button onClick={() => navigate('/admin/timetable/complete')} className="btn btn-primary" style={{ fontSize: '13px' }}>
                  View Complete Timetable
                </button>
                <button onClick={() => navigate('/admin/timetable/section')} className="btn btn-secondary" style={{ fontSize: '13px' }}>
                  View Section Timetable
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Data Source Sidebar */}
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '16px', marginBottom: '16px' }}>
            <FileSpreadsheet size={18} color="var(--accent-secondary)" /> Active Input Workbook
          </h3>

          <div style={{ background: 'var(--bg-sidebar)', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--accent-secondary)' }}>sample_timetable.xlsx</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Status: Validated & Ready
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Total Tasks to Schedule:</span>
              <strong style={{ color: 'var(--text-main)' }}>{result?.stats?.total_tasks || 17}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Assigned Classes:</span>
              <strong style={{ color: 'var(--status-success)' }}>{result?.stats?.assigned_classes || 17}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Unassigned Tasks:</span>
              <strong style={{ color: result?.stats?.unassigned_count > 0 ? 'var(--status-error)' : 'var(--text-main)' }}>{result?.stats?.unassigned_count || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Detected Conflicts:</span>
              <strong style={{ color: result?.stats?.conflict_count > 0 ? 'var(--status-error)' : 'var(--status-success)' }}>{result?.stats?.conflict_count || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
