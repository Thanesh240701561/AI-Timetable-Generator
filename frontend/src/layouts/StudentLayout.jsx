import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function StudentLayout({ children, title }) {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title={title || "Student Portal"} />
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
}
