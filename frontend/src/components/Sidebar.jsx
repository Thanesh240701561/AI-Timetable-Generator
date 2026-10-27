import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, Upload, Eye, Users, BookOpen, UserCheck, DoorClosed,
  Boxes, Clock, CalendarCheck, Table, Grid, Layers, AlertTriangle,
  Download, Cpu, LogOut, Calendar, Book
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">AI</div>
        <div>
          <div className="brand-title">AI Timetable</div>
          <div className="brand-subtitle">{isAdmin ? 'Admin Portal' : 'Student Portal'}</div>
        </div>
      </div>

      <div className="sidebar-menu">
        {isAdmin ? (
          <>
            <div className="menu-category">Main Dashboard</div>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>

            <div className="menu-category">Excel Management</div>
            <NavLink to="/admin/upload-excel" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Upload size={18} /> Upload Excel
            </NavLink>
            <NavLink to="/admin/excel-preview" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Eye size={18} /> Excel Data Preview
            </NavLink>

            <div className="menu-category">Data Entities</div>
            <NavLink to="/admin/students" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={18} /> Students
            </NavLink>
            <NavLink to="/admin/subjects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <BookOpen size={18} /> Subjects
            </NavLink>
            <NavLink to="/admin/faculty" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserCheck size={18} /> Faculty
            </NavLink>
            <NavLink to="/admin/rooms" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <DoorClosed size={18} /> Rooms
            </NavLink>
            <NavLink to="/admin/groups" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Boxes size={18} /> Teacher Groups
            </NavLink>
            <NavLink to="/admin/timeslots" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Clock size={18} /> Time Slots
            </NavLink>

            <div className="menu-category">Scheduling & Views</div>
            <NavLink to="/admin/generate" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <CalendarCheck size={18} /> Generate Timetable
            </NavLink>
            <NavLink to="/admin/timetable/complete" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Table size={18} /> Complete Timetable
            </NavLink>
            <NavLink to="/admin/timetable/section" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Layers size={18} /> Section Timetable
            </NavLink>

            <div className="menu-category">Reports & Engine</div>
            <NavLink to="/admin/conflicts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <AlertTriangle size={18} /> Conflict Report
            </NavLink>
            <NavLink to="/admin/export" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Download size={18} /> Export Timetable
            </NavLink>
            <NavLink to="/admin/ai-explanation" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Cpu size={18} /> AI Explanation
            </NavLink>
          </>
        ) : (
          <>
            <div className="menu-category">Student Area</div>
            <NavLink to="/student/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/student/my-timetable" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={18} /> My Timetable
            </NavLink>
            <NavLink to="/student/today" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Clock size={18} /> Today's Classes
            </NavLink>
            <NavLink to="/student/group" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Boxes size={18} /> My Group
            </NavLink>
            <NavLink to="/student/subjects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Book size={18} /> My Subjects
            </NavLink>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
