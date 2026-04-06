import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { applyIpcSchema } from "../validators/ipc.validator.js";

/**
 * IPC INCREASE CONTROLLERS
 */

/**
 * POST /api/ipc/apply
 * Applies a percentage increase to all base prices and active contract prices
 */
export async function applyIpcIncrease(req: Request, res: Response, next: NextFunction) {
  try {
    const { percentage, observations } = applyIpcSchema.parse(req.body);
    const multiplier = 1 + (percentage / 100);

    // 1. Start a single transaction for everything
    const result = await prisma.$transaction(async (tx) => {
      // 1.1 Create the IPC Batch record
      const batch = await tx.ipcBatch.create({
        data: {
          percentage: percentage.toString(),
          observations: observations || "Subida programada",
        }
      });

      // 1.2 Get all storage units and their current active contracts
      const storageUnits = await tx.storageUnit.findMany({
        include: {
          contracts: {
            where: { isActive: true }
          }
        }
      });

      let processedCount = 0;

      // 1.3 Process each unit
      for (const unit of storageUnits) {
        const oldBasePrice = Number(unit.price);
        const newBasePrice = oldBasePrice * multiplier;
        const difference = newBasePrice - oldBasePrice;

        // Current active contract price (if any)
        const activeContract = unit.contracts[0];
        let oldContractPrice = 0;
        let newContractPrice = 0;

        if (activeContract) {
          oldContractPrice = Number(activeContract.currentPrice);
          newContractPrice = oldContractPrice * multiplier;

          // Update active contract price
          await tx.contract.update({
            where: { id: activeContract.id },
            data: { currentPrice: newContractPrice.toFixed(2) }
          });
        }

        // 1.4 Create the history entry for this unit
        await tx.ipcHistory.create({
          data: {
            batchId: batch.id,
            storageUnitId: unit.id,
            oldPrice: oldBasePrice.toFixed(2),
            newPrice: newBasePrice.toFixed(2),
            difference: difference.toFixed(2),
            oldContractPrice: oldContractPrice.toFixed(2),
            newContractPrice: newContractPrice.toFixed(2),
          }
        });

        // 1.5 Update the base price of the storage unit for future tenants
        await tx.storageUnit.update({
          where: { id: unit.id },
          data: { price: newBasePrice.toFixed(2) }
        });

        processedCount++;
      }

      return { batch, processedCount };
    });

    res.status(201).json({ 
      message: `¡Subida de IPC aplicada con éxito!`,
      details: {
        batchId: result.batch.id,
        percentage,
        unitsAffected: result.processedCount
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function listIpcBatches(req: Request, res: Response, next: NextFunction) {
  try {
    const batches = await prisma.ipcBatch.findMany({
      orderBy: { date: 'desc' },
      include: {
        _count: { select: { history: true } }
      }
    });
    res.status(200).json({ batches });
  } catch (error) {
    next(error);
  }
}

export async function getIpcBatchDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const batch = await prisma.ipcBatch.findUnique({
      where: { id },
      include: {
        history: {
          include: { storageUnit: true }
        }
      }
    });

    if (!batch) {
      res.status(404).json({ error: "No encontrado", message: "Lote de IPC no encontrado" });
      return;
    }

    res.status(200).json({ batch });
  } catch (error) {
    next(error);
  }
}
