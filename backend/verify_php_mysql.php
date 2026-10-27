<?php
/**
 * End-to-End Verification Suite for PHP + XAMPP MySQL (`ai_timetable_db`) Integration
 */

$baseUrl = 'http://localhost/ai_timetable_generator/api';

function requestApi(string $method, string $endpoint, ?array $body = null, ?string $token = null): array {
    global $baseUrl;
    $url = $baseUrl . $endpoint;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    $headers = ['Accept: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    if ($body !== null) {
        $payload = json_encode($body);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        $headers[] = 'Content-Type: application/json';
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $raw = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $code, 'raw' => $raw, 'json' => json_decode((string)$raw, true)];
}

echo "============================================================\n";
echo " Testing PHP + XAMPP MySQL (`ai_timetable_db`) REST API\n";
echo "============================================================\n";

$passed = 0;
$failed = 0;

function assertCheck(string $label, bool $cond, string $detail = ''): void {
    global $passed, $failed;
    if ($cond) {
        echo "[PASS] $label" . ($detail ? " ($detail)" : "") . "\n";
        $passed++;
    } else {
        echo "[FAIL] $label" . ($detail ? " ($detail)" : "") . "\n";
        $failed++;
    }
}

// 1. Health check
$res = requestApi('GET', '/health');
assertCheck('GET /api/health', $res['code'] === 200 && ($res['json']['database'] ?? '') === 'ai_timetable_db', $res['json']['engine'] ?? '');

// 2. Admin Login
$adminLogin = requestApi('POST', '/login', ['username' => 'admin', 'password' => 'admin123', 'role' => 'admin']);
$adminToken = $adminLogin['json']['token'] ?? '';
assertCheck('POST /api/login (Admin)', $adminLogin['code'] === 200 && !empty($adminToken), 'Token issued');

// 3. Student Login
$stuLogin = requestApi('POST', '/login', ['username' => 'STU001', 'password' => 'student123', 'role' => 'student']);
$stuToken = $stuLogin['json']['token'] ?? '';
assertCheck('POST /api/login (Student STU001)', $stuLogin['code'] === 200 && !empty($stuToken), $stuLogin['json']['user']['name'] ?? '');

// 4. GET /api/me
$meRes = requestApi('GET', '/me', null, $adminToken);
assertCheck('GET /api/me', $meRes['code'] === 200 && ($meRes['json']['user']['role'] ?? '') === 'admin');

// 5. Entity Endpoints from MySQL
foreach (['/students' => 60, '/subjects' => 6, '/faculty' => 30, '/rooms' => 10, '/groups' => 30, '/timeslots' => 30] as $ep => $expectedCount) {
    $r = requestApi('GET', $ep, null, $adminToken);
    $cnt = is_array($r['json']) ? count($r['json']) : 0;
    assertCheck("GET /api$ep", $r['code'] === 200 && $cnt === $expectedCount, "Count: $cnt");
}

// 6. Excel Preview & Validate
$prev = requestApi('GET', '/excel-preview', null, $adminToken);
assertCheck('GET /api/excel-preview', $prev['code'] === 200 && isset($prev['json']['data']['Students']));

$valRes = requestApi('POST', '/validate-excel', [], $adminToken);
assertCheck('POST /api/validate-excel', $valRes['code'] === 200 && ($valRes['json']['valid'] ?? false) === true);

// 7. AI Timetable Generation & Persistence in MySQL
$genRes = requestApi('POST', '/generate-timetable', [], $adminToken);
assertCheck(
    'POST /api/generate-timetable',
    $genRes['code'] === 200 && ($genRes['json']['success'] ?? false) === true,
    sprintf("Entries: %d, Conflicts: %d", $genRes['json']['stats']['total_entries'] ?? 0, $genRes['json']['stats']['conflict_count'] ?? -1)
);

// 8. Complete, Group, Section, and Student Timetable Queries
$ttRes = requestApi('GET', '/timetable', null, $adminToken);
assertCheck('GET /api/timetable', $ttRes['code'] === 200 && count($ttRes['json'] ?? []) === 150);

$grpTt = requestApi('GET', '/timetable/group?group_id=G1', null, $adminToken);
assertCheck('GET /api/timetable/group?group_id=G1', $grpTt['code'] === 200 && count($grpTt['json'] ?? []) === 30);

$secTt = requestApi('GET', '/timetable/section?section=Section%20A', null, $adminToken);
assertCheck('GET /api/timetable/section?section=Section A', $secTt['code'] === 200 && count($secTt['json'] ?? []) > 0);

$stuTt = requestApi('GET', '/timetable/student', null, $stuToken);
assertCheck('GET /api/timetable/student (STU001 own)', $stuTt['code'] === 200 && count($stuTt['json']['timetable'] ?? []) === 30);

// 9. RBAC Privacy Check (STU001 requesting STU004)
$rbacRes = requestApi('GET', '/timetable/student?student_id=STU004', null, $stuToken);
assertCheck('RBAC 403 Forbidden (STU001 -> STU004)', $rbacRes['code'] === 403);

// 10. Status, Conflicts & Excel Export
$statRes = requestApi('GET', '/generation-status', null, $adminToken);
assertCheck('GET /api/generation-status', $statRes['code'] === 200 && ($statRes['json']['status'] ?? '') === 'Generated');

$confRes = requestApi('GET', '/conflicts', null, $adminToken);
assertCheck('GET /api/conflicts', $confRes['code'] === 200 && is_array($confRes['json']));

$expRes = requestApi('GET', '/export/excel', null, $adminToken);
assertCheck('GET /api/export/excel', $expRes['code'] === 200 && str_starts_with($expRes['raw'], 'PK'), 'Valid XLSX binary (' . strlen($expRes['raw']) . ' bytes)');

// 11. Upload Excel Workbook (POST /api/upload-excel) & Sync to XAMPP MySQL
$sampleFile = dirname(__DIR__) . '/sample_timetable.xlsx';
if (file_exists($sampleFile)) {
    $ch = curl_init($baseUrl . '/upload-excel');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $adminToken]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['file' => new CURLFile($sampleFile, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'sample_timetable.xlsx')]);
    $upRaw = curl_exec($ch);
    $upCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $upJson = json_decode((string)$upRaw, true);
    assertCheck('POST /api/upload-excel (Sync to MySQL)', $upCode === 200 && ($upJson['validation']['valid'] ?? false) === true, $upJson['message'] ?? '');
}

echo "============================================================\n";
echo " Summary: $passed PASSED, $failed FAILED\n";
echo "============================================================\n";
exit($failed > 0 ? 1 : 0);
