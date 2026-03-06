import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Script de seed para poblar la base de datos con datos iniciales
 * - 3 usuarios de prueba con passwords hasheados
 */
async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Limpiar datos existentes
  await prisma.user.deleteMany();

  console.log("✅ Datos anteriores eliminados");

  // ========================================
  // USUARIOS DE PRUEBA
  // ========================================
  const demoPassword = await bcrypt.hash("Demo123!", 10);
  const testPassword = await bcrypt.hash("Test123!", 10);

  const user1 = await prisma.user.create({
    data: {
      email: "demo@example.com",
      username: "demo",
      userType: "PARTICULAR",
      passwordHash: demoPassword,
      name: "Usuario Demo",
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "test@example.com",
      userType: "EMPRESA",
      username: "test",
      passwordHash: testPassword,
      name: "Usuario Test",
      isActive: true,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      username: "admin",
      passwordHash: demoPassword, // Usamos la misma de demo
      name: "Administrador",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Usuarios creados:", user1.email, user2.email, adminUser.email);

  console.log("🎉 Seed completado exitosamente!");
  console.log("");
  console.log("📊 Resumen:");
  console.log("   - 3 usuarios de prueba");
  console.log("");
  console.log("🔐 Credenciales de prueba:");
  console.log("   Email: demo@example.com | Password: Demo123!");
  console.log("   Email: test@example.com | Password: Test123!");
  console.log("   Email: admin@example.com | Password: Demo123!");
}

// Ejecutar el seed y manejar errores
main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
