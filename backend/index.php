<?php
/**
 * AI Timetable Generator - PHP Backend API Entry Point (XAMPP + MySQL `ai_timetable_db`)
 */

// CORS Headers for React Frontend (Vite port 5173 & Apache port 80)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/JwtHelper.php';
require_once __DIR__ . '/utils/SimpleXlsxHelper.php';
require_once __DIR__ . '/services/DatabaseService.php';
require_once __DIR__ . '/services/TimetableGenerator.php';

// Parse request path relative to /api
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method     = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Normalize route path whether accessed via /api/... or /ai_timetable_generator/api/...
$route = $requestUri;
if (($apiPos = strpos($route, '/api/')) !== false) {
    $route = substr($route, $apiPos + 4); // keep leading slash e.g. /login
} elseif (str_ends_with($route, '/api')) {
    $route = '/';
}
$route = '/' . trim($route, '/');

// Helper to send JSON response
function sendJson($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Helper to read JSON body
function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

try {
    // Ensure database & seed data exist
    DatabaseService::ensureSeeded();
    $pdo = Database::getConnection();

    // ========================================================================
    // 1. Health / Root Status
    // ========================================================================
    if ($route === '/' || $route === '/health') {
        sendJson([
            'status'   => 'AI Timetable Generator PHP + XAMPP MySQL API is running',
            'database' => Database::getDatabaseName(),
            'engine'   => 'PHP ' . PHP_VERSION . ' + MySQL (PDO)',
            'version'  => '2.0.0'
        ]);
    }

    // ========================================================================
    // 2. Authentication Endpoints (/api/login, /api/logout, /api/me)
    // ========================================================================
    if ($route === '/login' && $method === 'POST') {
        $body     = getJsonBody();
        $username = trim((string)($body['username'] ?? ''));
        $password = trim((string)($body['password'] ?? ''));
        $role     = strtolower(trim((string)($body['role'] ?? 'admin')));

        if ($role === 'admin') {
            $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `username` = ? AND `role` = 'admin' LIMIT 1");
            $stmt->execute([$username]);
            $userRow = $stmt->fetch();

            if ($userRow && password_verify($password, $userRow['password_hash'])) {
                $userData = [
                    'user_id' => $userRow['user_id'],
                    'name'    => $userRow['name'],
                    'role'    => 'admin'
                ];
                $token = JwtHelper::generateToken($userData);
                sendJson([
                    'message' => 'Admin login successful',
                    'token'   => $token,
                    'user'    => $userData
                ]);
            } else {
                sendJson(['error' => 'Invalid Admin credentials. Demo: admin / admin123'], 401);
            }
        } elseif ($role === 'student') {
            $studentKey = strtoupper($username);
            $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `user_id` = ? AND `role` = 'student' LIMIT 1");
            $stmt->execute([$studentKey]);
            $userRow = $stmt->fetch();

            if (!$userRow) {
                // Check students table directly if added there
                $stuStmt = $pdo->prepare("SELECT * FROM `students` WHERE UPPER(`student_id`) = ? LIMIT 1");
                $stuStmt->execute([$studentKey]);
                $stuRow = $stuStmt->fetch();
                if ($stuRow && $password === 'student123') {
                    $userData = [
                        'user_id'  => $stuRow['student_id'],
                        'name'     => $stuRow['student_name'],
                        'role'     => 'student',
                        'section'  => $stuRow['section'],
                        'group_id' => $stuRow['group_id']
                    ];
                    $token = JwtHelper::generateToken($userData);
                    sendJson([
                        'message' => 'Student login successful',
                        'token'   => $token,
                        'user'    => $userData
                    ]);
                }
                sendJson(['error' => "Student ID '$username' not found. Try demo ID: STU001"], 401);
            }

            if (password_verify($password, $userRow['password_hash'])) {
                $userData = [
                    'user_id'  => $userRow['user_id'],
                    'name'     => $userRow['name'],
                    'role'     => 'student',
                    'section'  => $userRow['section'],
                    'group_id' => $userRow['group_id']
                ];
                $token = JwtHelper::generateToken($userData);
                sendJson([
                    'message' => 'Student login successful',
                    'token'   => $token,
                    'user'    => $userData
                ]);
            } else {
                sendJson(['error' => 'Invalid Student password. Demo: student123'], 401);
            }
        } else {
            sendJson(['error' => 'Invalid role requested.'], 400);
        }
    }

    if ($route === '/logout' && $method === 'POST') {
        sendJson(['message' => 'Successfully logged out.']);
    }

    if ($route === '/me' && $method === 'GET') {
        $currentUser = JwtHelper::requireAuth();
        sendJson(['user' => $currentUser]);
    }

    // ========================================================================
    // 3. Excel & Database Sync Endpoints
    // ========================================================================
    if ($route === '/upload-excel' && $method === 'POST') {
        JwtHelper::requireAdmin();

        if (!isset($_FILES['file'])) {
            sendJson(['error' => 'No file uploaded.'], 400);
        }

        $file = $_FILES['file'];
        $origName = (string)($file['name'] ?? '');
        if ($origName === '') {
            sendJson(['error' => 'No file selected.'], 400);
        }

        if (!str_ends_with(strtolower($origName), '.xlsx')) {
            sendJson(['error' => 'Only .xlsx files are supported.'], 400);
        }

        $uploadDir = __DIR__ . '/uploads';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $targetPath = $uploadDir . '/uploaded_timetable.xlsx';
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            copy($file['tmp_name'], $targetPath);
        }

        try {
            $meta = SimpleXlsxHelper::readWorkbookWithMeta($targetPath);
            $validation = DatabaseService::validateWorkbookMeta($meta);

            if ($validation['valid']) {
                $sheetsData = [];
                foreach (DatabaseService::REQUIRED_SHEETS as $sheetName) {
                    $sheetsData[$sheetName] = $meta[$sheetName]['rows'] ?? [];
                }
                DatabaseService::saveWorkbookDataToDb($sheetsData, $origName);
            }

            sendJson([
                'message'    => 'File uploaded and synced with XAMPP MySQL database successfully',
                'file_name'  => $origName,
                'validation' => $validation
            ]);
        } catch (Exception $ex) {
            sendJson([
                'message'    => 'Validation failed',
                'file_name'  => $origName,
                'validation' => [
                    'valid'    => false,
                    'errors'   => ['Failed to read Excel file: ' . $ex->getMessage()],
                    'warnings' => []
                ]
            ]);
        }
    }

    if ($route === '/excel-template' && $method === 'GET') {
        $binary = DatabaseService::generateTemplateBinary();
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="AI_Timetable_Template.xlsx"');
        header('Content-Length: ' . strlen($binary));
        echo $binary;
        exit;
    }

    if ($route === '/excel-preview' && $method === 'GET') {
        $data = DatabaseService::loadAllDataFromDb();
        sendJson([
            'data'      => $data,
            'file_path' => 'XAMPP MySQL Database (ai_timetable_db)'
        ]);
    }

    if ($route === '/validate-excel' && $method === 'POST') {
        JwtHelper::requireAdmin();
        $data = DatabaseService::loadAllDataFromDb();
        $res  = DatabaseService::validateDataRelationships($data);
        sendJson($res);
    }

    // ========================================================================
    // 4. Entity Endpoints (Read from XAMPP MySQL `ai_timetable_db`)
    // ========================================================================
    if ($route === '/students' && $method === 'GET') {
        JwtHelper::requireAdmin();
        $data = DatabaseService::loadAllDataFromDb();
        sendJson($data['Students']);
    }

    if ($route === '/subjects' && $method === 'GET') {
        JwtHelper::requireAuth();
        $data = DatabaseService::loadAllDataFromDb();
        sendJson($data['Subjects']);
    }

    if ($route === '/faculty' && $method === 'GET') {
        JwtHelper::requireAuth();
        $data = DatabaseService::loadAllDataFromDb();
        sendJson($data['Faculty']);
    }

    if ($route === '/rooms' && $method === 'GET') {
        JwtHelper::requireAuth();
        $data = DatabaseService::loadAllDataFromDb();
        sendJson($data['Rooms']);
    }

    if ($route === '/groups' && $method === 'GET') {
        JwtHelper::requireAuth();
        $data = DatabaseService::loadAllDataFromDb();
        sendJson($data['TeacherGroups']);
    }

    if ($route === '/timeslots' && $method === 'GET') {
        JwtHelper::requireAuth();
        $data = DatabaseService::loadAllDataFromDb();
        sendJson($data['TimeSlots']);
    }

    // ========================================================================
    // 5. AI Timetable Generation & Query Endpoints
    // ========================================================================
    if (($route === '/generate-timetable' || $route === '/regenerate-timetable') && $method === 'POST') {
        JwtHelper::requireAdmin();
        $data = DatabaseService::loadAllDataFromDb();
        $generator = new TimetableGenerator($data);
        $result = $generator->generate();
        DatabaseService::saveGenerationResult($result, 'ai_timetable_db (MySQL)');
        sendJson($result);
    }

    if ($route === '/timetable' && $method === 'GET') {
        JwtHelper::requireAuth();
        $timetable = DatabaseService::getLatestTimetable();

        $sectionFilter = $_GET['section'] ?? null;
        $groupFilter   = $_GET['group'] ?? null;
        $subjectFilter = $_GET['subject'] ?? null;
        $facultyFilter = $_GET['faculty'] ?? null;
        $roomFilter    = $_GET['room'] ?? null;
        $dayFilter     = $_GET['day'] ?? null;
        $periodFilter  = $_GET['period'] ?? null;

        $filtered = array_filter($timetable, function (array $x) use (
            $sectionFilter, $groupFilter, $subjectFilter, $facultyFilter, $roomFilter, $dayFilter, $periodFilter
        ): bool {
            if ($sectionFilter && ($x['section'] ?? '') !== $sectionFilter) return false;
            if ($groupFilter && ($x['group_id'] ?? '') !== $groupFilter) return false;
            if ($subjectFilter && ($x['subject_id'] ?? '') !== $subjectFilter && ($x['subject_code'] ?? '') !== $subjectFilter) return false;
            if ($facultyFilter && ($x['faculty_id'] ?? '') !== $facultyFilter) return false;
            if ($roomFilter && ($x['room_id'] ?? '') !== $roomFilter) return false;
            if ($dayFilter && ($x['day'] ?? '') !== $dayFilter) return false;
            if ($periodFilter !== null && $periodFilter !== '' && (string)($x['period'] ?? '') !== (string)$periodFilter) return false;
            return true;
        });

        sendJson(DatabaseService::sortTimetableChronologically(array_values($filtered)));
    }

    if ($route === '/timetable/student' && $method === 'GET') {
        $user = JwtHelper::requireAuth();

        $requestedStuId = $_GET['student_id'] ?? null;
        if (($user['role'] ?? '') === 'student' && $requestedStuId && strtoupper($requestedStuId) !== strtoupper($user['user_id'])) {
            sendJson(['error' => "Forbidden: You are not authorized to view another student's timetable."], 403);
        }

        $studentId = ($user['role'] ?? '') === 'student'
            ? $user['user_id']
            : ($requestedStuId ?: 'STU001');

        $stmt = $pdo->prepare("SELECT `student_id`, `student_name`, `section`, `group_id` FROM `students` WHERE UPPER(`student_id`) = UPPER(?) LIMIT 1");
        $stmt->execute([$studentId]);
        $studentInfo = $stmt->fetch();

        if (!$studentInfo) {
            $studentInfo = [
                'student_id'   => $studentId,
                'student_name' => $user['name'] ?? 'Student',
                'section'      => $user['section'] ?? 'Section A',
                'group_id'     => $user['group_id'] ?? 'G1'
            ];
        }

        $groupId = (string)($studentInfo['group_id'] ?? 'G1');
        $timetable = DatabaseService::getLatestTimetable();

        $studentEntries = array_values(array_filter($timetable, fn($e) => (string)($e['group_id'] ?? '') === $groupId));
        $sortedEntries  = DatabaseService::sortTimetableChronologically($studentEntries);

        sendJson([
            'student'   => $studentInfo,
            'timetable' => $sortedEntries
        ]);
    }

    if ($route === '/timetable/group' && $method === 'GET') {
        JwtHelper::requireAuth();
        $groupId   = (string)($_GET['group_id'] ?? 'G1');
        $timetable = DatabaseService::getLatestTimetable();
        $entries   = array_values(array_filter($timetable, fn($e) => (string)($e['group_id'] ?? '') === $groupId));
        sendJson(DatabaseService::sortTimetableChronologically($entries));
    }

    if ($route === '/timetable/section' && $method === 'GET') {
        JwtHelper::requireAuth();
        $section   = (string)($_GET['section'] ?? 'Section A');
        $timetable = DatabaseService::getLatestTimetable();
        $entries   = array_values(array_filter($timetable, fn($e) => (string)($e['section'] ?? '') === $section));
        sendJson(DatabaseService::sortTimetableChronologically($entries));
    }

    // ========================================================================
    // 6. Reports & Export Endpoints
    // ========================================================================
    if ($route === '/conflicts' && $method === 'GET') {
        JwtHelper::requireAuth();
        sendJson(DatabaseService::getLatestConflicts());
    }

    if ($route === '/generation-status' && $method === 'GET') {
        JwtHelper::requireAuth();
        sendJson(DatabaseService::getGenerationStatus());
    }

    if ($route === '/export/excel' && $method === 'GET') {
        JwtHelper::requireAuth();
        $exportType = (string)($_GET['type'] ?? 'Complete Timetable');
        $binary     = DatabaseService::exportTimetableExcelBinary($exportType);
        $filename   = 'AI_Timetable_Export_' . date('Ymd_His') . '.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($binary));
        echo $binary;
        exit;
    }

    sendJson(['error' => "Endpoint not found: $method $route"], 404);

} catch (Exception $e) {
    sendJson(['error' => 'Server Error: ' . $e->getMessage()], 500);
}
