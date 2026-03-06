import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "../utils/jwt.utils.js";
import { googleLoginSchema, loginSchema, manualRegisterSchema, registerSchema, updateProfileSchema } from "../validators/auth.validator.js";
import { sendActivationEmail } from "../utils/email.utils.js";
import crypto from "crypto";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Controlador de autenticación
 * Maneja registro, login, registro con Google y actualización de perfil
 */

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Validar datos de entrada
    const data = registerSchema.parse(req.body);

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      res.status(409).json({
        error: "Conflicto",
        message: "El email ya está registrado",
      });
      return;
    }

    // Hashear la contraseña (10 rounds de bcrypt)
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Generar token de activación
    const activationToken = crypto.randomBytes(32).toString("hex");

    // Crear el usuario (desactivado por defecto)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        // Al registro normal le faltan campos que ahora son obligatorios en el modelo expandido
        // Añadimos valores por defecto o necesarios
        username: data.email, // Por defecto usamos el email como username
        passwordHash,
        name: data.name,
        isActive: false, // Debe activar por email
        activationToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true, // Incluimos para info del front
        createdAt: true,
      },
    });

    // Enviar email de activación (asíncrono, no bloqueamos respuesta)
    sendActivationEmail(user.email, user.name, activationToken).catch(console.error);

    // En el registro con activación, no solemos enviar el token JWT de inmediato
    // pero aquí lo mantenemos si el front lo espera, o simplemente indicamos que debe activar.
    
    // Responder indicando que debe activar la cuenta
    res.status(201).json({
      message: "Registro exitoso. Por favor, revisa tu email para activar tu cuenta.",
      user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/manual-register
 * Registro manual por parte de un administrador
 */
export async function manualRegister(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Validar datos de entrada
    const data = manualRegisterSchema.parse(req.body);

    // 1. Comprobar si el email ya existe
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      res.status(409).json({
        error: "Conflicto",
        message: "El email ya está registrado",
      });
      return;
    }

    // 2. Comprobar si el usuario ya existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUsername) {
      res.status(409).json({
        error: "Conflicto",
        message: "El nombre de usuario ya existe",
      });
      return;
    }

    // 3. Comprobar si el DNI/NIF ya existe (solo para PARTICULARES)
    if (data.userType === "PARTICULAR" && data.dniNif) {
      const existingDni = await prisma.user.findUnique({
        where: { dniNif: data.dniNif },
      });
      if (existingDni) {
        res.status(409).json({
          error: "Conflicto",
          message: "El DNI/NIF ya está registrado para otro usuario",
        });
        return;
      }
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Crear el usuario con toda la información
    const user = await prisma.user.create({
      data: {
        userType: data.userType as any, // Cast para evitar conflictos con el enum de Prisma si hay desfase
        email: data.email,
        username: data.username,
        passwordHash,
        passwordReminder: data.passwordReminder,
        name: data.name,
        surname: data.surname || null,
        dniNif: data.dniNif || null,
        commercialName: data.commercialName || null,
        nifCif: data.nifCif || null,
        address: data.address,
        population: data.population,
        province: data.province,
        phone: data.phone,
        paymentMethod: data.paymentMethod,
        bank: data.bank,
        bicSwift: data.bicSwift,
        iban: data.iban,
        observations: data.observations || null,
      },
    });

    res.status(201).json({
      message: "Nuevo usuario registrado manualmente con éxito",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        userType: user.userType,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Inicia sesión con email y contraseña
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Validar datos de entrada
    const data = loginSchema.parse(req.body);

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      res.status(401).json({
        error: "No autorizado",
        message: "Credenciales inválidas",
      });
      return;
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      res.status(403).json({
        error: "Cuenta no activada",
        message: "Por favor, activa tu cuenta utilizando el enlace enviado a tu email",
      });
      return;
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      res.status(401).json({
        error: "No autorizado",
        message: "Credenciales inválidas",
      });
      return;
    }

    // Generar JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Responder con el usuario (sin password) y el token
    res.status(200).json({
      message: "Login exitoso",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Obtiene la información del usuario autenticado
 * Requiere token JWT válido
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // El middleware requireAuth ya verificó el token y adjuntó req.user
    if (!req.user) {
      res.status(401).json({
        error: "No autorizado",
        message: "Token requerido",
      });
      return;
    }

    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        surname: true,
        dniNif: true,
        commercialName: true,
        nifCif: true,
        userType: true,
        role: true,
        address: true,
        population: true,
        province: true,
        phone: true,
        paymentMethod: true,
        bank: true,
        bicSwift: true,
        iban: true,
        observations: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: "No encontrado",
        message: "Usuario no encontrado",
      });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/google
 * Login/Registro automático con Google
 */
export async function googleLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { idToken } = googleLoginSchema.parse(req.body);

    // Verificar token en Google
    // Nota: En desarrollo, si no tienes CLIENT_ID, esto fallará. 
    // Para facilitar pruebas podríamos simular si el token es "dummy-token"
    let payload;
    
    if (idToken === "dummy-token-google" && process.env.NODE_ENV !== "production") {
      payload = {
        sub: "google-123",
        email: "google-user@example.com",
        name: "Google User Test",
        picture: "https://via.placeholder.com/150",
      };
    } else {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    if (!payload || !payload.email) {
      res.status(400).json({
        error: "Bad Request",
        message: "Token de Google inválido",
      });
      return;
    }

    // Buscar o crear usuario
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: payload.sub },
          { email: payload.email }
        ]
      }
    });

    if (!user) {
      // Registro automático
      user = await prisma.user.create({
        data: {
          email: payload.email,
          username: payload.email.split('@')[0] + "_" + Math.floor(Math.random() * 1000),
          googleId: payload.sub,
          name: payload.name || "Usuario Google",
          role: "USER",
          isActive: true, // Google ya verificó el email
        }
      });
    } else if (!user.googleId) {
      // Vincular cuenta existente si no tiene googleId
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          googleId: payload.sub,
        }
      });
    }

    // Generar Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: "Autenticación con Google exitosa",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/auth/profile
 * Actualiza el perfil del usuario (completar datos post-google)
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const data = updateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data,
    });

    res.status(200).json({
      message: "Perfil actualizado correctamente",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/activate/:token
 * Activa la cuenta de un usuario mediante el token enviado por email
 */
export async function activateAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        error: "Bad Request",
        message: "Token de activación requerido",
      });
      return;
    }

    // Buscar usuario con ese token
    const user = await prisma.user.findUnique({
      where: { activationToken: token },
    });

    if (!user) {
      res.status(400).json({
        error: "Token inválido",
        message: "El enlace de activación es inválido o ya ha sido utilizado",
      });
      return;
    }

    // Activar cuenta y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        activationToken: null,
      },
    });

    res.status(200).json({
      message: "Cuenta activada exitosamente. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    next(error);
  }
}
