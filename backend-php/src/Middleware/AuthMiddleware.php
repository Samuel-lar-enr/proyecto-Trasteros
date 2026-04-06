<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use App\Utils\JWTUtility;
use Slim\Psr7\Response as SlimResponse;

class AuthMiddleware {
    public function __invoke(Request $request, RequestHandler $handler): Response {
        $header = $request->getHeaderLine('Authorization');
        if (empty($header) || !str_starts_with($header, 'Bearer ')) {
            return $this->unauthorized();
        }

        $token = substr($header, 7);
        $decoded = JWTUtility::validateToken($token);

        if (!$decoded) {
            return $this->unauthorized();
        }

        // Attach decoded user data to request
        $request = $request->withAttribute('user', $decoded);

        return $handler->handle($request);
    }

    private function unauthorized(): Response {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'error' => 'No autorizado',
            'message' => 'Token inválido o ausente'
        ]));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}
