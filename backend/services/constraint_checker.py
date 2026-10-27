class ConstraintChecker:
    def __init__(self, data):
        """
        data dictionary containing DataFrames:
        Students, Subjects, Faculty, TeacherGroups, Rooms, TimeSlots, Availability
        """
        self.students_df = data.get("Students")
        self.subjects_df = data.get("Subjects")
        self.faculty_df = data.get("Faculty")
        self.groups_df = data.get("TeacherGroups")
        self.rooms_df = data.get("Rooms")
        self.slots_df = data.get("TimeSlots")
        self.avail_df = data.get("Availability")

        # Build lookup maps for fast validation
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

        # Section lookup for groups
        self.group_to_sections = {}
        if not self.students_df.empty:
            for _, row in self.students_df.iterrows():
                grp = row.get("group_id")
                sec = row.get("section")
                if grp and sec:
                    if grp not in self.group_to_sections:
                        self.group_to_sections[grp] = set()
                    self.group_to_sections[grp].add(sec)

        # Availability map: (faculty_id, day, period) -> available (1 or 0)
        self.availability_map = {}
        if not self.avail_df.empty:
            for _, row in self.avail_df.iterrows():
                key = (str(row.get("faculty_id")), str(row.get("day")), int(row.get("period")))
                self.availability_map[key] = int(row.get("available", 1))

    def is_valid_assignment(self, assignment, timetable_state):
        """
        assignment: dict containing {
            'group_id': ..., 'subject_id': ..., 'faculty_id': ...,
            'room_id': ..., 'day': ..., 'period': ...
        }
        timetable_state: list of existing assigned dicts
        """
        fac_id = str(assignment["faculty_id"])
        rm_id = str(assignment["room_id"])
        grp_id = str(assignment["group_id"])
        sub_id = str(assignment["subject_id"])
        day = str(assignment["day"])
        period = int(assignment["period"])

        # 1. Faculty Availability Constraint
        avail_key = (fac_id, day, period)
        if avail_key in self.availability_map and self.availability_map[avail_key] == 0:
            return False, f"Faculty {fac_id} is unavailable on {day} Period {period}"

        # 2. Room Type Constraint (Lab vs Lecture)
        sub_info = self.subject_map.get(sub_id, {})
        rm_info = self.room_map.get(rm_id, {})
        sub_type = str(sub_info.get("subject_type", "Lecture"))
        rm_type = str(rm_info.get("room_type", "Lecture"))

        if sub_type.lower() == "lab" and rm_type.lower() != "lab":
            return False, f"Lab subject {sub_id} cannot be placed in non-lab room {rm_id}"

        # 3. Room Capacity Constraint
        grp_info = self.group_map.get(grp_id, {})
        grp_cap = int(grp_info.get("max_capacity", 0))
        rm_cap = int(rm_info.get("capacity", 999))
        if grp_cap > rm_cap:
            return False, f"Group capacity ({grp_cap}) exceeds room capacity ({rm_cap})"

        # Check against existing assigned timetable entries
        assigned_sections = self.group_to_sections.get(grp_id, set())

        for entry in timetable_state:
            if entry.get("status") != "Class":
                continue

            e_day = str(entry["day"])
            e_period = int(entry["period"])

            if e_day == day and e_period == period:
                # 4. Faculty double booking check
                if str(entry["faculty_id"]) == fac_id:
                    return False, f"Faculty {fac_id} is already teaching group {entry['group_id']} at {day} Period {period}"

                # 5. Room double booking check
                if str(entry["room_id"]) == rm_id:
                    return False, f"Room {rm_id} is already occupied by group {entry['group_id']} at {day} Period {period}"

                # 6. Group double booking check
                if str(entry["group_id"]) == grp_id:
                    return False, f"Group {grp_id} already has a class at {day} Period {period}"

                # 7. Section overlap check (If student groups in the same section cannot overlap)
                entry_sections = self.group_to_sections.get(str(entry["group_id"]), set())
                if assigned_sections and entry_sections and (assigned_sections & entry_sections):
                    # Note: Group-wise parallel scheduling allows different groups in the same section
                    # to have different classes IF they are distinct student groups.
                    # But the SAME group cannot attend two classes.
                    pass

        return True, "Valid"

    def find_all_conflicts(self, timetable_state):
        """
        Scans complete timetable state and reports any constraint violations.
        """
        conflicts = []
        # Group entries by (day, period)
        slot_map = {}
        for idx, entry in enumerate(timetable_state):
            if entry.get("status") != "Class":
                continue
            key = (str(entry["day"]), int(entry["period"]))
            if key not in slot_map:
                slot_map[key] = []
            slot_map[key].append((idx, entry))

        for (day, period), entries in slot_map.items():
            faculties = {}
            rooms = {}
            groups = {}

            for idx, entry in entries:
                f_id = str(entry["faculty_id"])
                r_id = str(entry["room_id"])
                g_id = str(entry["group_id"])

                if f_id in faculties:
                    conflicts.append({
                        "id": len(conflicts) + 1,
                        "type": "Faculty",
                        "subject": entry.get("subject_name"),
                        "faculty": entry.get("faculty_name"),
                        "room": entry.get("room_name"),
                        "group": g_id,
                        "day": day,
                        "period": period,
                        "issue": f"Faculty {entry.get('faculty_name')} double booked with Group {faculties[f_id].get('group_id')}",
                        "action": "Reschedule Faculty"
                    })
                else:
                    faculties[f_id] = entry

                if r_id in rooms:
                    conflicts.append({
                        "id": len(conflicts) + 1,
                        "type": "Room",
                        "subject": entry.get("subject_name"),
                        "faculty": entry.get("faculty_name"),
                        "room": entry.get("room_name"),
                        "group": g_id,
                        "day": day,
                        "period": period,
                        "issue": f"Room {entry.get('room_name')} double booked with Group {rooms[r_id].get('group_id')}",
                        "action": "Move to Free Room"
                    })
                else:
                    rooms[r_id] = entry

                if g_id in groups:
                    conflicts.append({
                        "id": len(conflicts) + 1,
                        "type": "Group",
                        "subject": entry.get("subject_name"),
                        "faculty": entry.get("faculty_name"),
                        "room": entry.get("room_name"),
                        "group": g_id,
                        "day": day,
                        "period": period,
                        "issue": f"Group {g_id} double booked",
                        "action": "Adjust Slot"
                    })
                else:
                    groups[g_id] = entry

        return conflicts
