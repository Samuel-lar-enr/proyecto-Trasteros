import { Router } from "express";
import { 
  createStorageType, 
  listStorageTypes, 
  createStorageUnit, 
  listStorageUnits, 
  getStorageUnit, 
  updateStorageUnit, 
  deleteStorageUnit 
} from "../controllers/storage.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";

/**
 * Rutas de Trasteros y Tipos
 * Base path: /api/storage
 */

const router = Router();

// Rutas de Tipos de Trastero
router.get("/types", listStorageTypes);
router.post("/types", requireAdmin, createStorageType);

// Rutas de Trasteros
router.get("/units", listStorageUnits);
router.post("/units", requireAdmin, createStorageUnit);
router.get("/units/:id", requireAuth, getStorageUnit);
router.patch("/units/:id", requireAdmin, updateStorageUnit);
router.delete("/units/:id", requireAdmin, deleteStorageUnit);

export default router;
