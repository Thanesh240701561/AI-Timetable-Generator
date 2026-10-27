import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '40px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(248, 113, 113, 0.15)', color: 'var(--status-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <ShieldAlert size={36} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Access Denied (403)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
          You do not have permission to access this page. Please contact system administration if you believe this is an error.
        </p>

        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%' }}>
          <ArrowLeft size={16} /> Return to Login / Dashboard
        </button>
      </div>
    </div>
  );
}
