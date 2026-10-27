<?php
/**
 * Database & Excel Service for AI Timetable Generator (XAMPP MySQL: ai_timetable_db)
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/SimpleXlsxHelper.php';
require_once __DIR__ . '/TimetableGenerator.php';

class DatabaseService {
    public const REQUIRED_SHEETS = [
        'Students', 'Subjects', 'Faculty', 'TeacherGroups', 'Rooms', 'TimeSlots', 'Availability'
    ];

    public const SHEET_COLUMNS = [
        'Students'      => ['student_id', 'student_name', 'section', 'group_id'],
        'Subjects'      => ['subject_id', 'subject_code', 'subject_name', 'periods_per_week', 'subject_type'],
        'Faculty'       => ['faculty_id', 'faculty_name', 'subject_id', 'group_id'],
        'TeacherGroups' => ['group_id', 'subject_id', 'faculty_id', 'room_id', 'max_capacity'],
        'Rooms'         => ['room_id', 'room_name', 'room_type', 'capacity'],
        'TimeSlots'     => ['slot_id', 'day', 'period', 'start_time', 'end_time'],
        'Availability'  => ['faculty_id', 'day', 'period', 'available']
    ];

    private const DAY_ORDER = [
        'Monday'    => 1,
        'Tuesday'   => 2,
        'Wednesday' => 3,
        'Thursday'  => 4,
        'Friday'    => 5,
        'Saturday'  => 6,
        'Sunday'    => 7
    ];

    public static function getDefaultSampleData(): array {
        $names = [
            "Rahul Sharma", "Priya Singh", "Aman Verma", "Neha Patel", "Rohan Kumar", "Ananya Roy",
            "Karan Gupta", "Sneha Rao", "Vikram Malhotra", "Pooja Hegde", "Aditya Joshi", "Riya Sen",
            "Siddharth Jain", "Kavya Nair", "Varun Dhawan", "Shraddha Kapoor", "Ayushmann Khurrana", "Kriti Sanon",
            "Kartik Aaryan", "Kiara Advani", "Ranbir Kapoor", "Alia Bhatt", "Ranveer Singh", "Deepika Padukone",
            "Vicky Kaushal", "Katrina Kaif", "Shahid Kapoor", "Mira Rajput", "Rajkummar Rao", "Patralekhaa",
            "Nawazuddin Siddiqui", "Pankaj Tripathi", "Manoj Bajpayee", "Jaideep Ahlawat", "Vijay Varma", "Radhika Apte",
            "Ayush Sharma", "Sanya Malhotra", "Fatima Sana", "Taapsee Pannu", "Yami Gautam", "Bhumi Pednekar",
            "Vidyut Jammwal", "Tiger Shroff", "Disha Patani", "Hrithik Roshan", "John Abraham", "Jacqueline Fernandez",
            "Abhishek Bachchan", "Aishwarya Rai", "Suryakumar Yadav", "Hardik Pandya", "Jasprit Bumrah", "Rohit Sharma",
            "Virat Kohli", "KL Rahul", "Rishabh Pant", "Shreyas Iyer", "Mohammed Shami", "Ravindra Jadeja"
        ];

        $sections = ["Section A", "Section B", "Section C", "Section D", "Section E"];
        $groups   = ["G1", "G2", "G3", "G4", "G5"];

        // Specific demo student overrides to match README credentials
        $demoOverrides = [
            "STU001" => ["section" => "Section A", "group_id" => "G1"],
            "STU002" => ["section" => "Section A", "group_id" => "G1"],
            "STU003" => ["section" => "Section A", "group_id" => "G2"],
            "STU004" => ["section" => "Section B", "group_id" => "G3"],
            "STU005" => ["section" => "Section B", "group_id" => "G3"],
            "STU006" => ["section" => "Section B", "group_id" => "G4"],
            "STU007" => ["section" => "Section C", "group_id" => "G5"],
            "STU008" => ["section" => "Section C", "group_id" => "G5"]
        ];

        $students = [];
        for ($i = 0; $i < 60; $i++) {
            $stuId = sprintf("STU%03d", $i + 1);
            $stuName = $names[$i % count($names)];
            $secIdx = intdiv($i, 12);
            $section = $demoOverrides[$stuId]['section'] ?? $sections[$secIdx];
            $groupId = $demoOverrides[$stuId]['group_id'] ?? $groups[$secIdx];

            $students[] = [
                'student_id'   => $stuId,
                'student_name' => $stuName,
                'section'      => $section,
                'group_id'     => $groupId
            ];
        }

        $subjects = [
            ['subject_id' => 'SUB101', 'subject_code' => 'CS23531', 'subject_name' => 'Data Structures & Algorithms', 'periods_per_week' => 4, 'subject_type' => 'Lecture'],
            ['subject_id' => 'SUB102', 'subject_code' => 'CS23532', 'subject_name' => 'Database Management Systems',  'periods_per_week' => 4, 'subject_type' => 'Lecture'],
            ['subject_id' => 'SUB103', 'subject_code' => 'CS23533', 'subject_name' => 'Operating Systems',            'periods_per_week' => 4, 'subject_type' => 'Lecture'],
            ['subject_id' => 'SUB104', 'subject_code' => 'CS23512', 'subject_name' => 'Artificial Intelligence',      'periods_per_week' => 4, 'subject_type' => 'Lecture'],
            ['subject_id' => 'SUB105', 'subject_code' => 'CS23514', 'subject_name' => 'Computer Networks',            'periods_per_week' => 4, 'subject_type' => 'Lecture'],
            ['subject_id' => 'SUB106', 'subject_code' => 'CS23516', 'subject_name' => 'Discrete Mathematics',         'periods_per_week' => 4, 'subject_type' => 'Lecture']
        ];

        $subjectTeachers = [
            'SUB101' => [['FAC001', 'Dr. Smith (DS Group A)', 'G1'], ['FAC002', 'Dr. Smith (DS Group B)', 'G2'], ['FAC003', 'Dr. Smith (DS Group C)', 'G3'], ['FAC004', 'Dr. Smith (DS Group D)', 'G4'], ['FAC005', 'Dr. Smith (DS Group E)', 'G5']],
            'SUB102' => [['FAC006', 'Dr. Kumar (DBMS Group A)', 'G1'], ['FAC007', 'Dr. Kumar (DBMS Group B)', 'G2'], ['FAC008', 'Dr. Kumar (DBMS Group C)', 'G3'], ['FAC009', 'Dr. Kumar (DBMS Group D)', 'G4'], ['FAC010', 'Dr. Kumar (DBMS Group E)', 'G5']],
            'SUB103' => [['FAC011', 'Dr. Lee (OS Group A)', 'G1'], ['FAC012', 'Dr. Lee (OS Group B)', 'G2'], ['FAC013', 'Dr. Lee (OS Group C)', 'G3'], ['FAC014', 'Dr. Lee (OS Group D)', 'G4'], ['FAC015', 'Dr. Lee (OS Group E)', 'G5']],
            'SUB104' => [['FAC016', 'Dr. Patel (AI Group A)', 'G1'], ['FAC017', 'Dr. Patel (AI Group B)', 'G2'], ['FAC018', 'Dr. Patel (AI Group C)', 'G3'], ['FAC019', 'Dr. Patel (AI Group D)', 'G4'], ['FAC020', 'Dr. Patel (AI Group E)', 'G5']],
            'SUB105' => [['FAC021', 'Dr. Wilson (CN Group A)', 'G1'], ['FAC022', 'Dr. Wilson (CN Group B)', 'G2'], ['FAC023', 'Dr. Wilson (CN Group C)', 'G3'], ['FAC024', 'Dr. Wilson (CN Group D)', 'G4'], ['FAC025', 'Dr. Wilson (CN Group E)', 'G5']],
            'SUB106' => [['FAC026', 'Dr. Davis (DM Group A)', 'G1'], ['FAC027', 'Dr. Davis (DM Group B)', 'G2'], ['FAC028', 'Dr. Davis (DM Group C)', 'G3'], ['FAC029', 'Dr. Davis (DM Group D)', 'G4'], ['FAC030', 'Dr. Davis (DM Group E)', 'G5']]
        ];

        $faculty = [];
        foreach ($subjectTeachers as $subId => $teachers) {
            foreach ($teachers as [$facId, $facName, $grpId]) {
                $faculty[] = [
                    'faculty_id'   => $facId,
                    'faculty_name' => $facName,
                    'subject_id'   => $subId,
                    'group_id'     => $grpId
                ];
            }
        }

        $roomList = ['R101', 'R102', 'R103', 'R104', 'R105', 'R106', 'R107', 'R108', 'R109', 'R110'];
        $subIds   = ['SUB101', 'SUB102', 'SUB103', 'SUB104', 'SUB105', 'SUB106'];
        $teacherGroups = [];

        foreach ($groups as $grpIdx => $grpId) {
            foreach ($subIds as $subIdx => $subId) {
                $facId  = $subjectTeachers[$subId][$grpIdx][0];
                $roomId = $roomList[($grpIdx + $subIdx) % count($roomList)];
                $teacherGroups[] = [
                    'group_id'     => $grpId,
                    'subject_id'   => $subId,
                    'faculty_id'   => $facId,
                    'room_id'      => $roomId,
                    'max_capacity' => 60
                ];
            }
        }

        $rooms = [
            ['room_id' => 'R101', 'room_name' => 'Hall A101', 'room_type' => 'Lecture', 'capacity' => 60],
            ['room_id' => 'R102', 'room_name' => 'Hall A102', 'room_type' => 'Lecture', 'capacity' => 60],
            ['room_id' => 'R103', 'room_name' => 'Hall A201', 'room_type' => 'Lecture', 'capacity' => 60],
            ['room_id' => 'R104', 'room_name' => 'Hall A202', 'room_type' => 'Lecture', 'capacity' => 60],
            ['room_id' => 'R105', 'room_name' => 'Hall B101', 'room_type' => 'Lecture', 'capacity' => 60],
            ['room_id' => 'R106', 'room_name' => 'Hall B102', 'room_type' => 'Lecture', 'capacity' => 60],
            ['room_id' => 'R107', 'room_name' => 'Hall B201', 'room_type' => 'Lecture', 'capacity' => 60],
            ['room_id' => 'R108', 'room_name' => 'Hall B202', 'room_type' => 'Lecture', 'capacity' => 60],
            ['room_id' => 'R109', 'room_name' => 'Hall C101', 'room_type' => 'Lecture', 'capacity' => 60],
            ['room_id' => 'R110', 'room_name' => 'Hall C102', 'room_type' => 'Lecture', 'capacity' => 60]
        ];

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        $periods = [
            [1, '08:00', '08:50'],
            [2, '09:00', '09:50'],
            [3, '10:00', '10:50'],
            [4, '11:00', '11:50'],
            [5, '13:00', '13:50'],
            [6, '14:00', '14:50']
        ];

        $timeSlots = [];
        $slotCounter = 1;
        foreach ($days as $day) {
            foreach ($periods as [$pNum, $sTime, $eTime]) {
                $timeSlots[] = [
                    'slot_id'    => sprintf('TS%03d', $slotCounter++),
                    'day'        => $day,
                    'period'     => $pNum,
                    'start_time' => $sTime,
                    'end_time'   => $eTime
                ];
            }
        }

        $availability = [];
        for ($i = 1; $i <= 30; $i++) {
            $facId = sprintf('FAC%03d', $i);
            foreach ($days as $day) {
                for ($pNum = 1; $pNum <= 6; $pNum++) {
                    $avail = ($facId === 'FAC001' && $day === 'Friday' && $pNum === 6) ? 0 : 1;
                    $availability[] = [
                        'faculty_id' => $facId,
                        'day'        => $day,
                        'period'     => $pNum,
                        'available'  => $avail
                    ];
                }
            }
        }

        return [
            'Students'      => $students,
            'Subjects'      => $subjects,
            'Faculty'       => $faculty,
            'TeacherGroups' => $teacherGroups,
            'Rooms'         => $rooms,
            'TimeSlots'     => $timeSlots,
            'Availability'  => $availability
        ];
    }

    public static function ensureSeeded(): void {
        $pdo = Database::getConnection();
        $count = (int)$pdo->query("SELECT COUNT(*) FROM `subjects`")->fetchColumn();
        if ($count === 0) {
            $sampleData = self::getDefaultSampleData();
            self::saveWorkbookDataToDb($sampleData, 'sample_timetable.xlsx');
            $gen = new TimetableGenerator($sampleData);
            $res = $gen->generate();
            self::saveGenerationResult($res, 'sample_timetable.xlsx');
        }
    }

    public static function saveWorkbookDataToDb(array $sheetsData, string $fileName = 'uploaded_timetable.xlsx'): void {
        $pdo = Database::getConnection();

        $pdo->beginTransaction();
        try {
            $pdo->exec("DELETE FROM `availability`");
            $pdo->exec("DELETE FROM `teacher_groups`");
            $pdo->exec("DELETE FROM `faculty`");
            $pdo->exec("DELETE FROM `time_slots`");
            $pdo->exec("DELETE FROM `rooms`");
            $pdo->exec("DELETE FROM `subjects`");
            $pdo->exec("DELETE FROM `students`");

            // 1. Students
            $stmtStu = $pdo->prepare("INSERT INTO `students` (`student_id`, `student_name`, `section`, `group_id`) VALUES (?, ?, ?, ?)");
            foreach ($sheetsData['Students'] ?? [] as $row) {
                $stmtStu->execute([
                    trim((string)$row['student_id']),
                    trim((string)$row['student_name']),
                    trim((string)$row['section']),
                    trim((string)$row['group_id'])
                ]);
            }

            // 2. Subjects
            $stmtSub = $pdo->prepare("INSERT INTO `subjects` (`subject_id`, `subject_code`, `subject_name`, `periods_per_week`, `subject_type`) VALUES (?, ?, ?, ?, ?)");
            foreach ($sheetsData['Subjects'] ?? [] as $row) {
                $stmtSub->execute([
                    trim((string)$row['subject_id']),
                    trim((string)$row['subject_code']),
                    trim((string)$row['subject_name']),
                    (int)($row['periods_per_week'] ?? 4),
                    trim((string)($row['subject_type'] ?? 'Lecture'))
                ]);
            }

            // 3. Rooms
            $stmtRm = $pdo->prepare("INSERT INTO `rooms` (`room_id`, `room_name`, `room_type`, `capacity`) VALUES (?, ?, ?, ?)");
            foreach ($sheetsData['Rooms'] ?? [] as $row) {
                $stmtRm->execute([
                    trim((string)$row['room_id']),
                    trim((string)$row['room_name']),
                    trim((string)($row['room_type'] ?? 'Lecture')),
                    (int)($row['capacity'] ?? 60)
                ]);
            }

            // 4. Faculty
            $stmtFac = $pdo->prepare("INSERT INTO `faculty` (`faculty_id`, `faculty_name`, `subject_id`, `group_id`) VALUES (?, ?, ?, ?)");
            foreach ($sheetsData['Faculty'] ?? [] as $row) {
                $stmtFac->execute([
                    trim((string)$row['faculty_id']),
                    trim((string)$row['faculty_name']),
                    trim((string)$row['subject_id']),
                    trim((string)$row['group_id'])
                ]);
            }

            // 5. TeacherGroups
            $stmtGrp = $pdo->prepare("INSERT INTO `teacher_groups` (`group_id`, `subject_id`, `faculty_id`, `room_id`, `max_capacity`) VALUES (?, ?, ?, ?, ?)");
            foreach ($sheetsData['TeacherGroups'] ?? [] as $row) {
                $stmtGrp->execute([
                    trim((string)$row['group_id']),
                    trim((string)$row['subject_id']),
                    trim((string)$row['faculty_id']),
                    trim((string)$row['room_id']),
                    (int)($row['max_capacity'] ?? 60)
                ]);
            }

            // 6. TimeSlots
            $stmtTs = $pdo->prepare("INSERT INTO `time_slots` (`slot_id`, `day`, `period`, `start_time`, `end_time`) VALUES (?, ?, ?, ?, ?)");
            foreach ($sheetsData['TimeSlots'] ?? [] as $row) {
                $stmtTs->execute([
                    trim((string)$row['slot_id']),
                    trim((string)$row['day']),
                    (int)$row['period'],
                    trim((string)$row['start_time']),
                    trim((string)$row['end_time'])
                ]);
            }

            // 7. Availability
            $stmtAv = $pdo->prepare("INSERT INTO `availability` (`faculty_id`, `day`, `period`, `available`) VALUES (?, ?, ?, ?)");
            foreach ($sheetsData['Availability'] ?? [] as $row) {
                $stmtAv->execute([
                    trim((string)$row['faculty_id']),
                    trim((string)$row['day']),
                    (int)$row['period'],
                    (int)($row['available'] ?? 1)
                ]);
            }

            // 8. Sync Users (Admin + Students)
            $adminPassHash = password_hash('admin123', PASSWORD_BCRYPT);
            $stuPassHash   = password_hash('student123', PASSWORD_BCRYPT);

            $stmtUser = $pdo->prepare("
                INSERT INTO `users` (`user_id`, `username`, `password_hash`, `name`, `role`, `section`, `group_id`)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `name` = VALUES(`name`),
                    `section` = VALUES(`section`),
                    `group_id` = VALUES(`group_id`)
            ");

            // Ensure Admin exists
            $stmtUser->execute(['admin', 'admin', $adminPassHash, 'System Administrator', 'admin', '', '']);

            // Ensure all Students exist in users table
            foreach ($sheetsData['Students'] ?? [] as $stu) {
                $stuId = strtoupper(trim((string)$stu['student_id']));
                $stmtUser->execute([
                    $stuId,
                    $stuId,
                    $stuPassHash,
                    trim((string)$stu['student_name']),
                    'student',
                    trim((string)$stu['section']),
                    trim((string)$stu['group_id'])
                ]);
            }

            // Also ensure STU008 (Sneha Rao, Section C, G6 from demo credentials) works if queried
            $pdo->commit();
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    public static function loadAllDataFromDb(): array {
        self::ensureSeeded();
        $pdo = Database::getConnection();

        $students = $pdo->query("SELECT `student_id`, `student_name`, `section`, `group_id` FROM `students` ORDER BY `student_id` ASC")->fetchAll();
        $subjects = $pdo->query("SELECT `subject_id`, `subject_code`, `subject_name`, `periods_per_week`, `subject_type` FROM `subjects` ORDER BY `subject_id` ASC")->fetchAll();
        $faculty  = $pdo->query("SELECT `faculty_id`, `faculty_name`, `subject_id`, `group_id` FROM `faculty` ORDER BY `faculty_id` ASC")->fetchAll();
        $groups   = $pdo->query("SELECT `group_id`, `subject_id`, `faculty_id`, `room_id`, `max_capacity` FROM `teacher_groups` ORDER BY `id` ASC")->fetchAll();
        $rooms    = $pdo->query("SELECT `room_id`, `room_name`, `room_type`, `capacity` FROM `rooms` ORDER BY `room_id` ASC")->fetchAll();
        $slots    = $pdo->query("SELECT `slot_id`, `day`, `period`, `start_time`, `end_time` FROM `time_slots` ORDER BY `slot_id` ASC")->fetchAll();
        $avail    = $pdo->query("SELECT `faculty_id`, `day`, `period`, `available` FROM `availability` ORDER BY `id` ASC")->fetchAll();

        // Ensure numeric types match frontend expectations
        foreach ($subjects as &$s) {
            $s['periods_per_week'] = (int)$s['periods_per_week'];
        }
        foreach ($groups as &$g) {
            $g['max_capacity'] = (int)$g['max_capacity'];
        }
        foreach ($rooms as &$r) {
            $r['capacity'] = (int)$r['capacity'];
        }
        foreach ($slots as &$ts) {
            $ts['period'] = (int)$ts['period'];
        }
        foreach ($avail as &$av) {
            $av['period']    = (int)$av['period'];
            $av['available'] = (int)$av['available'];
        }

        return [
            'Students'      => $students,
            'Subjects'      => $subjects,
            'Faculty'       => $faculty,
            'TeacherGroups' => $groups,
            'Rooms'         => $rooms,
            'TimeSlots'     => $slots,
            'Availability'  => $avail
        ];
    }

    /**
     * Validate parsed workbook meta structure (from SimpleXlsxHelper::readWorkbookWithMeta)
     */
    public static function validateWorkbookMeta(array $meta): array {
        $errors   = [];
        $warnings = [];

        $missingSheets = [];
        foreach (self::REQUIRED_SHEETS as $reqSheet) {
            if (!isset($meta[$reqSheet])) {
                $missingSheets[] = $reqSheet;
            }
        }

        if (!empty($missingSheets)) {
            $errors[] = 'Missing required sheets: ' . implode(', ', $missingSheets);
            return ['valid' => false, 'errors' => $errors, 'warnings' => $warnings];
        }

        $data = [];
        foreach (self::REQUIRED_SHEETS as $sheet) {
            $cols = $meta[$sheet]['columns'] ?? [];
            $rows = $meta[$sheet]['rows'] ?? [];
            $data[$sheet] = $rows;

            $reqCols = self::SHEET_COLUMNS[$sheet];
            $missingCols = array_diff($reqCols, $cols);
            if (!empty($missingCols)) {
                $errors[] = "Sheet '$sheet' is missing columns: " . implode(', ', $missingCols);
            } elseif (empty($rows)) {
                $warnings[] = "Sheet '$sheet' is empty.";
            }
        }

        if (!empty($errors)) {
            return ['valid' => false, 'errors' => $errors, 'warnings' => $warnings];
        }

        return self::validateDataRelationships($data, $errors, $warnings);
    }

    public static function validateDataRelationships(array $data, array $errors = [], array $warnings = []): array {
        // Check duplicate student_ids
        $stuIds = [];
        $dupStu = [];
        foreach ($data['Students'] ?? [] as $r) {
            $id = (string)($r['student_id'] ?? '');
            if ($id !== '') {
                if (isset($stuIds[$id])) {
                    $dupStu[] = $id;
                }
                $stuIds[$id] = true;
            }
        }
        if (!empty($dupStu)) {
            $errors[] = 'Duplicate student_ids found: ' . implode(', ', array_unique($dupStu));
        }

        // Check duplicate faculty_ids
        $facIds = [];
        $dupFac = [];
        foreach ($data['Faculty'] ?? [] as $r) {
            $id = (string)($r['faculty_id'] ?? '');
            if ($id !== '') {
                if (isset($facIds[$id])) {
                    $dupFac[] = $id;
                }
                $facIds[$id] = true;
            }
        }
        if (!empty($dupFac)) {
            $errors[] = 'Duplicate faculty_ids found: ' . implode(', ', array_unique($dupFac));
        }

        // Check duplicate room_ids
        $rmIds = [];
        $dupRm = [];
        foreach ($data['Rooms'] ?? [] as $r) {
            $id = (string)($r['room_id'] ?? '');
            if ($id !== '') {
                if (isset($rmIds[$id])) {
                    $dupRm[] = $id;
                }
                $rmIds[$id] = true;
            }
        }
        if (!empty($dupRm)) {
            $errors[] = 'Duplicate room_ids found: ' . implode(', ', array_unique($dupRm));
        }

        $validSubjectIds = [];
        foreach ($data['Subjects'] ?? [] as $r) {
            if (!empty($r['subject_id'])) {
                $validSubjectIds[(string)$r['subject_id']] = true;
            }
        }

        $validGroupIds = [];
        foreach ($data['TeacherGroups'] ?? [] as $r) {
            if (!empty($r['group_id'])) {
                $validGroupIds[(string)$r['group_id']] = true;
            }
        }

        $validRoomIds = [];
        foreach ($data['Rooms'] ?? [] as $r) {
            if (!empty($r['room_id'])) {
                $validRoomIds[(string)$r['room_id']] = true;
            }
        }

        $invalidSub = [];
        foreach ($data['Faculty'] ?? [] as $r) {
            $sId = (string)($r['subject_id'] ?? '');
            if ($sId !== '' && !isset($validSubjectIds[$sId])) {
                $invalidSub[$sId] = true;
            }
        }
        if (!empty($invalidSub)) {
            $errors[] = 'Faculty sheet has invalid subject_ids: ' . implode(', ', array_keys($invalidSub));
        }

        $invalidGrp = [];
        foreach ($data['Students'] ?? [] as $r) {
            $gId = (string)($r['group_id'] ?? '');
            if ($gId !== '' && !isset($validGroupIds[$gId])) {
                $invalidGrp[$gId] = true;
            }
        }
        if (!empty($invalidGrp)) {
            $errors[] = 'Students sheet has invalid group_ids: ' . implode(', ', array_keys($invalidGrp));
        }

        $invalidRm = [];
        foreach ($data['TeacherGroups'] ?? [] as $r) {
            $rId = (string)($r['room_id'] ?? '');
            if ($rId !== '' && !isset($validRoomIds[$rId])) {
                $invalidRm[$rId] = true;
            }
        }
        if (!empty($invalidRm)) {
            $errors[] = 'TeacherGroups sheet has invalid room_ids: ' . implode(', ', array_keys($invalidRm));
        }

        return [
            'valid'    => count($errors) === 0,
            'errors'   => $errors,
            'warnings' => $warnings
        ];
    }

    public static function saveGenerationResult(array $result, string $activeFileName = 'sample_timetable.xlsx'): int {
        $pdo = Database::getConnection();
        $stats = $result['stats'] ?? [];
        $now = date('Y-m-d H:i:s');

        $pdo->beginTransaction();
        try {
            $stmtRun = $pdo->prepare("
                INSERT INTO `generation_runs`
                (`status`, `total_tasks`, `assigned_classes`, `total_entries`, `unassigned_count`, `conflict_count`, `message`, `active_file_name`, `generated_at`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtRun->execute([
                'Generated',
                (int)($stats['total_tasks'] ?? 0),
                (int)($stats['assigned_classes'] ?? 0),
                (int)($stats['total_entries'] ?? 0),
                (int)($stats['unassigned_count'] ?? 0),
                (int)($stats['conflict_count'] ?? 0),
                (string)($result['message'] ?? 'Timetable generated.'),
                $activeFileName,
                $now
            ]);

            $runId = (int)$pdo->lastInsertId();

            // Keep database clean by storing latest run entries
            $pdo->prepare("DELETE FROM `timetable_entries` WHERE `run_id` != ?")->execute([$runId]);
            $pdo->prepare("DELETE FROM `timetable_conflicts` WHERE `run_id` != ?")->execute([$runId]);

            $stmtEntry = $pdo->prepare("
                INSERT INTO `timetable_entries`
                (`run_id`, `timetable_id`, `subject_id`, `subject_code`, `subject_name`, `group_id`, `section`, `faculty_id`, `faculty_name`, `room_id`, `room_name`, `day`, `period`, `start_time`, `end_time`, `status`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($result['timetable'] ?? [] as $entry) {
                $stmtEntry->execute([
                    $runId,
                    (string)$entry['timetable_id'],
                    (string)$entry['subject_id'],
                    (string)$entry['subject_code'],
                    (string)$entry['subject_name'],
                    (string)$entry['group_id'],
                    (string)$entry['section'],
                    (string)$entry['faculty_id'],
                    (string)$entry['faculty_name'],
                    (string)$entry['room_id'],
                    (string)$entry['room_name'],
                    (string)$entry['day'],
                    (int)$entry['period'],
                    (string)$entry['start_time'],
                    (string)$entry['end_time'],
                    (string)$entry['status']
                ]);
            }

            $stmtConf = $pdo->prepare("
                INSERT INTO `timetable_conflicts`
                (`run_id`, `conflict_id`, `type`, `subject`, `faculty`, `room`, `group_id`, `day`, `period`, `issue`, `action`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($result['conflicts'] ?? [] as $c) {
                $stmtConf->execute([
                    $runId,
                    (int)($c['id'] ?? 1),
                    (string)($c['type'] ?? ''),
                    (string)($c['subject'] ?? ''),
                    (string)($c['faculty'] ?? ''),
                    (string)($c['room'] ?? ''),
                    (string)($c['group'] ?? ''),
                    (string)($c['day'] ?? ''),
                    (int)($c['period'] ?? 0),
                    (string)($c['issue'] ?? ''),
                    (string)($c['action'] ?? '')
                ]);
            }

            $pdo->commit();
            return $runId;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    public static function sortTimetableChronologically(array $entries): array {
        usort($entries, function (array $a, array $b): int {
            $dA = self::DAY_ORDER[trim((string)($a['day'] ?? ''))] ?? 99;
            $dB = self::DAY_ORDER[trim((string)($b['day'] ?? ''))] ?? 99;
            if ($dA !== $dB) {
                return $dA <=> $dB;
            }
            $pA = (int)str_replace('P', '', (string)($a['period'] ?? 99));
            $pB = (int)str_replace('P', '', (string)($b['period'] ?? 99));
            if ($pA !== $pB) {
                return $pA <=> $pB;
            }
            return strcmp((string)($a['start_time'] ?? ''), (string)($b['start_time'] ?? ''));
        });
        return $entries;
    }

    public static function getLatestTimetable(): array {
        self::ensureSeeded();
        $pdo = Database::getConnection();

        $latestRunId = $pdo->query("SELECT `id` FROM `generation_runs` ORDER BY `id` DESC LIMIT 1")->fetchColumn();
        if (!$latestRunId) {
            $data = self::loadAllDataFromDb();
            $gen  = new TimetableGenerator($data);
            $res  = $gen->generate();
            self::saveGenerationResult($res, 'sample_timetable.xlsx');
            return self::sortTimetableChronologically($res['timetable']);
        }

        $stmt = $pdo->prepare("
            SELECT `timetable_id`, `subject_id`, `subject_code`, `subject_name`,
                   `group_id`, `section`, `faculty_id`, `faculty_name`,
                   `room_id`, `room_name`, `day`, `period`, `start_time`, `end_time`, `status`
            FROM `timetable_entries`
            WHERE `run_id` = ?
        ");
        $stmt->execute([(int)$latestRunId]);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['period'] = (int)$r['period'];
        }

        return self::sortTimetableChronologically($rows);
    }

    public static function getLatestConflicts(): array {
        self::ensureSeeded();
        $pdo = Database::getConnection();

        $latestRunId = $pdo->query("SELECT `id` FROM `generation_runs` ORDER BY `id` DESC LIMIT 1")->fetchColumn();
        if (!$latestRunId) {
            return [];
        }

        $stmt = $pdo->prepare("
            SELECT `conflict_id` AS `id`, `type`, `subject`, `faculty`, `room`,
                   `group_id` AS `group`, `day`, `period`, `issue`, `action`
            FROM `timetable_conflicts`
            WHERE `run_id` = ?
            ORDER BY `conflict_id` ASC
        ");
        $stmt->execute([(int)$latestRunId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['id']     = (int)$r['id'];
            $r['period'] = (int)$r['period'];
        }
        return $rows;
    }

    public static function getGenerationStatus(): array {
        self::ensureSeeded();
        $pdo = Database::getConnection();

        $run = $pdo->query("SELECT * FROM `generation_runs` ORDER BY `id` DESC LIMIT 1")->fetch();
        if (!$run) {
            return [
                'status'               => 'Not Generated',
                'last_generation_time' => date('Y-m-d H:i:s'),
                'stats'                => [
                    'total_tasks'      => 0,
                    'assigned_classes' => 0,
                    'total_entries'    => 0,
                    'unassigned_count' => 0,
                    'conflict_count'   => 0
                ],
                'message'              => 'Ready to generate.'
            ];
        }

        return [
            'status'               => $run['status'],
            'last_generation_time' => $run['generated_at'],
            'stats'                => [
                'total_tasks'      => (int)$run['total_tasks'],
                'assigned_classes' => (int)$run['assigned_classes'],
                'total_entries'    => (int)$run['total_entries'],
                'unassigned_count' => (int)$run['unassigned_count'],
                'conflict_count'   => (int)$run['conflict_count']
            ],
            'message'              => $run['message'],
            'active_file_name'     => $run['active_file_name']
        ];
    }

    public static function generateTemplateBinary(): string {
        $data = self::getDefaultSampleData();
        $sheets = [];
        foreach (self::REQUIRED_SHEETS as $sheetName) {
            $cols = self::SHEET_COLUMNS[$sheetName];
            $rows = [];
            foreach ($data[$sheetName] ?? [] as $assocRow) {
                $r = [];
                foreach ($cols as $c) {
                    $r[] = $assocRow[$c] ?? '';
                }
                $rows[] = $r;
            }
            $sheets[$sheetName] = [
                'headers' => $cols,
                'rows'    => $rows
            ];
        }
        return SimpleXlsxHelper::buildWorkbookBinary($sheets);
    }

    public static function exportTimetableExcelBinary(string $exportType = 'Complete Timetable'): string {
        $timetable = self::getLatestTimetable();
        $conflicts = self::getLatestConflicts();

        $cols = ['timetable_id', 'day', 'period', 'start_time', 'end_time', 'section', 'group_id', 'subject_code', 'subject_name', 'faculty_name', 'room_name', 'status'];
        $headers = array_map(fn($c) => ucwords(str_replace('_', ' ', $c)), $cols);

        $completeRows = [];
        foreach ($timetable as $item) {
            $row = [];
            foreach ($cols as $c) {
                $row[] = $item[$c] ?? '';
            }
            $completeRows[] = $row;
        }

        // Group-sorted rows
        $groupSorted = $timetable;
        usort($groupSorted, function (array $a, array $b): int {
            $gCmp = strcmp((string)$a['group_id'], (string)$b['group_id']);
            if ($gCmp !== 0) {
                return $gCmp;
            }
            $dA = self::DAY_ORDER[trim((string)$a['day'])] ?? 99;
            $dB = self::DAY_ORDER[trim((string)$b['day'])] ?? 99;
            if ($dA !== $dB) {
                return $dA <=> $dB;
            }
            return ((int)$a['period']) <=> ((int)$b['period']);
        });

        $groupRows = [];
        foreach ($groupSorted as $item) {
            $row = [];
            foreach ($cols as $c) {
                $row[] = $item[$c] ?? '';
            }
            $groupRows[] = $row;
        }

        $sheets = [
            'Complete Timetable' => [
                'headers' => $headers,
                'rows'    => $completeRows
            ],
            'Group Timetables' => [
                'headers' => $headers,
                'rows'    => $groupRows
            ]
        ];

        if (!empty($conflicts)) {
            $cCols = ['id', 'type', 'issue', 'subject', 'faculty', 'room', 'group', 'day', 'period', 'action'];
            $cHeaders = array_map(fn($c) => ucwords(str_replace('_', ' ', $c)), $cCols);
            $cRows = [];
            foreach ($conflicts as $cItem) {
                $r = [];
                foreach ($cCols as $c) {
                    $r[] = $cItem[$c] ?? '';
                }
                $cRows[] = $r;
            }
            $sheets['Conflict Report'] = [
                'headers' => $cHeaders,
                'rows'    => $cRows
            ];
        }

        return SimpleXlsxHelper::buildWorkbookBinary($sheets);
    }
}
