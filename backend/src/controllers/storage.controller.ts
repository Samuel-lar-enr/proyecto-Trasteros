import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { storageTypeSchema, storageUnitSchema, updateStorageUnitSchema } from "../validators/storage.validator.js";

/**
 * STORAGE TYPES CONTROLLERS
 */

export async function createStorageType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = storageTypeSchema.parse(req.body);
    const storageType = await prisma.storageType.create({ data });
    res.status(201).json({ message: "Tipo de trastero creado", storageType });
  } catch (error) {
    next(error);
  }
}

export async function listStorageTypes(_req: Request, res: Response, next: NextFunction) {
  try {
    const storageTypes = await prisma.storageType.findMany();
    res.status(200).json({ storageTypes });
  } catch (error) {
    next(error);
  }
}

/**
 * STORAGE UNITS CONTROLLERS
 */

export async function createStorageUnit(req: Request, res: Response, next: NextFunction) {
  try {
    // Generar código automáticamente
    const lastUnit = await prisma.storageUnit.findFirst({
      orderBy: { id: 'desc' },
    });

    let nextNumber = 1;
    if (lastUnit) {
      // Extraer el número del último código (formato T-XXX)
      const match = lastUnit.number.match(/T-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const generatedCode = `T-${nextNumber.toString().padStart(3, '0')}`;

    // Verificar que el código generado no exista (por si acaso)
    const existingUnit = await prisma.storageUnit.findUnique({
      where: { number: generatedCode },
    });

    if (existingUnit) {
      res.status(500).json({ error: "Error interno", message: "Error generando código único" });
      return;
    }

    const data = storageUnitSchema.parse({
      ...req.body,
      number: generatedCode,
      status: req.body.status || 'FREE' // Estado por defecto
    });

    const storageUnit = await prisma.storageUnit.create({
      data: {
        ...data,
        price: data.price.toString(),
        m2: data.m2.toString(),
        m3: data.m3.toString(),
      },
      include: { type: true }
    });

    res.status(201).json({ message: "Trastero creado con éxito", storageUnit });
  } catch (error) {
    next(error);
  }
}

export async function listStorageUnits(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, typeId, location } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (typeId) filters.typeId = parseInt(typeId as string);
    if (location) filters.location = { contains: location as string };

    const storageUnits = await prisma.storageUnit.findMany({
      where: filters,
      include: { type: true },
    });

    res.status(200).json({ storageUnits });
  } catch (error) {
    next(error);
  }
}

export async function getStorageUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const storageUnit = await prisma.storageUnit.findUnique({
      where: { id },
      include: { 
        type: true,
        contracts: {
          include: { user: true },
          where: { isActive: true }
        },
        invoices: {
          orderBy: { date: 'desc' }
        }
      },
    });

    if (!storageUnit) {
      res.status(404).json({ error: "No encontrado", message: "Trastero no encontrado" });
      return;
    }

    res.status(200).json({ storageUnit });
  } catch (error) {
    next(error);
  }
}

export async function updateStorageUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const data = updateStorageUnitSchema.parse(req.body);

    // Check if status is being changed to OCCUPIED
    if (data.status === 'OCCUPIED') {
      const currentUnit = await prisma.storageUnit.findUnique({
        where: { id },
        include: { contracts: { where: { isActive: true } } }
      });

      if (!currentUnit) {
        res.status(404).json({ error: "No encontrado", message: "Trastero no encontrado" });
        return;
      }

      // Check if there's an active contract
      if (currentUnit.contracts.length === 0) {
        res.status(400).json({
          error: "Validación fallida",
          message: "No se puede cambiar el estado a 'Ocupado' sin un contrato activo"
        });
        return;
      }
    }

    const updateData: any = { ...data };
    if (data.price !== undefined) updateData.price = data.price.toString();
    if (data.m2 !== undefined) updateData.m2 = data.m2.toString();
    if (data.m3 !== undefined) updateData.m3 = data.m3.toString();

    const updatedUnit = await prisma.storageUnit.update({
      where: { id },
      data: updateData,
      include: { type: true }
    });

    res.status(200).json({ message: "Trastero actualizado", storageUnit: updatedUnit });
  } catch (error) {
    next(error);
  }
}

export async function deleteStorageUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    
    // Check if it has active contracts
    const activeContracts = await prisma.contract.count({
      where: { storageUnitId: id, isActive: true }
    });

    if (activeContracts > 0) {
      res.status(400).json({ error: "Error", message: "No se puede eliminar un trastero con contratos activos" });
      return;
    }

    await prisma.storageUnit.delete({
      where: { id },
    });

    res.status(200).json({ message: "Trastero eliminado correctamente" });
  } catch (error) {
    next(error);
  }
}
