import random
from services.constraint_checker import ConstraintChecker
from services.break_generator import BreakGenerator

class TimetableGenerator:
    def __init__(self, data):
        self.data = data
        self.checker = ConstraintChecker(data)
        self.break_gen = BreakGenerator(data)

        self.students_df = data.get("Students")
        self.subjects_df = data.get("Subjects")
        self.faculty_df = data.get("Faculty")
        self.groups_df = data.get("TeacherGroups")
        self.rooms_df = data.get("Rooms")
        self.slots_df = data.get("TimeSlots")

        self.subject_map = self.subjects_df.set_index("subject_id").to_dict("index") if not self.subjects_df.empty else {}
        self.faculty_map = self.faculty_df.set_index("faculty_id").to_dict("index") if not self.faculty_df.empty else {}
        self.group_map = {}
        if not self.groups_df.empty:
            for _, row in self.groups_df.iterrows():
                g_id = str(row.get("group_id"))
                max_cap = int(row.get("max_capacity", 60))
                if g_id not in self.group_map:
                    self.group_map[g_id] = {"max_capacity": max_cap}
                else:
                    self.group_map[g_id]["max_capacity"] = max(self.group_map[g_id]["max_capacity"], max_cap)
        self.room_map = self.rooms_df.set_index("room_id").to_dict("index") if not self.rooms_df.empty else {}

        # Prepare available time slots list
        self.time_slots = []
        if not self.slots_df.empty:
            for _, row in self.slots_df.iterrows():
                self.time_slots.append({
                    "slot_id": str(row.get("slot_id")),
                    "day": str(row.get("day")),
                    "period": int(row.get("period")),
                    "start_time": str(row.get("start_time")),
                    "end_time": str(row.get("end_time"))
                })

    def generate(self):
        """
        Executes the CSP Timetable Generation.
        Returns dict with:
        {
            "success": True/False,
            "timetable": [...],
            "conflicts": [...],
            "unassigned_tasks": [...],
            "stats": {...},
            "message": "..."
        }
        """
        # 1. Create Timetable Tasks
        tasks = []
        task_id_counter = 1

        if self.groups_df.empty:
            return {
                "success": False,
                "timetable": [],
                "conflicts": [],
                "unassigned_tasks": [],
                "stats": {},
                "message": "No Teacher Groups found in Excel data."
            }

        for _, grp_row in self.groups_df.iterrows():
            grp_id = str(grp_row.get("group_id"))
            sub_id = str(grp_row.get("subject_id"))
            fac_id = str(grp_row.get("faculty_id"))
            rm_id = str(grp_row.get("room_id"))

            sub_info = self.subject_map.get(sub_id, {})
            fac_info = self.faculty_map.get(fac_id, {})
            rm_info = self.room_map.get(rm_id, {})

            sub_name = str(sub_info.get("subject_name", sub_id))
            sub_code = str(sub_info.get("subject_code", sub_id))
            sub_type = str(sub_info.get("subject_type", "Lecture"))
            periods_needed = int(sub_info.get("periods_per_week", 3))

            fac_name = str(fac_info.get("faculty_name", fac_id))
            rm_name = str(rm_info.get("room_name", rm_id))

            # Find section
            section = "Section A"
            if not self.students_df.empty:
                stu_match = self.students_df[self.students_df["group_id"].astype(str) == grp_id]
                if not stu_match.empty:
                    section = str(stu_match.iloc[0].get("section", "Section A"))

            for instance in range(1, periods_needed + 1):
                tasks.append({
                    "task_id": f"TSK_{task_id_counter}",
                    "group_id": grp_id,
                    "subject_id": sub_id,
                    "subject_code": sub_code,
                    "subject_name": sub_name,
                    "subject_type": sub_type,
                    "faculty_id": fac_id,
                    "faculty_name": fac_name,
                    "room_id": rm_id,
                    "room_name": rm_name,
                    "section": section,
                    "periods_needed": periods_needed,
                    "instance": instance
                })
                task_id_counter += 1

        # 2. Sort Tasks using Heuristics (MRV & Most Constrained First)
        # Priority: Labs first -> higher periods_per_week -> task_id
        def task_difficulty_key(t):
            is_lab = 0 if t["subject_type"].lower() == "lab" else 1
            return (is_lab, -t["periods_needed"])

        tasks.sort(key=task_difficulty_key)

        # 3. Solvers & Backtracking Depth First Search
        timetable_state = []
        unassigned_tasks = []

        success = self._backtrack(0, tasks, timetable_state, unassigned_tasks)

        # 4. Generate Automatic Breaks for Free Periods
        complete_timetable = self.break_gen.generate_automatic_breaks(timetable_state)

        # 5. Check Conflicts
        conflicts = self.checker.find_all_conflicts(timetable_state)

        stats = {
            "total_tasks": len(tasks),
            "assigned_classes": len(timetable_state),
            "total_entries": len(complete_timetable),
            "unassigned_count": len(unassigned_tasks),
            "conflict_count": len(conflicts)
        }

        msg = "Timetable generated successfully with 0 conflicts!" if success and len(conflicts) == 0 else \
              f"Timetable generated with {len(unassigned_tasks)} unassigned tasks and {len(conflicts)} conflicts."

        return {
            "success": success and len(conflicts) == 0,
            "timetable": complete_timetable,
            "conflicts": conflicts,
            "unassigned_tasks": unassigned_tasks,
            "stats": stats,
            "message": msg
        }

    def _backtrack(self, task_idx, tasks, timetable_state, unassigned_tasks, depth=0, max_depth=1000):
        if task_idx >= len(tasks):
            return True # All tasks assigned!

        if depth > max_depth:
            # Reached search limit, collect remaining as unassigned
            unassigned_tasks.extend(tasks[task_idx:])
            return False

        task = tasks[task_idx]

        # Shuffle available slots for randomized valid assignment
        slots_to_try = list(self.time_slots)
        random.shuffle(slots_to_try)

        for slot in slots_to_try:
            assignment = {
                "timetable_id": f"TT_{task['task_id']}",
                "subject_id": task["subject_id"],
                "subject_code": task["subject_code"],
                "subject_name": task["subject_name"],
                "group_id": task["group_id"],
                "section": task["section"],
                "faculty_id": task["faculty_id"],
                "faculty_name": task["faculty_name"],
                "room_id": task["room_id"],
                "room_name": task["room_name"],
                "day": slot["day"],
                "period": slot["period"],
                "start_time": slot["start_time"],
                "end_time": slot["end_time"],
                "status": "Class"
            }

            is_valid, reason = self.checker.is_valid_assignment(assignment, timetable_state)
            if is_valid:
                timetable_state.append(assignment)
                if self._backtrack(task_idx + 1, tasks, timetable_state, unassigned_tasks, depth + 1, max_depth):
                    return True
                # Backtrack!
                timetable_state.pop()

        # If no slot worked after trying all slots:
        unassigned_tasks.append(task)
        # Continue to next task to attempt max assignment
        return self._backtrack(task_idx + 1, tasks, timetable_state, unassigned_tasks, depth + 1, max_depth)
