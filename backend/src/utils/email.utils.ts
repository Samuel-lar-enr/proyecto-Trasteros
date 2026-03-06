import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Utilidades para el envío de correos electrónicos
 */

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía un correo de activación de cuenta
 * 
 * @param email - Correo del destinatario
 * @param name - Nombre del usuario
 * @param activationToken - Token de activación único
 */
export async function sendActivationEmail(
  email: string,
  name: string,
  activationToken: string
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  // Si la URL ya contiene el path del backend, solo añadimos la barra y el token
  const activationLink = frontendUrl.endsWith('/') ? `${frontendUrl}${activationToken}` : `${frontendUrl}/${activationToken}`;

  const mailOptions = {
    from: `${process.env.SMTP_FROM || 'Trasteros App'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: 'Activa tu cuenta - Trasteros App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #2c3e50; text-align: center;">¡Bienvenido a Trasteros App!</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Gracias por registrarte. Para poder empezar a utilizar tu cuenta, es necesario que la actives haciendo clic en el siguiente botón:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Activar mi cuenta</a>
        </div>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #3498db;">${activationLink}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">Si no has creado esta cuenta, puedes ignorar este correo.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email de activación enviado a: ${email}`);
  } catch (error) {
    console.error('❌ Error enviando email de activación:', error);
    // No lanzamos el error para no bloquear el registro, pero lo logueamos
  }
}
