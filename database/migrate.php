<?php
/**
 * Database Migration & Seed Script for AI Timetable Generator (XAMPP MySQL)
 * Creates the new `ai_timetable_db` database, schema tables, and initial seed records.
 */

require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/services/DatabaseService.php';
require_once __DIR__ . '/../backend/services/TimetableGenerator.php';

echo "============================================================\n";
echo " AI Timetable Generator - XAMPP MySQL Database Setup\n";
echo "============================================================\n";

try {
    // 1. Connect to XAMPP MySQL Server (without selecting DB first)
    $pdoInit = new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $schemaPath = __DIR__ . '/schema.sql';
    if (!file_exists($schemaPath)) {
        throw new Exception("schema.sql not found at $schemaPath");
    }

    echo "[1/3] Creating database `ai_timetable_db` and tables...\n";
    $sql = file_get_contents($schemaPath);
    $pdoInit->exec($sql);
    echo "      -> Database `ai_timetable_db` created successfully.\n";

    // 2. Seed initial entities and users into `ai_timetable_db`
    echo "[2/3] Seeding Students, Subjects, Faculty, Rooms, TeacherGroups, TimeSlots, Availability, and Users...\n";
    $sampleData = DatabaseService::getDefaultSampleData();
    DatabaseService::saveWorkbookDataToDb($sampleData, 'sample_timetable.xlsx');
    echo sprintf(
        "      -> Seeded: %d Students, %d Subjects, %d Faculty, %d Groups, %d Rooms, %d TimeSlots, %d Availability records.\n",
        count($sampleData['Students']),
        count($sampleData['Subjects']),
        count($sampleData['Faculty']),
        count($sampleData['TeacherGroups']),
        count($sampleData['Rooms']),
        count($sampleData['TimeSlots']),
        count($sampleData['Availability'])
    );

    // 3. Run initial AI CSP Timetable Generation & store in MySQL
    echo "[3/3] Running AI CSP Timetable Generator and saving schedule to `ai_timetable_db`...\n";
    $generator = new TimetableGenerator($sampleData);
    $genResult = $generator->generate();
    $runId = DatabaseService::saveGenerationResult($genResult, 'sample_timetable.xlsx');

    echo sprintf(
        "      -> Run #%d saved: %d total entries (%d Classes, %d Breaks), %d conflicts.\n",
        $runId,
        $genResult['stats']['total_entries'],
        $genResult['stats']['assigned_classes'],
        $genResult['stats']['total_entries'] - $genResult['stats']['assigned_classes'],
        $genResult['stats']['conflict_count']
    );

    echo "============================================================\n";
    echo " SUCCESS! XAMPP Database `ai_timetable_db` is ready.\n";
    echo "============================================================\n";
} catch (Exception $e) {
    fwrite(STDERR, "ERROR: " . $e->getMessage() . "\n");
    exit(1);
}
