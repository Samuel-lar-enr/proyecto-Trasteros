import { Router } from "express";
import { 
  createInvoice, 
  generateMonthlyInvoices, 
  listInvoices, 
  getInvoice, 
  updateInvoiceStatus, 
  deleteInvoice,
  getSeries,
  getNextInvoiceNumber
} from "../controllers/invoice.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";

/**
 * Rutas de Facturación
 * Base path: /api/invoices
 */

const router = Router();

// Rutas de Facturas
router.get("/", requireAdmin, listInvoices);
router.post("/", requireAdmin, createInvoice);
router.post("/batch-generate", requireAdmin, generateMonthlyInvoices);
router.get("/series", requireAdmin, getSeries);
router.get("/next-number", requireAdmin, getNextInvoiceNumber);
router.get("/:id", requireAuth, getInvoice);
router.patch("/:id/status", requireAdmin, updateInvoiceStatus);
router.delete("/:id", requireAdmin, deleteInvoice);

export default router;
