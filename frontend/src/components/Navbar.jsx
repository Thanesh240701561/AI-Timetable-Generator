import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Bell } from 'lucide-react';

export default function Navbar({ title = 'AI Timetable Generator' }) {
  const { user } = useContext(AuthContext);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="top-navbar">
      <div className="top-title">{title}</div>
      <div className="user-profile-badge">
        <div style={{ position: 'relative', cursor: 'pointer', marginRight: '10px' }}>
          <Bell size={20} color="#A8B3C7" />
        </div>
        <div className="avatar">{initial}</div>
        <div>
          <div className="user-name">{user?.name || 'User'}</div>
          <div className="user-role">{user?.role === 'admin' ? 'Administrator' : `Student (${user?.user_id})`}</div>
        </div>
      </div>
    </header>
  );
}
