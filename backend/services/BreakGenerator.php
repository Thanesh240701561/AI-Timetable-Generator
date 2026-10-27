<?php
/**
 * Automatic Break Generator Service
 * Populates free periods with 'Break' status for each student/teacher group.
 */

class BreakGenerator {
    private array $slots;
    private array $groups;
    private array $students;

    public function __construct(array $data) {
        $this->slots    = $data['TimeSlots'] ?? [];
        $this->groups   = $data['TeacherGroups'] ?? [];
        $this->students = $data['Students'] ?? [];
    }

    public function generateAutomaticBreaks(array $timetableClasses): array {
        $allSlots = [];
        foreach ($this->slots as $row) {
            $allSlots[] = [
                'slot_id'    => (string)$row['slot_id'],
                'day'        => (string)$row['day'],
                'period'     => (int)$row['period'],
                'start_time' => (string)$row['start_time'],
                'end_time'   => (string)$row['end_time']
            ];
        }

        $allGroupsMap = [];
        foreach ($this->groups as $row) {
            if (!empty($row['group_id'])) {
                $allGroupsMap[(string)$row['group_id']] = true;
            }
        }
        foreach ($this->students as $row) {
            if (!empty($row['group_id'])) {
                $allGroupsMap[(string)$row['group_id']] = true;
            }
        }

        $allGroups = array_keys($allGroupsMap);
        sort($allGroups);

        // Map group_id -> section
        $groupSectionMap = [];
        foreach ($this->students as $stu) {
            $g = (string)($stu['group_id'] ?? '');
            if ($g !== '' && !isset($groupSectionMap[$g])) {
                $groupSectionMap[$g] = (string)($stu['section'] ?? 'Section A');
            }
        }

        // Map existing assigned classes: "group_id|day|period"
        $assignedMap = [];
        foreach ($timetableClasses as $entry) {
            if (($entry['status'] ?? '') === 'Class') {
                $key = sprintf('%s|%s|%d', (string)$entry['group_id'], (string)$entry['day'], (int)$entry['period']);
                $assignedMap[$key] = $entry;
            }
        }

        $fullTimetable = $timetableClasses;
        $breakCounter = 1000;

        foreach ($allSlots as $slot) {
            $day    = $slot['day'];
            $period = $slot['period'];
            $sTime  = $slot['start_time'];
            $eTime  = $slot['end_time'];

            foreach ($allGroups as $gId) {
                $key = sprintf('%s|%s|%d', $gId, $day, $period);
                if (!isset($assignedMap[$key])) {
                    $section = $groupSectionMap[$gId] ?? 'Section A';
                    $fullTimetable[] = [
                        'timetable_id' => 'BRK' . $breakCounter,
                        'subject_id'   => 'BRK',
                        'subject_code' => 'BREAK',
                        'subject_name' => 'Break',
                        'group_id'     => $gId,
                        'section'      => $section,
                        'faculty_id'   => '-',
                        'faculty_name' => 'Free Period',
                        'room_id'      => '-',
                        'room_name'    => '-',
                        'day'          => $day,
                        'period'       => $period,
                        'start_time'   => $sTime,
                        'end_time'     => $eTime,
                        'status'       => 'Break'
                    ];
                    $breakCounter++;
                }
            }
        }

        return $fullTimetable;
    }
}
