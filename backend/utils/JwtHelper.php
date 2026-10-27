<?php
/**
 * JWT Authentication & RBAC Helper (HS256)
 */

class JwtHelper {
    private const SECRET_KEY = 'AI_TIMETABLE_SECRET_KEY_SUPER_SECURE_2026_32BYTES';

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public static function generateToken(array $userData): string {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $payload = [
            'user_id'  => $userData['user_id'],
            'name'     => $userData['name'],
            'role'     => $userData['role'],
            'section'  => $userData['section'] ?? '',
            'group_id' => $userData['group_id'] ?? '',
            'exp'      => time() + (24 * 3600)
        ];

        $base64Header = self::base64UrlEncode(json_encode($header));
        $base64Payload = self::base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, self::SECRET_KEY, true);
        $base64Signature = self::base64UrlEncode($signature);

        return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
    }

    public static function decodeToken(string $token): array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception('Malformed token.');
        }

        [$header64, $payload64, $sig64] = $parts;
        $expectedSig = self::base64UrlEncode(
            hash_hmac('sha256', $header64 . '.' . $payload64, self::SECRET_KEY, true)
        );

        if (!hash_equals($expectedSig, $sig64)) {
            throw new Exception('Invalid token signature.');
        }

        $payload = json_decode(self::base64UrlDecode($payload64), true);
        if (!is_array($payload)) {
            throw new Exception('Invalid token payload.');
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token has expired.');
        }

        return $payload;
    }

    public static function getAuthorizationHeader(): ?string {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return trim($_SERVER['HTTP_AUTHORIZATION']);
        }
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        }
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $key => $val) {
                if (strtolower($key) === 'authorization') {
                    return trim($val);
                }
            }
        }
        return null;
    }

    public static function requireAuth(): array {
        $authHeader = self::getAuthorizationHeader();
        if (!$authHeader) {
            http_response_code(401);
            echo json_encode(['error' => 'Authorization token is missing.']);
            exit;
        }

        $token = str_contains($authHeader, ' ') ? explode(' ', $authHeader, 2)[1] : $authHeader;

        try {
            return self::decodeToken(trim($token));
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token: ' . $e->getMessage()]);
            exit;
        }
    }

    public static function requireAdmin(): array {
        $user = self::requireAuth();
        if (($user['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Admin access required. Unauthorized.']);
            exit;
        }
        return $user;
    }
}
