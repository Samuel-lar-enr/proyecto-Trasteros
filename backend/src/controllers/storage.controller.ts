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
    const data = storageUnitSchema.parse(req.body);

    const existingUnit = await prisma.storageUnit.findUnique({
      where: { number: data.number },
    });

    if (existingUnit) {
      res.status(409).json({ error: "Conflicto", message: "Ya existe un trastero con ese número" });
      return;
    }

    const storageUnit = await prisma.storageUnit.create({
      data: {
        ...data,
        price: data.price.toString(),
        m2: data.m2.toString(),
        m3: data.m3.toString(),
      },
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

    const updateData: any = { ...data };
    if (data.price !== undefined) updateData.price = data.price.toString();
    if (data.m2 !== undefined) updateData.m2 = data.m2.toString();
    if (data.m3 !== undefined) updateData.m3 = data.m3.toString();

    const updatedUnit = await prisma.storageUnit.update({
      where: { id },
      data: updateData,
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
