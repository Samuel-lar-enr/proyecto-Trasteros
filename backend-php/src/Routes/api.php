<?php

use Slim\Routing\RouteCollectorProxy;
use App\Controllers\AuthController;
use App\Middleware\AuthMiddleware;

$app->group('/api/auth', function (RouteCollectorProxy $group) {
    $group->post('/register', [AuthController::class, 'register']);
    $group->post('/login', [AuthController::class, 'login']);
    $group->get('/activate/{token}', [AuthController::class, 'activate']);
    $group->post('/google', [AuthController::class, 'googleAuth']);
    $group->post('/forgot-password', [AuthController::class, 'forgotPassword']);
    $group->post('/reset-password/{token}', [AuthController::class, 'resetPassword']);
    $group->post('/resend-activation', [AuthController::class, 'resendActivation']);
    
    // Protected routes
    $group->group('', function (RouteCollectorProxy $protectedGroup) {
        $protectedGroup->get('/me', [AuthController::class, 'me']);
        $protectedGroup->put('/profile', [AuthController::class, 'updateProfile']);
        $protectedGroup->post('/manual-register', [AuthController::class, 'manualRegister']);
    })->add(new AuthMiddleware());
});
