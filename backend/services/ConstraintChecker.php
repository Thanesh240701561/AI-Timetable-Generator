<?php
/**
 * Constraint Checker Service (14 Hard Rules)
 * Validates faculty availability, room type, room capacity, and double-booking constraints.
 */

class ConstraintChecker {
    private array $students;
    private array $subjects;
    private array $faculty;
    private array $groups;
    private array $rooms;
    private array $slots;
    private array $availability;

    private array $subjectMap = [];
    private array $facultyMap = [];
    private array $groupMap = [];
    private array $roomMap = [];
    private array $groupToSections = [];
    private array $availabilityMap = [];

    public function __construct(array $data) {
        $this->students     = $data['Students'] ?? [];
        $this->subjects     = $data['Subjects'] ?? [];
        $this->faculty      = $data['Faculty'] ?? [];
        $this->groups       = $data['TeacherGroups'] ?? [];
        $this->rooms        = $data['Rooms'] ?? [];
        $this->slots        = $data['TimeSlots'] ?? [];
        $this->availability = $data['Availability'] ?? [];

        foreach ($this->subjects as $sub) {
            $this->subjectMap[(string)$sub['subject_id']] = $sub;
        }

        foreach ($this->faculty as $fac) {
            $this->facultyMap[(string)$fac['faculty_id']] = $fac;
        }

        foreach ($this->groups as $grp) {
            $gId = (string)$grp['group_id'];
            $maxCap = (int)($grp['max_capacity'] ?? 60);
            if (!isset($this->groupMap[$gId])) {
                $this->groupMap[$gId] = ['max_capacity' => $maxCap];
            } else {
                $this->groupMap[$gId]['max_capacity'] = max($this->groupMap[$gId]['max_capacity'], $maxCap);
            }
        }

        foreach ($this->rooms as $rm) {
            $this->roomMap[(string)$rm['room_id']] = $rm;
        }

        foreach ($this->students as $stu) {
            $grp = (string)($stu['group_id'] ?? '');
            $sec = (string)($stu['section'] ?? '');
            if ($grp !== '' && $sec !== '') {
                $this->groupToSections[$grp][$sec] = true;
            }
        }

        foreach ($this->availability as $av) {
            $key = sprintf('%s|%s|%d', (string)$av['faculty_id'], (string)$av['day'], (int)$av['period']);
            $this->availabilityMap[$key] = (int)($av['available'] ?? 1);
        }
    }

    /**
     * Returns [bool $isValid, string $reason]
     */
    public function isValidAssignment(array $assignment, array $timetableState): array {
        $facId  = (string)$assignment['faculty_id'];
        $rmId   = (string)$assignment['room_id'];
        $grpId  = (string)$assignment['group_id'];
        $subId  = (string)$assignment['subject_id'];
        $day    = (string)$assignment['day'];
        $period = (int)$assignment['period'];

        // 1. Faculty Availability Constraint
        $availKey = sprintf('%s|%s|%d', $facId, $day, $period);
        if (isset($this->availabilityMap[$availKey]) && $this->availabilityMap[$availKey] === 0) {
            return [false, "Faculty $facId is unavailable on $day Period $period"];
        }

        // 2. Room Type Constraint (Lab vs Lecture)
        $subInfo = $this->subjectMap[$subId] ?? [];
        $rmInfo  = $this->roomMap[$rmId] ?? [];
        $subType = strtolower((string)($subInfo['subject_type'] ?? 'Lecture'));
        $rmType  = strtolower((string)($rmInfo['room_type'] ?? 'Lecture'));

        if ($subType === 'lab' && $rmType !== 'lab') {
            return [false, "Lab subject $subId cannot be placed in non-lab room $rmId"];
        }

        // 3. Room Capacity Constraint
        $grpCap = (int)($this->groupMap[$grpId]['max_capacity'] ?? 0);
        $rmCap  = (int)($rmInfo['capacity'] ?? 999);
        if ($grpCap > $rmCap) {
            return [false, "Group capacity ($grpCap) exceeds room capacity ($rmCap)"];
        }

        // 4, 5, 6. Check against existing assigned timetable entries for double bookings
        foreach ($timetableState as $entry) {
            if (($entry['status'] ?? '') !== 'Class') {
                continue;
            }

            if ((string)$entry['day'] === $day && (int)$entry['period'] === $period) {
                if ((string)$entry['faculty_id'] === $facId) {
                    return [false, "Faculty $facId is already teaching group {$entry['group_id']} at $day Period $period"];
                }
                if ((string)$entry['room_id'] === $rmId) {
                    return [false, "Room $rmId is already occupied by group {$entry['group_id']} at $day Period $period"];
                }
                if ((string)$entry['group_id'] === $grpId) {
                    return [false, "Group $grpId already has a class at $day Period $period"];
                }
            }
        }

        return [true, 'Valid'];
    }

    /**
     * Scans complete timetable state and reports any constraint violations.
     */
    public function findAllConflicts(array $timetableState): array {
        $conflicts = [];
        $slotMap = [];

        foreach ($timetableState as $entry) {
            if (($entry['status'] ?? '') !== 'Class') {
                continue;
            }
            $key = sprintf('%s|%d', (string)$entry['day'], (int)$entry['period']);
            $slotMap[$key][] = $entry;
        }

        foreach ($slotMap as $key => $entries) {
            [$day, $periodStr] = explode('|', $key);
            $period = (int)$periodStr;

            $faculties = [];
            $rooms     = [];
            $groups    = [];

            foreach ($entries as $entry) {
                $fId = (string)$entry['faculty_id'];
                $rId = (string)$entry['room_id'];
                $gId = (string)$entry['group_id'];

                if (isset($faculties[$fId])) {
                    $conflicts[] = [
                        'id'      => count($conflicts) + 1,
                        'type'    => 'Faculty',
                        'subject' => $entry['subject_name'] ?? '',
                        'faculty' => $entry['faculty_name'] ?? '',
                        'room'    => $entry['room_name'] ?? '',
                        'group'   => $gId,
                        'day'     => $day,
                        'period'  => $period,
                        'issue'   => "Faculty {$entry['faculty_name']} double booked with Group {$faculties[$fId]['group_id']}",
                        'action'  => 'Reschedule Faculty'
                    ];
                } else {
                    $faculties[$fId] = $entry;
                }

                if (isset($rooms[$rId])) {
                    $conflicts[] = [
                        'id'      => count($conflicts) + 1,
                        'type'    => 'Room',
                        'subject' => $entry['subject_name'] ?? '',
                        'faculty' => $entry['faculty_name'] ?? '',
                        'room'    => $entry['room_name'] ?? '',
                        'group'   => $gId,
                        'day'     => $day,
                        'period'  => $period,
                        'issue'   => "Room {$entry['room_name']} double booked with Group {$rooms[$rId]['group_id']}",
                        'action'  => 'Move to Free Room'
                    ];
                } else {
                    $rooms[$rId] = $entry;
                }

                if (isset($groups[$gId])) {
                    $conflicts[] = [
                        'id'      => count($conflicts) + 1,
                        'type'    => 'Group',
                        'subject' => $entry['subject_name'] ?? '',
                        'faculty' => $entry['faculty_name'] ?? '',
                        'room'    => $entry['room_name'] ?? '',
                        'group'   => $gId,
                        'day'     => $day,
                        'period'  => $period,
                        'issue'   => "Group $gId double booked",
                        'action'  => 'Adjust Slot'
                    ];
                } else {
                    $groups[$gId] = $entry;
                }
            }
        }

        return $conflicts;
    }
}
