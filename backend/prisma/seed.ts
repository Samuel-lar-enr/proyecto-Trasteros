import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Script de seed para poblar la base de datos con datos iniciales
 * - 3 usuarios de prueba con passwords hasheados
 */
async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // NO limpiar datos existentes para evitar restricciones de clave foránea
  // await prisma.user.deleteMany();

  console.log("✅ Verificando usuarios existentes...");

  // ========================================
  // USUARIOS DE PRUEBA
  // ========================================
  const demoPassword = await bcrypt.hash("Demo123!", 10);
  const testPassword = await bcrypt.hash("Test123!", 10);

  // Crear usuario demo si no existe
  const existingDemo = await prisma.user.findUnique({
    where: { email: "demo@example.com" }
  });

  let user1;
  if (!existingDemo) {
    user1 = await prisma.user.create({
      data: {
        email: "demo@example.com",
        userType: "PARTICULAR",
        passwordHash: demoPassword,
        name: "Usuario Demo",
        isActive: true,
      },
    });
    console.log("✅ Usuario demo creado");
  } else {
    user1 = existingDemo;
    console.log("✅ Usuario demo ya existe");
  }

  // Crear usuario test si no existe
  const existingTest = await prisma.user.findUnique({
    where: { email: "test@example.com" }
  });

  let user2;
  if (!existingTest) {
    user2 = await prisma.user.create({
      data: {
        email: "test@example.com",
        userType: "EMPRESA",
        passwordHash: testPassword,
        name: "Usuario Test",
        isActive: true,
      },
    });
    console.log("✅ Usuario test creado");
  } else {
    user2 = existingTest;
    console.log("✅ Usuario test ya existe");
  }

  // Crear usuario admin si no existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@example.com" }
  });

  let adminUser;
  if (!existingAdmin) {
    adminUser = await prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash: demoPassword, // Usamos la misma de demo
        name: "Administrador",
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log("✅ Usuario admin creado");
  } else {
    adminUser = existingAdmin;
    console.log("✅ Usuario admin ya existe");
  }

  console.log("✅ Usuarios verificados/creados:", user1.email, user2.email, adminUser.email);

  console.log("🎉 Seed completado exitosamente!");
  console.log("");
  console.log("📊 Resumen:");
  console.log("   - 3 usuarios de prueba");
  console.log("");
  console.log("🔐 Credenciales de prueba:");
  console.log("   Email: demo@example.com | Password: Demo123!");
  console.log("   Email: test@example.com | Password: Test123!");
  console.log("   Email: admin@example.com | Password: Demo123!");

  console.log("🎉 Seed completado exitosamente!");
  console.log("");
  console.log("📊 Resumen:");
  console.log("   - 3 usuarios de prueba");
  console.log("   - 3 tipos de storage");
  console.log("   - 10 trasteros de ejemplo");
  console.log("");
  console.log("🔐 Credenciales de prueba:");
  console.log("   Email: demo@example.com | Password: Demo123!");
  console.log("   Email: test@example.com | Password: Test123!");
  console.log("   Email: admin@example.com | Password: Demo123!");
  console.log("");
  console.log("🏢 Trasteros disponibles:");
  console.log("   - 4 trasteros pequeños (2.3-3.0 m²)");
  console.log("   - 3 trasteros medianos (5.0-5.5 m²)");
  console.log("   - 3 trasteros grandes (8.0-8.5 m²)");
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
