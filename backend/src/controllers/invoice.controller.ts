import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { createInvoiceSchema, updateInvoiceStatusSchema, batchGenerateSchema } from "../validators/invoice.validator.js";

/**
 * INVOICES CONTROLLERS
 */

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createInvoiceSchema.parse(req.body);

    const invoice = await prisma.invoice.create({
      data: {
        ...data,
        taxBase: data.taxBase.toString(),
        vatAmount: data.vatAmount.toString(),
        total: data.total.toString(),
        date: data.date ? new Date(data.date) : new Date(),
      }
    });

    res.status(201).json({ message: "Factura creada con éxito", invoice });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate invoices for all active contracts for a specific month and year
 */
export async function generateMonthlyInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, year, series = 'A' } = batchGenerateSchema.parse(req.body);
    const vatRate = 0.21; // Standard 21% VAT in Spain

    // 1. Get all active contracts
    const activeContracts = await prisma.contract.findMany({
      where: { isActive: true },
      include: { storageUnit: true }
    });

    if (activeContracts.length === 0) {
      res.status(200).json({ message: "No hay contratos activos para facturar", count: 0 });
      return;
    }

    let createdCount = 0;
    const errors: string[] = [];

    // 2. Iterate and generate invoices
    for (const contract of activeContracts) {
      try {
        const monthStr = String(month).padStart(2, '0');
        const invoiceNumber = `${series}-${year}${monthStr}-${contract.id}`;

        // Check if invoice already exists for this unit in this month/year
        const existingInvoice = await prisma.invoice.findUnique({
          where: { number: invoiceNumber }
        });

        if (existingInvoice) {
          errors.push(`Contrato #${contract.id} ya tiene factura generada para este periodo`);
          continue;
        }

        const price = Number(contract.currentPrice);
        const taxBase = price / (1 + vatRate);
        const vatAmount = price - taxBase;

        await prisma.invoice.create({
          data: {
            number: invoiceNumber,
            series,
            userId: contract.userId,
            storageUnitId: contract.storageUnitId,
            date: new Date(year, month - 1, 1),
            taxBase: taxBase.toFixed(2),
            vatAmount: vatAmount.toFixed(2),
            total: price.toFixed(2),
            status: 'PENDING',
          }
        });
        createdCount++;
      } catch (err: any) {
        errors.push(`Error en Contrato #${contract.id}: ${err.message}`);
      }
    }

    res.status(201).json({ 
      message: `Proceso completado: ${createdCount} facturas generadas`,
      createdCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
}

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, userId, storageUnitId, dateStart, dateEnd } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (userId) filters.userId = Number(userId);
    if (storageUnitId) filters.storageUnitId = Number(storageUnitId);
    
    if (dateStart || dateEnd) {
      filters.date = {};
      if (dateStart) filters.date.gte = new Date(dateStart as string);
      if (dateEnd) filters.date.lte = new Date(dateEnd as string);
    }

    const invoices = await prisma.invoice.findMany({
      where: filters,
      include: {
        user: { select: { id: true, name: true, surname: true, email: true } },
        storageUnit: true,
      },
      orderBy: { date: 'desc' },
    });

    res.status(200).json({ invoices });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { 
        user: true, 
        storageUnit: { include: { type: true } } 
      },
    });

    if (!invoice) {
      res.status(404).json({ error: "No encontrado", message: "Factura no encontrada" });
      return;
    }

    res.status(200).json({ invoice });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoiceStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { status } = updateInvoiceStatusSchema.parse(req.body);

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({ message: "Estado de factura actualizado", invoice: updatedInvoice });
  } catch (error) {
    next(error);
  }
}

export async function deleteInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);

    // Only allow deleting PENDING invoices? Business rule might vary
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      res.status(404).json({ error: "No encontrado", message: "Factura no encontrada" });
      return;
    }

    if (invoice.status === 'PAID') {
      res.status(400).json({ error: "Error", message: "No se puede eliminar una factura ya pagada" });
      return;
    }

    await prisma.invoice.delete({ where: { id } });

    res.status(200).json({ message: "Factura eliminada correctamente" });
  } catch (error) {
    next(error);
  }
}
