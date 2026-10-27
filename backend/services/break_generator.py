class BreakGenerator:
    def __init__(self, data):
        self.slots_df = data.get("TimeSlots")
        self.groups_df = data.get("TeacherGroups")
        self.students_df = data.get("Students")

    def generate_automatic_breaks(self, timetable_classes):
        """
        timetable_classes: list of timetable entries with status 'Class'
        returns: combined list of 'Class' and 'Break' entries for all groups across all time slots.
        """
        all_slots = []
        if not self.slots_df.empty:
            for _, row in self.slots_df.iterrows():
                all_slots.append({
                    "slot_id": str(row.get("slot_id")),
                    "day": str(row.get("day")),
                    "period": int(row.get("period")),
                    "start_time": str(row.get("start_time")),
                    "end_time": str(row.get("end_time"))
                })

        all_groups = set()
        if not self.groups_df.empty and "group_id" in self.groups_df.columns:
            all_groups.update(self.groups_df["group_id"].astype(str).tolist())
        if not self.students_df.empty and "group_id" in self.students_df.columns:
            all_groups.update(self.students_df["group_id"].astype(str).tolist())

        # Map existing assigned classes: (group_id, day, period) -> class_entry
        assigned_map = {}
        for entry in timetable_classes:
            if entry.get("status") == "Class":
                g_id = str(entry["group_id"])
                day = str(entry["day"])
                p_num = int(entry["period"])
                assigned_map[(g_id, day, p_num)] = entry

        full_timetable = list(timetable_classes)
        break_counter = 1000

        for slot in all_slots:
            day = slot["day"]
            period = slot["period"]
            s_time = slot["start_time"]
            e_time = slot["end_time"]

            for g_id in sorted(list(all_groups)):
                key = (g_id, day, period)
                if key not in assigned_map:
                    # Find section for this group if possible
                    section = "Section A"
                    if not self.students_df.empty:
                        stu_match = self.students_df[self.students_df["group_id"].astype(str) == g_id]
                        if not stu_match.empty:
                            section = str(stu_match.iloc[0].get("section", "Section A"))

                    break_entry = {
                        "timetable_id": f"BRK{break_counter}",
                        "subject_id": "BRK",
                        "subject_code": "BREAK",
                        "subject_name": "Break",
                        "group_id": g_id,
                        "section": section,
                        "faculty_id": "-",
                        "faculty_name": "Free Period",
                        "room_id": "-",
                        "room_name": "-",
                        "day": day,
                        "period": period,
                        "start_time": s_time,
                        "end_time": e_time,
                        "status": "Break"
                    }
                    full_timetable.append(break_entry)
                    break_counter += 1

        return full_timetable
