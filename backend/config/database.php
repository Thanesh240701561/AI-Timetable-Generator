<?php
/**
 * XAMPP MySQL Database Configuration for AI Timetable Generator
 * Database: ai_timetable_db
 */

class Database {
    private static ?PDO $instance = null;

    private static string $host = '127.0.0.1';
    private static int $port = 3306;
    private static string $dbName = 'ai_timetable_db';
    private static string $username = 'root';
    private static string $password = '';

    public static function getConnection(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $dsnWithDb = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            self::$host,
            self::$port,
            self::$dbName
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            self::$instance = new PDO($dsnWithDb, self::$username, self::$password, $options);
        } catch (PDOException $e) {
            // If database does not exist yet, connect without dbname and initialize schema
            $dsnNoDb = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', self::$host, self::$port);
            $pdo = new PDO($dsnNoDb, self::$username, self::$password, $options);
            $schemaFile = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'schema.sql';
            if (file_exists($schemaFile)) {
                $sql = file_get_contents($schemaFile);
                $pdo->exec($sql);
            } else {
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . self::$dbName . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            }
            self::$instance = new PDO($dsnWithDb, self::$username, self::$password, $options);
        }

        return self::$instance;
    }

    public static function getDatabaseName(): string {
        return self::$dbName;
    }
}
