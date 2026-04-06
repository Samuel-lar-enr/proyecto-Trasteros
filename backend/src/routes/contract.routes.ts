import { Router } from "express";
import { 
  createContract, 
  listContracts, 
  getContract, 
  updateContract, 
  terminateContract, 
  deleteContract 
} from "../controllers/contract.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";

/**
 * Rutas de Contratos / Alquileres
 * Base path: /api/contracts
 */

const router = Router();

// Rutas de Contratos
router.get("/", requireAdmin, listContracts);
router.post("/", requireAdmin, createContract);
router.get("/:id", requireAuth, getContract);
router.patch("/:id", requireAdmin, updateContract);
router.post("/:id/terminate", requireAdmin, terminateContract);
router.delete("/:id", requireAdmin, deleteContract);

export default router;
