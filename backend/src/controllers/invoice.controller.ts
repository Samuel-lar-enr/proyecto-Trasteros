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
        series: data.series || null,
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
 * Generate invoices for all active contracts for a specific month and year with SEQUENTIAL numbering
 */
export async function generateMonthlyInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    let { month, year, series } = batchGenerateSchema.parse(req.body);
    series = series || null;
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

    // 2. Find the last invoice number OF THE SPECIFIC YEAR to continue sequence or start at 0
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        series: series,
        date: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lt: new Date(Date.UTC(year + 1, 0, 1))
        }
      },
      orderBy: { id: 'desc' },
    });

    let currentSequence = 0;
    if (lastInvoice && lastInvoice.number.includes('-')) {
      const parts = lastInvoice.number.split('-');
      currentSequence = parseInt(parts[parts.length - 1]) || 0;
    }

    let createdCount = 0;
    const errors: string[] = [];

    // 3. Process each contract
    for (const contract of activeContracts) {
      try {
        // --- PREVENTION: Check if an invoice for this unit/month already exists ---
        const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
        const lastDayOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));

        const alreadyInvoiced = await prisma.invoice.findFirst({
          where: {
            storageUnitId: contract.storageUnitId,
            series: series,
            date: { gte: firstDayOfMonth, lte: lastDayOfMonth }
          }
        });

        if (alreadyInvoiced) {
          errors.push(`Trastero ${contract.storageUnit.number} ya facturado este periodo.`);
          continue;
        }

        // --- CALCULATION AND NUMBERING ---
        currentSequence++;
        const invoiceNumber = `${year}-${String(currentSequence).padStart(4, '0')}`;

        const price = Number(contract.currentPrice);
        const taxBase = price / (1 + vatRate);
        const vatAmount = price - taxBase;

        await prisma.invoice.create({
          data: {
            number: invoiceNumber,
            series,
            userId: contract.userId,
            storageUnitId: contract.storageUnitId,
            date: new Date(Date.UTC(year, month - 1, 1)),
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
      message: `¡Facturación terminada! ${createdCount} facturas nuevas generadas.`,
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

    // 1. Obtener la factura original
    const originalInvoice = await prisma.invoice.findUnique({ where: { id } });
    if (!originalInvoice) {
      res.status(404).json({ error: "No encontrado", message: "Factura no encontrada" });
      return;
    }

    // 2. Determinar el año para la numeración (usamos el año actual)
    const now = new Date();
    const year = now.getFullYear();

    // 3. Buscar el último número de factura para la misma serie y año actual
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        series: originalInvoice.series,
        date: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lt: new Date(Date.UTC(year + 1, 0, 1))
        }
      },
      orderBy: { id: 'desc' },
    });

    let currentSequence = 0;
    if (lastInvoice && lastInvoice.number.includes('-')) {
      const parts = lastInvoice.number.split('-');
      currentSequence = parseInt(parts[parts.length - 1]) || 0;
    }

    const nextSequence = currentSequence + 1;
    const nextNumber = `${year}-${String(nextSequence).padStart(4, '0')}`;

    // 4. Crear la contrafactura con valores negativos
    const counterInvoice = await prisma.invoice.create({
      data: {
        number: nextNumber,
        series: originalInvoice.series,
        userId: originalInvoice.userId,
        storageUnitId: originalInvoice.storageUnitId,
        date: now,
        taxBase: (Number(originalInvoice.taxBase) * -1).toFixed(2),
        vatAmount: (Number(originalInvoice.vatAmount) * -1).toFixed(2),
        total: (Number(originalInvoice.total) * -1).toFixed(2),
        status: 'RETURNED', // Las contrafacturas pueden marcarse como pagadas/efectivas para cuadrar caja
      }
    });

    res.status(201).json({ 
      message: "Contrafactura generada correctamente", 
      invoice: counterInvoice 
    });
  } catch (error) {
    next(error);
  }
}
export async function getSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const invoices = await prisma.invoice.findMany({
      select: { series: true },
      distinct: ['series'],
    });
    
    const seriesList = invoices
      .map(inv => inv.series)
      .filter((s): s is string => s !== null && s !== '');
    
    res.json({ series: seriesList });
  } catch (error) {
    next(error);
  }
}

export async function getNextInvoiceNumber(req: Request, res: Response, next: NextFunction) {
  try {
    const series = req.query.series as string || '';
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const where: any = {
      date: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1))
      }
    };

    if (!series || series === '') {
      where.OR = [
        { series: null },
        { series: '' }
      ];
    } else {
      where.series = series;
    }

    const lastInvoice = await prisma.invoice.findFirst({
      where,
      orderBy: { id: 'desc' },
    });

    let currentSequence = 0;
    if (lastInvoice && lastInvoice.number.includes('-')) {
      const parts = lastInvoice.number.split('-');
      currentSequence = parseInt(parts[parts.length - 1]) || 0;
    }

    const nextSequence = currentSequence + 1;
    const nextNumber = `${year}-${String(nextSequence).padStart(4, '0')}`;

    res.json({ nextNumber });
  } catch (error) {
    next(error);
  }
}
