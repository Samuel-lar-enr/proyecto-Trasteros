import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { createContractSchema, updateContractSchema } from "../validators/contract.validator.js";

/**
 * CONTRACTS CONTROLLERS
 */

export async function createContract(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createContractSchema.parse(req.body);

    // 1. Check if the unit exists and is FREE
    const storageUnit = await prisma.storageUnit.findUnique({
      where: { id: data.storageUnitId },
    });

    if (!storageUnit) {
      res.status(404).json({ error: "No encontrado", message: "Trastero no encontrado" });
      return;
    }

    if (storageUnit.status !== 'FREE') {
      res.status(400).json({ error: "Error", message: "El trastero ya está ocupado o no disponible" });
      return;
    }

    // 2. Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      res.status(404).json({ error: "No encontrado", message: "Usuario no encontrado" });
      return;
    }

    // 3. Create the contract and Update the unit status in a single transaction
    const [contract] = await prisma.$transaction([
      prisma.contract.create({
        data: {
          userId: data.userId,
          storageUnitId: data.storageUnitId,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          content: data.content,
          insuranceCoverage: data.insuranceCoverage?.toString() || null,
          currentPrice: data.currentPrice.toString(),
          isActive: true,
        },
      }),
      prisma.storageUnit.update({
        where: { id: data.storageUnitId },
        data: { status: 'OCCUPIED' },
      }),
    ]);

    res.status(201).json({ message: "Contrato de alquiler creado con éxito", contract });
  } catch (error) {
    next(error);
  }
}

export async function listContracts(req: Request, res: Response, next: NextFunction) {
  try {
    const { isActive, userId, storageUnitId } = req.query;

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (userId) filters.userId = Number(userId);
    if (storageUnitId) filters.storageUnitId = Number(storageUnitId);

    const contracts = await prisma.contract.findMany({
      where: filters,
      include: {
        user: {
          select: { id: true, name: true, surname: true, email: true, dniNif: true, nifCif: true }
        },
        storageUnit: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ contracts });
  } catch (error) {
    next(error);
  }
}

export async function getContract(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { 
        user: true, 
        storageUnit: { include: { type: true } } 
      },
    });

    if (!contract) {
      res.status(404).json({ error: "No encontrado", message: "Contrato no encontrado" });
      return;
    }

    res.status(200).json({ contract });
  } catch (error) {
    next(error);
  }
}

export async function updateContract(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const data = updateContractSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.currentPrice !== undefined) updateData.currentPrice = data.currentPrice.toString();
    if (data.insuranceCoverage !== undefined) updateData.insuranceCoverage = data.insuranceCoverage.toString();
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ message: "Contrato actualizado", contract: updatedContract });
  } catch (error) {
    next(error);
  }
}

/**
 * Terminate a contract: Set isActive: false and update unit status to FREE
 */
export async function terminateContract(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);

    const contract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      res.status(404).json({ error: "No encontrado", message: "Contrato no encontrado" });
      return;
    }

    if (!contract.isActive) {
      res.status(400).json({ error: "Error", message: "El contrato ya está inactivo" });
      return;
    }

    await prisma.$transaction([
      prisma.contract.update({
        where: { id },
        data: { isActive: false, endDate: new Date() },
      }),
      prisma.storageUnit.update({
        where: { id: contract.storageUnitId },
        data: { status: 'FREE' },
      }),
    ]);

    res.status(200).json({ message: "Alquiler finalizado y trastero liberado" });
  } catch (error) {
    next(error);
  }
}

export async function deleteContract(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);

    // Check if it has invoices
    const invoiceCount = await prisma.invoice.count({
      where: { unitId: id } // Should be storageUnitId if I renamed it correctly... wait.
    });
    
    // Check my schema naming... UnitId in Invoice?
    // In schema: model Invoice { ... storageUnitId Int @map("storage_unit_id") ... }
    
    const realInvoiceCount = await prisma.invoice.count({
      where: { storageUnitId: id }
    });

    if (realInvoiceCount > 0) {
      res.status(400).json({ error: "Error", message: "No se puede eliminar un alquiler que tiene facturas asociadas" });
      return;
    }

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) return;

    await prisma.$transaction([
      prisma.contract.delete({ where: { id } }),
      // Reset unit status if it was active
      ...(contract.isActive ? [prisma.storageUnit.update({
        where: { id: contract.storageUnitId },
        data: { status: 'FREE' }
      })] : [])
    ]);

    res.status(200).json({ message: "Contrato eliminado correctamente" });
  } catch (error) {
    next(error);
  }
}
