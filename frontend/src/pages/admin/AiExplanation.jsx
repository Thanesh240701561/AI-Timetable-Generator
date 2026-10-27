import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Cpu, CheckCircle2, ArrowDown, Sparkles, BookOpen, Layers, ShieldCheck } from 'lucide-react';

export default function AiExplanation() {
  const concepts = [
    { title: "1. Constraint Satisfaction Problem (CSP)", desc: "Formalized as a set of variables (slots), domains (possible times/rooms), and hard constraints that must all be satisfied simultaneously." },
    { title: "2. Variables", desc: "Timetable task instances representing each required period for subject groups." },
    { title: "3. Domains", desc: "Available time slots (Day + Period) combined with available matching room types." },
    { title: "4. Hard Constraints", desc: "No double-booking for faculty, rooms, or student groups. Room capacity >= group size. Room type must match subject type." },
    { title: "5. Backtracking Search", desc: "Depth-first search algorithm that undoes invalid class placements when dead-end states are encountered." },
    { title: "6. Heuristics (MRV & Degree)", desc: "Schedules difficult tasks first: Labs priority, subjects with more weekly periods, and restricted faculty." },
    { title: "7. Randomized Scheduling", desc: "Shuffles valid slots within valid domains to produce balanced, diverse schedules across runs." },
    { title: "8. Group-Wise Parallel Scheduling", desc: "Teachers and students are partitioned into groups (G1, G2, etc.). Different groups can attend different classes during the same period." },
    { title: "9. Automatic Break Generation", desc: "When one group attends a class during a slot, inactive groups automatically receive a 'Break' status without conflict errors." },
    { title: "10. Conflict Detection", desc: "Post-generation verification scan checking for overlap or capacity violations." }
  ];

  const workflowSteps = [
    "Excel Data",
    "Create Subject Groups",
    "Create Timetable Tasks",
    "Select Random Valid Slot",
    "Check Constraints",
    "Assign Class to Relevant Group",
    "Generate Breaks for Other Groups",
    "Validate Timetable",
    "Display Student-Specific Timetable"
  ];

  return (
    <AdminLayout title="AI Explanation">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>AI Scheduling Architecture & Explanation</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Understanding the Artificial Intelligence Constraint Satisfaction Problem (CSP) formulation and workflow.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Concepts Accordion / List */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Cpu size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Core AI & Scheduling Concepts</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {concepts.map((item, idx) => (
              <div key={idx} style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-secondary)', marginBottom: '4px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graphical Workflow Diagram */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Sparkles size={22} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>System Execution Workflow</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {workflowSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div style={{
                  width: '100%',
                  background: idx === 0 || idx === workflowSteps.length - 1 ? 'var(--bg-card-secondary)' : 'var(--bg-sidebar)',
                  border: `1px solid ${idx === workflowSteps.length - 1 ? 'var(--status-success)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: idx === workflowSteps.length - 1 ? 'var(--status-success)' : 'var(--text-main)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {step}
                </div>

                {idx < workflowSteps.length - 1 && (
                  <ArrowDown size={18} color="var(--accent-primary)" style={{ margin: '2px 0' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
