<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use App\Utils\JWTUtility;
use App\Utils\MailUtility;
use Google\Client as GoogleClient;
use PDO;

class AuthController extends Controller {
    
    public function register(Request $request, Response $response): Response {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        $name = $data['name'] ?? null;
        $acceptCommunications = $data['acceptCommunications'] ?? false;
        $recaptchaToken = $data['recaptchaToken'] ?? null;

        if (!$email || !$password || !$name || !$recaptchaToken) {
            return $this->jsonResponse($response, ['error' => 'Bad Request', 'message' => 'Faltan campos obligatorios, incluido el captcha'], 400);
        }

        // Validate reCAPTCHA
        $recaptchaSecret = $_ENV['RECAPTCHA_SECRET_KEY'] ?? '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
        $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, [
            'secret' => $recaptchaSecret,
            'response' => $recaptchaToken
        ]);
        $recaptchaResponse = json_decode(curl_exec($ch), true);
        curl_close($ch);

        if (!($recaptchaResponse['success'] ?? false)) {
            return $this->jsonResponse($response, [
                'error' => 'Captcha Inválido',
                'message' => 'No se pudo validar el Captcha de Google. Inténtalo de nuevo.'
            ], 400);
        }

        $db = Database::getConnection();

        // Check if user exists
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            return $this->jsonResponse($response, ['error' => 'Conflicto', 'message' => 'El email ya está registrado'], 409);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $activationToken = bin2hex(random_bytes(32));

        $stmt = $db->prepare("INSERT INTO users (email, password_hash, name, is_active, activation_token, accept_communications, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, NOW(), NOW())");
        $stmt->execute([$email, $passwordHash, $name, $activationToken, $acceptCommunications ? 1 : 0]);
        $userId = $db->lastInsertId();

        // Send activation email
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
        $activationLink = "$frontendUrl/activate/$activationToken";
        $subject = "Activa tu cuenta - Trasteros App";
        $body = "Hola $name,<br><br>Gracias por registrarte. Por favor activa tu cuenta haciendo clic en el siguiente enlace:<br><br><a href='$activationLink'>$activationLink</a>";
        
        MailUtility::sendEmail($email, $subject, $body);

        return $this->jsonResponse($response, [
            'message' => 'Registro exitoso. Por favor, revisa tu email para activar tu cuenta.',
            'user' => [
                'id' => (int)$userId,
                'email' => $email,
                'name' => $name,
                'role' => 'USER',
                'isActive' => false
            ]
        ], 201);
    }

    public function login(Request $request, Response $response): Response {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            return $this->jsonResponse($response, ['error' => 'Bad Request', 'message' => 'Email y contraseña requeridos'], 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            return $this->jsonResponse($response, ['error' => 'No autorizado', 'message' => 'El email no está registrado'], 401);
        }

        if (!$user['is_active']) {
            return $this->jsonResponse($response, ['error' => 'Cuenta no activada', 'message' => 'Por favor, activa tu cuenta utilizando el enlace enviado a tu email'], 403);
        }

        if (!$user['password_hash']) {
            return $this->jsonResponse($response, ['error' => 'No autorizado', 'message' => 'Esta cuenta se registró con Google. Inicia sesión con Google.'], 401);
        }

        if (!password_verify($password, $user['password_hash'])) {
            return $this->jsonResponse($response, ['error' => 'No autorizado', 'message' => 'Contraseña incorrecta'], 401);
        }

        $token = JWTUtility::generateToken([
            'userId' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ]);

        return $this->jsonResponse($response, [
            'message' => 'Login exitoso',
            'user' => [
                'id' => (int)$user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role'],
                'createdAt' => $user['created_at']
            ],
            'token' => $token
        ]);
    }

    public function activate(Request $request, Response $response, array $args): Response {
        $token = $args['token'] ?? null;
        if (!$token) {
            return $this->jsonResponse($response, ['error' => 'Bad Request', 'message' => 'Token requerido'], 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id FROM users WHERE activation_token = ?");
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if (!$user) {
            return $this->jsonResponse($response, ['error' => 'Token inválido', 'message' => 'El enlace de activación es inválido o ya ha sido utilizado'], 400);
        }

        $stmt = $db->prepare("UPDATE users SET is_active = 1, activation_token = NULL WHERE id = ?");
        $stmt->execute([$user['id']]);

        return $this->jsonResponse($response, ['message' => 'Cuenta activada exitosamente. Ya puedes iniciar sesión.']);
    }

    public function googleAuth(Request $request, Response $response): Response {
        $data = $request->getParsedBody();
        $idToken = $data['idToken'] ?? null;

        if (!$idToken) {
            return $this->jsonResponse($response, ['error' => 'Bad Request', 'message' => 'Token de Google requerido'], 400);
        }

        $client = new GoogleClient(['client_id' => $_ENV['GOOGLE_CLIENT_ID']]);
        try {
            $payload = $client->verifyIdToken($idToken);
            if (!$payload) {
                throw new \Exception("Invalid token");
            }
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Bad Request', 'message' => 'Token de Google inválido'], 400);
        }

        $googleId = $payload['sub'];
        $email = $payload['email'];
        $name = $payload['name'] ?? 'Usuario Google';

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE google_id = ? OR email = ?");
        $stmt->execute([$googleId, $email]);
        $user = $stmt->fetch();

        if (!$user) {
            $stmt = $db->prepare("INSERT INTO users (email, google_id, name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, 'USER', 1, NOW(), NOW())");
            $stmt->execute([$email, $googleId, $name]);
            $userId = $db->lastInsertId();
            
            $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
        } else if (!$user['google_id']) {
            $stmt = $db->prepare("UPDATE users SET google_id = ?, is_active = 1 WHERE id = ?");
            $stmt->execute([$googleId, $user['id']]);
            $user['google_id'] = $googleId;
            $user['is_active'] = 1;
        }

        $token = JWTUtility::generateToken([
            'userId' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ]);

        return $this->jsonResponse($response, [
            'message' => 'Autenticación con Google exitosa',
            'user' => [
                'id' => (int)$user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role']
            ],
            'token' => $token
        ]);
    }

    public function me(Request $request, Response $response): Response {
        $tokenData = $request->getAttribute('user');
        if (!$tokenData) {
            return $this->jsonResponse($response, ['error' => 'No autorizado', 'message' => 'Token requerido'], 401);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, email, name, surname, dni_nif, commercial_name, nif_cif, user_type, role, address, population, province, phone, payment_method, bank, bic_swift, iban, observations, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$tokenData['userId']]);
        $user = $stmt->fetch();

        if (!$user) {
            return $this->jsonResponse($response, ['error' => 'No encontrado', 'message' => 'Usuario no encontrado'], 404);
        }

        // Convert common name mapping from DB snake_case to camelCase for frontend
        $userMapped = [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'surname' => $user['surname'],
            'dniNif' => $user['dni_nif'],
            'commercialName' => $user['commercial_name'],
            'nifCif' => $user['nif_cif'],
            'userType' => $user['user_type'],
            'role' => $user['role'],
            'address' => $user['address'],
            'population' => $user['population'],
            'province' => $user['province'],
            'phone' => $user['phone'],
            'paymentMethod' => $user['payment_method'],
            'bank' => $user['bank'],
            'bicSwift' => $user['bic_swift'],
            'iban' => $user['iban'],
            'observations' => $user['observations'],
            'createdAt' => $user['created_at'],
            'updatedAt' => $user['updated_at']
        ];

        return $this->jsonResponse($response, ['user' => $userMapped]);
    }

    public function updateProfile(Request $request, Response $response): Response {
        $tokenData = $request->getAttribute('user');
        if (!$tokenData) {
            return $this->jsonResponse($response, ['error' => 'No autorizado'], 401);
        }

        $data = $request->getParsedBody();
        $db = Database::getConnection();

        // Update fields dynamically based on input
        $fields = [];
        $params = [];
        
        $allowedFields = [
            'name', 'surname', 'dniNif', 'commercialName', 'nifCif', 'userType', 
            'address', 'population', 'province', 'phone', 'paymentMethod', 
            'bank', 'bicSwift', 'iban', 'observations'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                // Convert camelCase to snake_case for DB
                $dbField = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $field));
                $fields[] = "$dbField = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return $this->jsonResponse($response, ['message' => 'Sin cambios']);
        }

        $params[] = $tokenData['userId'];
        $sql = "UPDATE users SET " . implode(", ", $fields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return $this->jsonResponse($response, [
            'message' => 'Perfil actualizado correctamente',
            'user' => [
                'id' => (int)$tokenData['userId'],
                'email' => $tokenData['email'],
                'name' => $data['name'] ?? $tokenData['name'] ?? 'Usuario',
                'role' => $tokenData['role']
            ]
        ]);
    }

    public function forgotPassword(Request $request, Response $response): Response {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? null;

        if (!$email) {
            return $this->jsonResponse($response, ['error' => 'Bad Request', 'message' => 'Email requerido'], 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, name, google_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            return $this->jsonResponse($response, ['error' => 'No autorizado', 'message' => 'El email no está registrado'], 401);
        }

        if ($user['google_id']) {
            return $this->jsonResponse($response, ['error' => 'No autorizado', 'message' => 'Esta cuenta se registró con Google. Por favor, inicia sesión con Google.'], 401);
        }

        $resetToken = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

        $stmt = $db->prepare("UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?");
        $stmt->execute([$resetToken, $expires, $user['id']]);

        // Send email
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
        $resetLink = "$frontendUrl/reset-password/$resetToken";
        $subject = "Restablece tu contraseña - Trasteros App";
        $body = "Hola " . $user['name'] . ",<br><br>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:<br><br><a href='$resetLink'>$resetLink</a><br><br>Este enlace caducará en 1 hora.";
        
        MailUtility::sendEmail($email, $subject, $body);

        return $this->jsonResponse($response, ['message' => 'Si el correo está registrado, recibirás un enlace de recuperación pronto.']);
    }

    public function resetPassword(Request $request, Response $response, array $args): Response {
        $token = $args['token'] ?? null;
        $data = $request->getParsedBody();
        $password = $data['password'] ?? null;

        if (!$token || !$password) {
            return $this->jsonResponse($response, ['error' => 'Bad Request', 'message' => 'Token y contraseña requeridos'], 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()");
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if (!$user) {
            return $this->jsonResponse($response, ['error' => 'Inválido', 'message' => 'El token de recuperación es inválido o ha expirado.'], 400);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare("UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?");
        $stmt->execute([$passwordHash, $user['id']]);

        return $this->jsonResponse($response, ['message' => 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.']);
    }

    public function resendActivation(Request $request, Response $response): Response {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? null;

        if (!$email) {
            return $this->jsonResponse($response, ['error' => 'Bad Request', 'message' => 'Email requerido'], 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, name, is_active FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            return $this->jsonResponse($response, ['message' => 'Si el correo está registrado e inactivo, recibirás un nuevo enlace pronto.']);
        }

        if ($user['is_active']) {
            return $this->jsonResponse($response, ['message' => 'Esta cuenta ya está activa.'], 400);
        }

        $activationToken = bin2hex(random_bytes(32));
        $stmt = $db->prepare("UPDATE users SET activation_token = ? WHERE id = ?");
        $stmt->execute([$activationToken, $user['id']]);

        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
        $activationLink = "$frontendUrl/activate/$activationToken";
        $subject = "Activa tu cuenta - Trasteros App";
        $body = "Hola " . $user['name'] . ",<br><br>Has solicitado un nuevo enlace de activación. Haz clic aquí para activar tu cuenta:<br><br><a href='$activationLink'>$activationLink</a>";
        
        MailUtility::sendEmail($email, $subject, $body);

        return $this->jsonResponse($response, ['message' => 'Si el correo está registrado e inactivo, recibirás un nuevo enlace pronto.']);
    }

    public function manualRegister(Request $request, Response $response): Response {
        // Admin check should be in middleware, but I'll add a quick one here
        $tokenData = $request->getAttribute('user');
        if (!$tokenData || $tokenData['role'] !== 'ADMIN') {
            return $this->jsonResponse($response, ['error' => 'Prohibido', 'message' => 'Se requieren permisos de administrador'], 403);
        }

        $data = $request->getParsedBody();
        $db = Database::getConnection();

        // Check email
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            return $this->jsonResponse($response, ['error' => 'Conflicto', 'message' => 'El email ya está registrado'], 409);
        }

        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);

        $stmt = $db->prepare("INSERT INTO users (
            email, password_hash, password_reminder, name, surname, dni_nif, 
            commercial_name, nif_cif, user_type, address, population, province, 
            phone, payment_method, bank, bic_swift, iban, observations, 
            role, is_active, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USER', 1, NOW(), NOW()
        )");

        $stmt->execute([
            $data['email'], $passwordHash, $data['passwordReminder'] ?? null, $data['name'], 
            $data['surname'] ?? null, $data['dniNif'] ?? null, $data['commercialName'] ?? null, 
            $data['nifCif'] ?? null, $data['userType'] ?? 'PARTICULAR', $data['address'] ?? null, 
            $data['population'] ?? null, $data['province'] ?? null, $data['phone'] ?? null, 
            $data['paymentMethod'] ?? null, $data['bank'] ?? null, $data['bicSwift'] ?? null, 
            $data['iban'] ?? null, $data['observations'] ?? null
        ]);

        return $this->jsonResponse($response, [
            'message' => 'Nuevo usuario registrado manualmente con éxito',
            'user' => [
                'id' => (int)$db->lastInsertId(),
                'email' => $data['email'],
                'name' => $data['name'],
                'userType' => $data['userType'] ?? 'PARTICULAR',
                'role' => 'USER'
            ]
        ], 201);
    }
}
