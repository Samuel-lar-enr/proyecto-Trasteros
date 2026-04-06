<?php

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTUtility {
    private static string $secret;
    private static int $expiresIn;

    private static function init() {
        self::$secret = $_ENV['JWT_SECRET'] ?? 'default_secret';
        self::$expiresIn = (int)($_ENV['JWT_EXPIRES_IN'] ?? 86400);
    }

    public static function generateToken(array $payload): string {
        self::init();
        $currentTime = time();
        $payload['iat'] = $currentTime;
        $payload['exp'] = $currentTime + self::$expiresIn;
        
        return JWT::encode($payload, self::$secret, 'HS256');
    }

    public static function validateToken(string $token): ?array {
        self::init();
        try {
            $decoded = JWT::decode($token, new Key(self::$secret, 'HS256'));
            return (array)$decoded;
        } catch (\Exception $e) {
            return null;
        }
    }
}
