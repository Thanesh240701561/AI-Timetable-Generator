<?php
/**
 * AI Timetable Generator Service (CSP Solver)
 * Uses MRV & Degree heuristics, randomized slot assignment, backtracking search,
 * and automatic break generation.
 */

require_once __DIR__ . '/ConstraintChecker.php';
require_once __DIR__ . '/BreakGenerator.php';

class TimetableGenerator {
    private array $data;
    private ConstraintChecker $checker;
    private BreakGenerator $breakGen;

    private array $students;
    private array $subjects;
    private array $faculty;
    private array $groups;
    private array $rooms;
    private array $slots;

    private array $subjectMap = [];
    private array $facultyMap = [];
    private array $roomMap = [];
    private array $groupSectionMap = [];
    private array $timeSlots = [];

    public function __construct(array $data) {
        $this->data     = $data;
        $this->checker  = new ConstraintChecker($data);
        $this->breakGen = new BreakGenerator($data);

        $this->students = $data['Students'] ?? [];
        $this->subjects = $data['Subjects'] ?? [];
        $this->faculty  = $data['Faculty'] ?? [];
        $this->groups   = $data['TeacherGroups'] ?? [];
        $this->rooms    = $data['Rooms'] ?? [];
        $this->slots    = $data['TimeSlots'] ?? [];

        foreach ($this->subjects as $sub) {
            $this->subjectMap[(string)$sub['subject_id']] = $sub;
        }
        foreach ($this->faculty as $fac) {
            $this->facultyMap[(string)$fac['faculty_id']] = $fac;
        }
        foreach ($this->rooms as $rm) {
            $this->roomMap[(string)$rm['room_id']] = $rm;
        }
        foreach ($this->students as $stu) {
            $gId = (string)($stu['group_id'] ?? '');
            if ($gId !== '' && !isset($this->groupSectionMap[$gId])) {
                $this->groupSectionMap[$gId] = (string)($stu['section'] ?? 'Section A');
            }
        }
        foreach ($this->slots as $row) {
            $this->timeSlots[] = [
                'slot_id'    => (string)$row['slot_id'],
                'day'        => (string)$row['day'],
                'period'     => (int)$row['period'],
                'start_time' => (string)$row['start_time'],
                'end_time'   => (string)$row['end_time']
            ];
        }
    }

    public function generate(): array {
        if (empty($this->groups)) {
            return [
                'success'          => false,
                'timetable'        => [],
                'conflicts'        => [],
                'unassigned_tasks' => [],
                'stats'            => [
                    'total_tasks'      => 0,
                    'assigned_classes' => 0,
                    'total_entries'    => 0,
                    'unassigned_count' => 0,
                    'conflict_count'   => 0
                ],
                'message'          => 'No Teacher Groups found in database.'
            ];
        }

        // 1. Create Timetable Tasks
        $tasks = [];
        $taskIdCounter = 1;

        foreach ($this->groups as $grpRow) {
            $grpId = (string)$grpRow['group_id'];
            $subId = (string)$grpRow['subject_id'];
            $facId = (string)$grpRow['faculty_id'];
            $rmId  = (string)$grpRow['room_id'];

            $subInfo = $this->subjectMap[$subId] ?? [];
            $facInfo = $this->facultyMap[$facId] ?? [];
            $rmInfo  = $this->roomMap[$rmId] ?? [];

            $subName       = (string)($subInfo['subject_name'] ?? $subId);
            $subCode       = (string)($subInfo['subject_code'] ?? $subId);
            $subType       = (string)($subInfo['subject_type'] ?? 'Lecture');
            $periodsNeeded = (int)($subInfo['periods_per_week'] ?? 3);

            $facName = (string)($facInfo['faculty_name'] ?? $facId);
            $rmName  = (string)($rmInfo['room_name'] ?? $rmId);
            $section = $this->groupSectionMap[$grpId] ?? 'Section A';

            for ($instance = 1; $instance <= $periodsNeeded; $instance++) {
                $tasks[] = [
                    'task_id'        => 'TSK_' . $taskIdCounter,
                    'group_id'       => $grpId,
                    'subject_id'     => $subId,
                    'subject_code'   => $subCode,
                    'subject_name'   => $subName,
                    'subject_type'   => $subType,
                    'faculty_id'     => $facId,
                    'faculty_name'   => $facName,
                    'room_id'        => $rmId,
                    'room_name'      => $rmName,
                    'section'        => $section,
                    'periods_needed' => $periodsNeeded,
                    'instance'       => $instance
                ];
                $taskIdCounter++;
            }
        }

        // 2. Sort Tasks using Heuristics (MRV & Most Constrained First: Labs first -> higher periods_per_week)
        usort($tasks, function (array $a, array $b): int {
            $isLabA = strtolower($a['subject_type']) === 'lab' ? 0 : 1;
            $isLabB = strtolower($b['subject_type']) === 'lab' ? 0 : 1;
            if ($isLabA !== $isLabB) {
                return $isLabA <=> $isLabB;
            }
            return $b['periods_needed'] <=> $a['periods_needed'];
        });

        // 3. Backtracking Depth First Search
        $timetableState  = [];
        $unassignedTasks = [];
        $stepsUsed       = 0;

        $success = $this->backtrack(0, $tasks, $timetableState, $unassignedTasks, $stepsUsed, 5000);

        // 4. Generate Automatic Breaks for Free Periods
        $completeTimetable = $this->breakGen->generateAutomaticBreaks($timetableState);

        // 5. Check Conflicts
        $conflicts = $this->checker->findAllConflicts($timetableState);

        $stats = [
            'total_tasks'      => count($tasks),
            'assigned_classes' => count($timetableState),
            'total_entries'    => count($completeTimetable),
            'unassigned_count' => count($unassignedTasks),
            'conflict_count'   => count($conflicts)
        ];

        $isFullSuccess = $success && count($conflicts) === 0 && count($unassignedTasks) === 0;
        $msg = $isFullSuccess
            ? 'Timetable generated successfully with 0 conflicts!'
            : sprintf('Timetable generated with %d unassigned tasks and %d conflicts.', count($unassignedTasks), count($conflicts));

        return [
            'success'          => $isFullSuccess,
            'timetable'        => $completeTimetable,
            'conflicts'        => $conflicts,
            'unassigned_tasks' => $unassignedTasks,
            'stats'            => $stats,
            'message'          => $msg
        ];
    }

    private function backtrack(
        int $taskIdx,
        array &$tasks,
        array &$timetableState,
        array &$unassignedTasks,
        int &$stepsUsed,
        int $maxSteps = 5000
    ): bool {
        if ($taskIdx >= count($tasks)) {
            return true;
        }

        $stepsUsed++;
        if ($stepsUsed > $maxSteps) {
            for ($i = $taskIdx; $i < count($tasks); $i++) {
                $unassignedTasks[] = $tasks[$i];
            }
            return false;
        }

        $task = $tasks[$taskIdx];

        $slotsToTry = $this->timeSlots;
        shuffle($slotsToTry);

        foreach ($slotsToTry as $slot) {
            $assignment = [
                'timetable_id' => 'TT_' . $task['task_id'],
                'subject_id'   => $task['subject_id'],
                'subject_code' => $task['subject_code'],
                'subject_name' => $task['subject_name'],
                'group_id'     => $task['group_id'],
                'section'      => $task['section'],
                'faculty_id'   => $task['faculty_id'],
                'faculty_name' => $task['faculty_name'],
                'room_id'      => $task['room_id'],
                'room_name'    => $task['room_name'],
                'day'          => $slot['day'],
                'period'       => (int)$slot['period'],
                'start_time'   => $slot['start_time'],
                'end_time'     => $slot['end_time'],
                'status'       => 'Class'
            ];

            [$isValid, $reason] = $this->checker->isValidAssignment($assignment, $timetableState);
            if ($isValid) {
                $timetableState[] = $assignment;
                if ($this->backtrack($taskIdx + 1, $tasks, $timetableState, $unassignedTasks, $stepsUsed, $maxSteps)) {
                    return true;
                }
                array_pop($timetableState);
            }
        }

        $unassignedTasks[] = $task;
        return $this->backtrack($taskIdx + 1, $tasks, $timetableState, $unassignedTasks, $stepsUsed, $maxSteps);
    }
}
