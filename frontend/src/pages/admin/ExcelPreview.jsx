import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../services/api';
import { Search, Database, Layers } from 'lucide-react';

const pathToTabMap = {
  '/admin/students': 'Students',
  '/admin/subjects': 'Subjects',
  '/admin/faculty': 'Faculty',
  '/admin/rooms': 'Rooms',
  '/admin/groups': 'TeacherGroups',
  '/admin/timeslots': 'TimeSlots',
  '/admin/excel-preview': 'Students'
};

const titleMap = {
  'Students': 'Students Data',
  'Subjects': 'Subjects Data',
  'Faculty': 'Faculty Data',
  'Rooms': 'Rooms Data',
  'TeacherGroups': 'Teacher Groups Data',
  'TimeSlots': 'Time Slots Data',
  'Availability': 'Availability Data'
};

export default function ExcelPreview() {
  const location = useLocation();
  const [excelData, setExcelData] = useState({});
  const initialTab = pathToTabMap[location.pathname] || 'Students';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreviewData();
  }, []);

  useEffect(() => {
    const targetTab = pathToTabMap[location.pathname];
    if (targetTab) {
      setActiveTab(targetTab);
    }
  }, [location.pathname]);

  const fetchPreviewData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/excel-preview');
      setExcelData(res.data.data || {});
    } catch (err) {
      console.error("Preview fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sheets = ['Students', 'Subjects', 'Faculty', 'TeacherGroups', 'Rooms', 'TimeSlots', 'Availability'];

  const rawRows = excelData[activeTab] || [];

  const filteredRows = rawRows.filter(row => {
    if (!search) return true;
    return Object.values(row).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  const pageTitle = titleMap[activeTab] || 'Excel Data Preview';

  return (
    <AdminLayout title={pageTitle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{pageTitle}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Inspect loaded entity records and verify system data relationships.
          </p>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px' }}
          />
          <Search size={18} color="#A8B3C7" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px' }}>
        {sheets.map(sheet => (
          <button
            key={sheet}
            onClick={() => setActiveTab(sheet)}
            className={`btn ${activeTab === sheet ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}
          >
            {sheet} ({excelData[sheet]?.length || 0})
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="card-title" style={{ fontSize: '16px' }}>
            <Database size={18} color="var(--accent-secondary)" /> Sheet: {activeTab}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Showing {filteredRows.length} of {rawRows.length} entries
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading sheet data...</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No records found.</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col}>{col.replace('_', ' ').toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map(col => (
                      <td key={col}>
                        {col === 'status' || col === 'available' ? (
                          <span className={`badge ${row[col] === 1 || row[col] === 'Valid' || row[col] === 'Class' ? 'badge-class' : 'badge-break'}`}>
                            {String(row[col])}
                          </span>
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
