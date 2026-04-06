import { Router } from "express";
import { 
  applyIpcIncrease, 
  listIpcBatches, 
  getIpcBatchDetails 
} from "../controllers/ipc.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

/**
 * Rutas de GESTIÓN DE IPC
 * Base path: /api/ipc
 */

const router = Router();

// Rutas de IPC
router.get("/batches", requireAdmin, listIpcBatches);
router.get("/batches/:id", requireAdmin, getIpcBatchDetails);
router.post("/apply", requireAdmin, applyIpcIncrease);

export default router;
